import * as O from 'fp-ts/Option'
import * as E from 'fp-ts/Either'
import * as TO from 'fp-ts/TaskOption'
import * as A from 'fp-ts/Array'
import * as RA from 'fp-ts/ReadonlyArray'
import * as Ord from 'fp-ts/Ord'
import { create } from 'zustand'
import { 
    auctionsAtTheSameTime,
    BidEvent,
    PROVIDER_DOWN_MESSAGE,
    useParallelAuctionState,
    WonEvent
} from './autoAuctionStore'
import { pipe } from 'fp-ts/lib/function'
import { formatAddr, fromWei, ZERO_ADDR } from '../utils/web3'
import { ethers } from 'ethers'
import { Mutex } from 'async-mutex'

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
    x < y ? -1 : x > y ? 1 : 0
)

const getCurrentWinnerOrdering: Ord.Ord<BidEvent> = pipe(
    ordBigInt,
    Ord.contramap(x => ethers.getBigInt(x.price))
)

const queryCardDataMutex = new Mutex()


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

    /**
     * @dev Tries to reverse `wonIds` if theyre present and returns
     * the updated list.
     * @returns E.left If `wonIds` are not present.
     */
    reverseGallery: () => E.Either<string, readonly number[]>,

    formatGalleryData: (event: GalleryData) => FormattedGalleryData,


    /* --------------- HELPER FUNCTIONS --------------- */
    /**
     * @dev Tries to query the data for the already won auction for `id`.
     * @returns `O.none` If the auction has not yet ended or 
     *                   If some dependency is not available.
     */
    _updateGalleryCardData: (id: number) => Promise<O.Option<FormattedGalleryData>>,

    /**
     * @dev Performs like `_updateGalleryCardData` but without a mutex.
     */
    _unsafeUpdateGalleryCardData: (id: number) => Promise<O.Option<FormattedGalleryData>>,
        
    /**
     * @returns `O.none` if the ids didn't get updated, 
     *          `O.some(newUpdatedIds)` otherwise.
     */
    _updateWonIds: () => Promise<O.Option<readonly number[]>>,

    /**
     * @dev Let `m` be `acutionsAtTheSameTime`.
     * Then it will return `[n, n - m, n - 2m, ...]` until 0.
     */
    _idsRange: (n: number) => number[],

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

    reverseGallery: () => pipe( 
        get().wonIds,
        O.map(x => RA.reverse(x)),
        E.fromOption(() => 'the gallery is not present'),
        E.map(x => {set({ wonIds: O.of(x) }); return x})
    ),
        
    formatGalleryData: e => ({
        ...e,
        winner: O.getOrElse(PROVIDER_DOWN_MESSAGE)(formatAddr(e.winner)),
        id: e.id.toString(),
        price: fromWei(e.price),
        totalBiddedAmount: `ETH ${fromWei(e.totalBiddedAmount)}`,
    }),


    // TODO This could get further optimized if you had a mutex for
    // each galler card, so they run independently.
    _updateGalleryCardData: async (id) => await queryCardDataMutex.runExclusive(() => 
        get()._unsafeUpdateGalleryCardData(id)
    ),

    _unsafeUpdateGalleryCardData: async (id) => {
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
                A.reduce(
                    {price: BigInt(-1), id: BigInt(id), bidder: ZERO_ADDR} as BidEvent,
                    Ord.max(getCurrentWinnerOrdering)
                ),
                event => O.of({ ...event, winner: event.bidder })
            )
        
        const galleryData = pipe(
            wonEvent,
            O.map(x => ({...x, totalBids, totalBiddedAmount })),
            O.map(get().formatGalleryData),
        )

        if (O.isNone(galleryData)) return O.none

        set({ galleryCards: get().galleryCards.set(id, galleryData.value) })
        
        return galleryData
    },
    
    _updateWonIds: async () => {
        const currentlyAuctionedIds = await useParallelAuctionState
            .getState()
            .getCurrentlyAuctionedIds() 
        
        if (O.isNone(currentlyAuctionedIds)) return O.none


        const newIds = pipe(
            currentlyAuctionedIds.value,
            A.map(x => x - auctionsAtTheSameTime),
            A.flatMap(get()._idsRange),
            A.sort(Ord.ordNumber)
        )
        
        set({ wonIds: O.some(newIds) })

        return O.some(newIds)
    },

    _idsRange: (n: number): number[] => {
        var mods = []
        for (let i = 0;; i++) {
            const mod = n - i * auctionsAtTheSameTime
            if (mod < 1) return mods
            mods.push(mod)
        }
    }

}})
