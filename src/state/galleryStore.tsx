import * as O from 'fp-ts/Option'
import * as TO from 'fp-ts/TaskOption'
import * as A from 'fp-ts/Array'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import * as RA from 'fp-ts/ReadonlyArray'
import * as N from 'fp-ts/number'
import * as Ord from 'fp-ts/Ord'
import { create } from 'zustand'
import { auctionsAtTheSameTime, BidEvent, PROVIDER_DOWN_MESSAGE, useParallelAuctionState, WonEvent } from './autoAuctionStore'
import { pipe } from 'fp-ts/lib/function'
import { formatAddr, fromWei } from '../utils/web3'
import { ethers } from 'ethers'


type GalleryData = WonEvent & {
    readonly totalBids: number,
    readonly totalBiddedAmount: bigint
}

type FormattedWonEvent = {
    readonly id: string,
    readonly winner: string,
    readonly price: string,
}

type FormattedGalleryData = FormattedWonEvent & {
    readonly totalBids: number,
    readonly totalBiddedAmount: string
}


const ordBigInt: Ord.Ord<bigint> = Ord.fromCompare((x,y) =>
    x < y ? -1 : y > y ? 1 : 0
)

const getCurrentWinnerOrdering: Ord.Ord<BidEvent> = pipe(
    ordBigInt,
    Ord.contramap(x => ethers.getBigInt(x.price))
)


type GalleryStoreState = {

    /**
     * @dev We compute the already `wonIds` so we know the limit of
     * the gallery.
     */
    wonIds: O.Option<readonly number[]>,

    /**
     * @dev Note that for all `n` in `number`: 
     *
     *    `!wonIds.value.includes(n)` iff `galleryCards.get(n) === undefined`
     *
     */
    galleryCards: Map<number, FormattedGalleryData>,

    
    /**
     * @dev Main functrion to query card data for `id`.
     */
    getGalleryCardDataFor: (id: number) => O.Option<FormattedGalleryData>,

    getAllWonIds: () => O.Option<readonly number[]>,

    formatGalleryData: (event: GalleryData) => FormattedGalleryData,


    /* --------------- HELPER FUNCTIONS --------------- */
    /**
     * @dev Tries to query the data for the already won auction for `id`.
     * @returns `O.none` If the auction has not yet ended or 
     *                   If some dependency is not available.
     */
    _updateGalleryCardData: (id: number) => Promise<O.Option<FormattedGalleryData>>,
        
    /**
     * @returns `O.none` if the ids didn't get updated, 
     *          `O.some(newUpdatedIds)` otherwise.
     */
    _updateWonIds: () => Promise<O.Option<readonly number[]>>,

}

