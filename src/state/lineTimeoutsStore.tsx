import { create } from 'zustand'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'
import { LineStateStruct } from '../types/IHoldsParallelAutoAuctionData'
import { msTimeLeft } from '../utils/pure'
import { ethers } from 'ethers'

type LineTimeoutStoreState = {
    timers: O.Option<number>[],

    /**
     * @dev Function that will run on any timer end for `index`.
     */
    onTimerEndCallback: O.Option<(index: number) => void>,
        
    setCallbackIfDoesntExist: (f: (index: number) => void) => void,

    clearAndSetTimerFor: (index: number, line: LineStateStruct) => void

}

const test4 = pipe(
    O.some(4),
    O.map(x => x * 2),
    O.map(x => x + 1)
)

export const useLineTimersStore = create<LineTimeoutStoreState>((set, get) => {return {
    timers: [O.none],
    onTimerEndCallback: O.none,
    setCallbackIfDoesntExist: f => {
        if (O.isNone(get().onTimerEndCallback))
            set({ onTimerEndCallback: O.some(f)})
    },

    clearAndSetTimerFor: (index: number, line: LineStateStruct) => {
        // Clear last timeout if it exists.
        pipe(
            get().timers[index], 
            O.map(clearTimeout)
        )
        // Set callback if it exists.
        pipe(
            get().onTimerEndCallback,
            O.map(f => setTimeout(f, msTimeLeft(ethers.toNumber(line.endTime)))),
            O.map(t => set(({ timers }) => {
                timers[index] = O.of(t)
                return { timers }
            })),
        )
    }
}})


