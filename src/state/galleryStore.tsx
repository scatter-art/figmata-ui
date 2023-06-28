import * as O from 'fp-ts/Option'
import { BigNumberish } from 'ethers'
import { create } from 'zustand'
import { PROVIDER_DOWN_MESSAGE, useParallelAuctionState, WonEvent } from './autoAuctionStore'
import { pipe } from 'fp-ts/lib/function'
import * as TO from 'fp-ts/TaskOption'
import { formatAddr, fromWei } from '../utils/web3'

type FormattedWonEvent = {
    readonly id: string,
    readonly winner: string,
    readonly price: string
}

type GalleryStoreState = {
    galleryCards: Map<BigNumberish, WonEvent>,

    getGalleryCardDataFor: (id: BigNumberish) => Promise<O.Option<FormattedWonEvent>>,

    formatWonEvent: (event: WonEvent) => FormattedWonEvent
}

export const useGalleryStore = create<GalleryStoreState>((set, get) => {return {
    galleryCards: new Map<string, WonEvent>(),

    getGalleryCardDataFor: async (id) => {

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

    formatWonEvent: e => ({
        winner: O.getOrElse(PROVIDER_DOWN_MESSAGE)(formatAddr(e.winner)),
        id: e.id.toString(),
        price: fromWei(e.price)
    })

}})
