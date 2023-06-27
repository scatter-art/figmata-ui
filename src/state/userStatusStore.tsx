import * as S from 'fp-ts/Set'
import * as O from 'fp-ts/Option'
import * as Str from 'fp-ts/string'
import { LineStateStruct } from '../types/IHoldsParallelAutoAuctionData'
import { create } from 'zustand'
import { useUserStore } from './userStore'
import { pipe } from 'fp-ts/lib/function'
import { auctionsAtTheSameTime } from './autoAuctionStore'
import { ZERO_ADDR } from '../utils/web3'

const setDel = S.remove(Str.Eq)
const setAdd = S.insert(Str.Eq)


type UserStatusStoreState = {

    winningIds: Set<string>,

    outbiddedIds: Set<string>,
    
    getUserIsWinningLine: (line: LineStateStruct) => boolean,

    getUserGotOutbiddedForLine: (line: LineStateStruct) => boolean,

    
    /**
     * @returns If the user still needs to claim a line. Of course, it
     * will only be true if he won that line.
     */
    getUserHasToClaimLine: (line: LineStateStruct) => boolean,

    /* -------- Opt Wrappers --------*/
    getOptUserIsWinningLine: (line: O.Option<LineStateStruct>) => boolean,
    getOptUserGotOutbiddedForLine: (line: O.Option<LineStateStruct>) => boolean,
    getOptUserHasToClaimLine: (line: O.Option<LineStateStruct>) => boolean,

    /* -------- State enum return --------*/
    getUserLineStatus: (line: O.Option<LineStateStruct>) => O.Option<
        'userIsWinning' | 'userGotOutbidded' | 'userHasToClaim'
    >
}

export const useUserStatusStore = create<UserStatusStoreState>((set, get) => {return {
    winningIds: new Set(),
    outbiddedIds: new Set(),

    getUserIsWinningLine: line => {

        const winningIds = get().winningIds
        const outbiddedIds = get().outbiddedIds
        const head = line.head.toString()
        
        const userIsWinningLine = pipe(
            useUserStore.getState().userAddress,
            O.exists(addr => line.currentWinner.toString() === addr)
        )

        if (userIsWinningLine) pipe(
            winningIds,
            setAdd(head),
            winningIds => set({ winningIds })
        )
        else if (winningIds.has(head)) pipe(
            winningIds,
            setDel(head),
            winningIds => set({ winningIds }),
            _ => outbiddedIds,
            setAdd(head),
            outbiddedIds => set({ outbiddedIds })
        ) 
        
        return get().winningIds.has(head)
    },

    getUserGotOutbiddedForLine: line => {
        get().getUserIsWinningLine(line)
        return get().outbiddedIds.has(line.head.toString())
    },

    getUserHasToClaimLine: line => {
        
        // If it was already claimed return false.
        if (line.currentWinner.toString() !== ZERO_ADDR) return false
        
        const idToClaim = O.tryCatch(() => Number(line.head.valueOf()) - auctionsAtTheSameTime)
        if (O.isNone(idToClaim)) return false
    
        if (get().outbiddedIds.has(idToClaim.value.toString())) return false
        if (get().winningIds.has(idToClaim.value.toString())) return true

        return false 
    },


    /* -------- Opt Wrappers --------*/
    getOptUserIsWinningLine:       l => pipe(l, O.exists(get().getUserIsWinningLine)),
    getOptUserGotOutbiddedForLine: l => pipe(l, O.exists(get().getUserIsWinningLine)),
    getOptUserHasToClaimLine:      l => pipe(l, O.exists(get().getUserIsWinningLine)),

    /* -------- State enum return --------*/
    getUserLineStatus: l => {
        if (get().getOptUserIsWinningLine(l))       return O.some('userIsWinning')
        if (get().getOptUserGotOutbiddedForLine(l)) return O.some('userGotOutbidded')
        if (get().getOptUserHasToClaimLine(l))      return O.some('userHasToClaim')
        return O.none
    }

}})


