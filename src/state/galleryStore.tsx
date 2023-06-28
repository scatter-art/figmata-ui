import * as O from 'fp-ts/Option'
import * as TO from 'fp-ts/TaskOption'
import * as A from 'fp-ts/Array'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import * as RA from 'fp-ts/ReadonlyArray'
import { BigNumberish } from 'ethers'
import { create } from 'zustand'
import { auctionsAtTheSameTime, PROVIDER_DOWN_MESSAGE, useParallelAuctionState, WonEvent } from './autoAuctionStore'
import { pipe } from 'fp-ts/lib/function'
import { formatAddr, fromWei } from '../utils/web3'
import { fplog } from '../utils/pure'

type FormattedWonEvent = {
    readonly id: string,
    readonly winner: string,
    readonly price: string
}

type GalleryStoreState = {

    galleryCards: Map<number, WonEvent>,
    wonIds: O.Option< readonly number[]>,

    getGalleryCardDataFor: (id: number) => O.Option<FormattedWonEvent>,

    getAllWonIds: () => O.Option<readonly number[]>,

    formatWonEvent: (event: WonEvent) => FormattedWonEvent,
    /* --------------- HELPER FUNCTIONS --------------- */
    _updateGalleryCardData: (id: number) => Promise<O.Option<FormattedWonEvent>>,

    _updateWonIds: () => void,
}

export const useGalleryStore = create<GalleryStoreState>((set, get) => {return {

    galleryCards: new Map<number, WonEvent>(),
    wonIds: O.none, 

    getGalleryCardDataFor: (id: number) => {
        const storedData = pipe(
            O.fromNullable(get().galleryCards.get(id)),
            O.map(x => get().formatWonEvent(x)),
        )

        if (O.isNone(storedData)) get()._updateGalleryCardData(id)
        return storedData
    },

    getAllWonIds: () => {
        get()._updateWonIds()
        return get().wonIds
    },

    formatWonEvent: e => ({
        winner: O.getOrElse(PROVIDER_DOWN_MESSAGE)(formatAddr(e.winner)),
        id: e.id.toString(),
        price: fromWei(e.price)
    }),


    _updateGalleryCardData: async (id) => {
            
        const storedData = get().galleryCards.get(id)
        
        // If the data is already available return it.
        if (storedData) return pipe(
            storedData,
            get().formatWonEvent,
            O.some
        )
        
        const event = O.flatten(await pipe(
            TO.tryCatch(() => useParallelAuctionState.getState().getContractWonEventFor(id)),
        )())
        
        if (O.isNone(event)) return O.none
    
        set({ galleryCards: get().galleryCards.set(id, event.value) })
        
        return pipe(
            event.value,
            get().formatWonEvent,
            O.some
        )
    },

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
         * Lest say `ids == {7,5,9}`. That can only mean that
         * `ids.map(id => id - 3)` are already won ids. Let that ids
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
        pipe(
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
                min => min > 0 ? RNEA.range(1, min) : [],
                RA.concat(possibleWonIdsToUpdate),
                O.fromPredicate(() => shouldUpdate)
            )),
            O.map(ids => set({ wonIds: O.of(ids) }))
        )

    }


}})