export const useGalleryStore = create<GalleryStoreState>((set, get) => {return {

    galleryCards: new Map<number, FormattedGalleryData>(),
    wonIds: O.none,

    getGalleryCardDataFor: (id: number) => {
        const storedData = O.fromNullable(get().galleryCards.get(id))
        if (O.isNone(storedData)) get()._updateGalleryCardData(id)
        return storedData
    },

    getAllWonIds: () => {
        get()._updateWonIds()
        return get().wonIds
    },
        
    formatGalleryData: e => ({
        ...e,
        winner: O.getOrElse(PROVIDER_DOWN_MESSAGE)(formatAddr(e.winner)),
        id: e.id.toString(),
        price: fromWei(e.price),
        totalBiddedAmount: `ETH ${fromWei(e.totalBiddedAmount)}`,
    }),


    _updateGalleryCardData: async (id) => {
        
        // If the data is already available, return it.
        const storedData = get().galleryCards.get(id)
        if (storedData) return O.some(storedData)

        // If the data shouldn't be available, return none.
        if (pipe(
            useParallelAuctionState.getState().getLineFromId(id),
            O.exists(l => l.head < id)
        )) return O.none

        // Query all events needed to compute the auction data.
        const wonEventOpt = O.flatten(await pipe(
            TO.tryCatch(() => useParallelAuctionState.getState().getContractWonEventFor(id)),
        )())
    
        const bidEvents = O.flatten(await pipe(
            TO.tryCatch(() => useParallelAuctionState.getState().getContractBidEventFor(id))
        )())

        // If there are no bids the auction could never end.
        if (O.isNone(bidEvents)) return O.none


        const totalBids = pipe(
            bidEvents,
            O.map(x => x.length),
            O.getOrElse(() => 0)
        )

        const totalBiddedAmount = pipe(
            bidEvents,
            A.fromOption,
            A.flatten,
            A.map(x => x.price),
            A.map(ethers.getBigInt),
            A.reduce(BigInt(0), (a,v) => v + a),
        )
        
        // The auction could not have been settled, thats why we use
        // the `Bid` event to decide the winner. Note that this works
        // because of the second condition in this procedure.
        const wonEvent: O.Option<WonEvent> = O.isSome(wonEventOpt)
            ? wonEventOpt
            : pipe(
                bidEvents.value,
                A.reduce({price: BigInt(0)} as BidEvent, Ord.max(getCurrentWinnerOrdering)),
                event => O.of({ ...event, winner: event.bidder })
            )
        
        console.log('res event:')
        console.log(wonEvent)

        const galleryData = pipe(
            wonEvent,
            O.map(x => ({...x, totalBids, totalBiddedAmount })),
            O.map(get().formatGalleryData),
        )

        if (O.isNone(galleryData)) return O.none

        set({ galleryCards: get().galleryCards.set(id, galleryData.value) })
        
        return galleryData
    },
    
    
    // TODO FIXME All those computations are intensive af, maybe I
    // could add them into a mutex or something? Another way of
    // optimizing it is making it immutable and only updateable by a
    // certain method (from, for example, bid event handling).
    _updateWonIds: async () => {

        const currentWonIds = pipe(
            get().wonIds,
            O.getOrElse(() => [] as readonly number[])
        )

        const currentlyAuctionedIds = await useParallelAuctionState
            .getState()
            .getCurrentlyAuctionedIds() 
        
        /**
         * @dev Let `ids` be `currentlyAuctionedIds.value`.
         * Let's say `ids == {7,5,9}`. That can only mean that
         * `ids.map(id => id - 3)` are already won ids. Let these ids
         * be `ids'`. That means that all the won ids are 
         *              
         *         {1, 2, ..., min(ids') - 1} U ids'
         *
         * Let this set be `ids''`.
         *
         * So, in the following procedure, we first compute `ids'` in
         * `possibleWonIdsToUpdate`. Then we check if we even need to
         * update `ids''` in `shouldUpdate`. Finally we compute
         * `ids''` as explained and update the store state.
         */
        const newIds = pipe(
            O.Do,
            O.bind('auctionedIds', () => currentlyAuctionedIds),
            O.bind('wonIds', () => O.of(currentWonIds)),
            O.bind('possibleWonIdsToUpdate', ({ auctionedIds }) => O.of(pipe(
                auctionedIds,
                A.map(id => id - auctionsAtTheSameTime),
                A.filter(id => id > 0),
            ))),
            O.bind('shouldUpdate', ({ possibleWonIdsToUpdate, wonIds }) => O.of(pipe(
                possibleWonIdsToUpdate,
                A.exists(id => !wonIds.includes(id))
            ))),
            O.flatMap(({ shouldUpdate, possibleWonIdsToUpdate }) => pipe(
                Math.min(...possibleWonIdsToUpdate) - 1,
                O.fromPredicate(() => shouldUpdate),
                O.map(min => min > 0 ? RNEA.range(1, min) : []),
                O.map(RA.concat(possibleWonIdsToUpdate)),
                O.map(RA.sort(N.Ord)),
            )),
        )
        
        if (O.isSome(newIds)) set({ wonIds: newIds })
        
        return newIds
    }

}})
