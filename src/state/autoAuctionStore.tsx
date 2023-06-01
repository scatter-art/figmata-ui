import { ethers, Signer } from 'ethers'
import { create } from 'zustand'

import * as O from 'fp-ts/Option'
import * as TO from 'fp-ts/TaskOption'
import * as A from 'fp-ts/Array'
import {pipe } from 'fp-ts/lib/function'

import { 
    IExternallyMintable,
    IExternallyMintable__factory,
    IParallelAutoAuction, IParallelAutoAuction__factory 
} from '../types'

import { useUserStore } from './userStore'
import { msTimeLeft, TO2 } from '../utils/pure'
import { AuctionConfigStruct, LineStateStruct } from '../types/IHoldsParallelAutoAuctionData'
import { toWei } from '../utils/web3'


type ParallelAuctionData = {
    readonly auctionAddress: string,
    readonly auctionContract: IParallelAutoAuction,
    readonly auctionConfig: AuctionConfigStruct,
    readonly auctionedTokenAddress: string,
    readonly auctionedToken: IExternallyMintable,
    readonly tokenName: string,
    readonly tokenImagesUri: string
}

/**
 * @dev This store provides differente secure abstractions to interact
 * with a `ParallelAutoAuction.sol` contract. The user only needs
 * to call `setAuctionData` and ensure that theres a provider (see
 * `./userStore.tsx`).
 */
type ParallelAuctionStoreState = {
    /**
     * @returns General auction instantiation data, see
     * `PaallelAuctionData` typedef for more.
     * @notice All `ParallelAuctionData` properites are binded by
     * `O.Option`. Ie, if any of the properties is set, that means
     * all properties must be set.
     */
    auctionData: O.Option<ParallelAuctionData>,
    
    currentLineIndex: number,

    lines: O.Option<O.Option<LineStateStruct>[]>,
    
    /* ------------- LINE MANIPULATION FUNCTIONS ------------- */

    /**
     * @returns Some line at `lines[index]`.
     * None iff `index` is not valid.
     */
    getLine: (index: number) => O.Option<LineStateStruct>,

    /**
     * @returns The selected line based on `currentLineIndex`.
     */
    getCurrentSelectedLine: () => O.Option<LineStateStruct>,
    
    /**
     * @dev Sets `currentLineIndex := index` iff `index` is a valid index.
     */
    setCurrentSelectedIndex: (index: number) => void,
    
    // TODO refactor so it gets an index.
    /**
     * @dev Updates in `lines` the inputed `line`.
     * @returns A new updated line.
     */
    updateLine: (lineIndexToUpdate: number) => Promise<O.Option<LineStateStruct>>,
    
    setAuctionData: (
        auctionAddress: string[42], 
        auctionedTokenName: string, 
        tokenImagesUri: string
    ) => void,
    
    /**
     * @dev This function will reinitialize `auctionData` but using
     * the user provider if its set.
     */
    updateContractsProvider: () => void,

    getImage: (tokenId: O.Option<number>) => string,

    getCollectionName: () => O.Option<string>,

    getCurrentTokenName: () => O.Option<string>,

    getAuctionConfig: () => O.Option<AuctionConfigStruct>,
    
    createBid: (value: number) => Promise<O.Option<ethers.ContractTransactionResponse>>,
    
    /**
     * @dev It will set an event so the lines get automatically
     * updated after the auction time ends.
     */
    _setLinesTimers: () => void,
    
    /**
     * @dev It will set an event so `lineOpt` gets automatically
     * updated after its auction time ends.
     */
    _setLineTimer: (lineIndex: number) => void

}

