import { create } from 'zustand'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'
import { LineStateStruct } from '../types/IHoldsParallelAutoAuctionData'
import { msTimeLeft } from '../utils/pure'
import { ethers } from 'ethers'
import {  useParallelAuctionState } from './autoAuctionStore'

type LineTimeoutStoreState = {

    timers: O.Option<NodeJS.Timeout>[],

    /**
     * @dev Function that will run on any timer end for `index`.
     */
    onTimerEndCallback: O.Option<(index: number) => void>,
        
    setCallbackIfDoesntExist: (f: (index: number) => void) => void,

    clearAndSetTimerFor: (index: number, line: LineStateStruct) => void

    /**
     * @dev It will try to query `line` based on `index`.
     * Because the line queried from the `autoAuctionStore` might be
     * none, this function might do nothing.
     */
    maybeClearAndSetTimerFor: (index: number) => void

}

export const useLineTimersStore = create<LineTimeoutStoreState>((set, get) => {return {
    
    // Once again ugly hardcode :(.
    timers: new Array(10).fill(O.none),

    onTimerEndCallback: O.none,

    setCallbackIfDoesntExist: f => {
        if (O.isNone(get().onTimerEndCallback))
            set({ onTimerEndCallback: O.some(f) })
    },

    clearAndSetTimerFor: (index, line) => {
        // Clear last timeout if it exists.
        pipe(
            get().timers[index],
            O.map(clearTimeout)
        )
        
        // Set callback if it exists.
        pipe(
            get().onTimerEndCallback,
            O.map(f => () => f(index)),
            O.map(f => setTimeout(f, msTimeLeft(ethers.toNumber(line.endTime)))),
            O.map(t => set(({ timers }) => {
                timers[index] = O.of(t)
                return { timers }
            })),
        )
    },
    
    maybeClearAndSetTimerFor: index => pipe(
        useParallelAuctionState.getState().getLine(index),
        O.map(l => get().clearAndSetTimerFor(index, l))
    ),
         

}})