export const useParallelAuctionState = create<ParallelAuctionStoreState>((set, get) => {return {

    auctionData: O.none,
    currentLineIndex: 0,
    lines: O.none,

    getLine: (index: number) => pipe(
        get().lines,
        O.flatMap(lines => lines[index])
    ),

    getCurrentSelectedLine: () => get().getLine(get().currentLineIndex),

    setCurrentSelectedIndex: (index: number) => {
        if (O.isSome(get().getLine(index))) set({ currentLineIndex: index })
    },


    setAuctionData: async (
        auctionAddress: string[42], 
        auctionedTokenName: string, 
        tokenImagesUri: string
    ) => {

        // This condition ensures `auctionData` immutability since
        // this function is quite expensive to evaluate. Note that by 
        // design, the condition will only be true if all `auctionData`
        // fields are correctly set, ie, theres no need to reevaluate
        // this function.
        if (O.isSome(get().auctionData) && O.isSome(get().lines)) return

        if (!ethers.isAddress(auctionAddress)) return
        
        const bestProvider = useUserStore.getState().getBestProvider()
        
        const auctionContract = pipe(
            bestProvider,
            O.map(prov => IParallelAutoAuction__factory.connect(auctionAddress, prov))
        )

        const auctionConfig = await pipe(
            auctionContract,
            TO.fromOption,
            TO2.flatTry(auction => auction.auctionConfig())
        )()


        const auctionedTokenAddr = await pipe(
            TO.fromOption(auctionContract),
            TO2.flatTry(auction => auction.getAuctionedToken())
        )()

        const auctionedToken = pipe(
            O.Do,
            O.bind('provider', () => bestProvider),
            O.bind('tokenAddress', () => auctionedTokenAddr),
            O.map(({ tokenAddress, provider }) => 
                IExternallyMintable__factory.connect(tokenAddress, provider)
            )
        )

        // Build the final data by unwrapping all Options.
        const data: O.Option<ParallelAuctionData> = pipe(
            O.Do,
            O.bind('auctionContract', () => auctionContract),
            O.bind('auctionConfig', () => auctionConfig),
            O.bind('auctionedTokenAddress', () => auctionedTokenAddr),
            O.bind('auctionedToken', () => auctionedToken),
            O.bind('tokenName', () => O.of(auctionedTokenName)),
            O.bind('tokenImagesUri', () => O.of(tokenImagesUri)),
            O.map((data) => ({...data, auctionAddress}))
        )
        
        set({ auctionData: data })
        
        // Once updated the auction data we get all the lines state.
        const maxSupply = await pipe(
            TO.fromOption(auctionedToken),
            TO2.flatTry(token => token.maxSupply())
        )()

        const lineOpts = await pipe(
            O.Do,
            O.bind('auction', () => auctionContract),
            O.bind('maxSupply', () => maxSupply),
            TO.fromOption,
            TO.bind('lines', ({ auction }) => TO.tryCatch(() => auction.lineStates())),
            TO.map(({ lines, maxSupply }) => pipe(
                lines,
                A.map(O.fromPredicate(line => maxSupply >= line.head))
            )),
        )()
        
        set({ lines: lineOpts })
        get()._setLinesTimers()

    },
    
    updateContractsProvider: () => {
        const userProviderOpt = useUserStore.getState().userProvider
        const auctionDataOpt = get().auctionData

        if (O.isNone(auctionDataOpt) || O.isNone(userProviderOpt)) return

        const userProvider = userProviderOpt.value
        const data = auctionDataOpt.value
        
        const auctionContract = IParallelAutoAuction__factory.connect(data.auctionAddress, userProvider)
        const auctionedToken = IExternallyMintable__factory.connect(data.auctionedTokenAddress, userProvider)
    
        set({ auctionData: O.of({...data, auctionContract, auctionedToken }) })
    },
    
    updateLine: async (lineIndexToUpdate: number) => {

        const lineToUpdate = get().getLine(lineIndexToUpdate)

        const newLine = await pipe(
            O.Do,
            O.bind('lineToUpdate', () => lineToUpdate),
            O.bind('auctionData', () => get().auctionData),
            TO.fromOption,
            TO.flatMap(({ auctionData, lineToUpdate }) => TO.tryCatch( 
                () => auctionData.auctionContract.lineState(Number(lineToUpdate.head))
            )),
        )()

    
        const allLines = get().lines
        
        // NOTE Index could be out of bounds.
        const indexToMutate = pipe(
            O.Do,
            O.bind('allLines', () => allLines),
            O.bind('lineToUpdate', () => lineToUpdate),
            O.map(({ allLines, lineToUpdate }) => allLines.findIndex(pipe(
                O.exists(line => line.head === lineToUpdate.head),
            ))),
        )

        const updatedLines = pipe(
            O.Do,
            O.bind('i', () => indexToMutate),
            O.bind('allLines', () => allLines),
            O.map(({ i, allLines }) => {
                if (allLines[i] !== undefined) allLines[i] = newLine
                return allLines
            })
        )
        
        if (O.isSome(updatedLines)) {
            set({ lines: updatedLines })
            get()._setLineTimer(lineIndexToUpdate)
        }

        return newLine
    },
    
    getImage: (tokenId: O.Option<number>) => pipe( 
        O.Do,
        O.bind('id', () => tokenId),
        O.bind('data', () => get().auctionData),
        O.bind('uri', ({ data }) => O.of(data.tokenImagesUri)),
        O.map(({ id, uri })=> `${uri}/${id}.png`),
        O.getOrElse(() => '/404.png')
    ),
    
    getCollectionName: () => pipe(
        get().auctionData,
        O.map(data => data.tokenName)
    ),

    getCurrentTokenName: () => pipe(
        O.Do,
        O.bind('name', get().getCollectionName),
        O.bind('line', get().getCurrentSelectedLine),
        O.map(({ name, line }) => `${name} #${line.head}`)
    ),

    getAuctionConfig: () => pipe(
        get().auctionData,
        O.map(data => data.auctionConfig)
    ),
    
    // TODO This solution is ugly af, can't I use the user wallet for
    // signing and querying at the same time?
    createBid: async (value: number) => await pipe(
        O.Do,
        O.bind('signer', () => useUserStore.getState().userSigner),
        O.bind('data', () => get().auctionData),
        O.bind('auction', ({ data }) => O.of(data.auctionContract)),
        O.bind('line', get().getCurrentSelectedLine),
        TO.fromOption,
        TO.flatMap(({ auction, line, signer }) => TO.tryCatch(() => 
            (auction.connect(signer) as typeof auction)
                .createBid(line.head, { value: toWei(value)})
        ))
    )(),
        
    _setLinesTimers: () => pipe(
        get().lines,
        O.map(A.mapWithIndex((i,_) => get()._setLineTimer(i)))
    ),
    
    _setLineTimer: (lineIndex: number) => pipe(
        get().getLine(lineIndex),
        O.map(line => setTimeout(
            async () => await get().updateLine(lineIndex),
            msTimeLeft(ethers.toNumber(line.endTime))
        ))
    )

}})

