import { ethers } from 'ethers'
import { create } from 'zustand'

import * as O from 'fp-ts/Option'
import * as TO from 'fp-ts/TaskOption'
import * as A from 'fp-ts/Array'
import { pipe } from 'fp-ts/lib/function'

import { 
    IExternallyMintable,
    IExternallyMintable__factory,
    IParallelAutoAuction, IParallelAutoAuction__factory 
} from '../types'

import { useUserStore } from './userStore'
import { TO2 } from '../utils/pure'
import { LineStateStruct } from '../types/IHoldsParallelAutoAuctionData'


type ParallelAuctionData = {
    readonly auctionAddress: string,
    readonly auctionContract: IParallelAutoAuction,
    readonly auctionedTokenAddress: string,
    readonly auctionedToken: IExternallyMintable,
    readonly tokenName: string,
    readonly tokenImagesUri: string,
    lines: O.Option<LineStateStruct>[]
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
    
    /**
     * @returns The current selected line index for `auctionData.lines`.
     */
    currentSelectedLine: O.Option<LineStateStruct>,
    
    // TODO do some checks on `tokenImagesUri`.
    setAuctionData: (
        auctionAddress: string[42], 
        auctionedTokenName: string, 
        tokenImagesUri: string
    ) => void,


    getIdsToAuction: () => Promise<O.Option<number[]>>,
    
    /**
     * @returns An maybe `LineStateStruct`. This type should hold
     * enough information to place bids, if not, see `getMinPrice`.
     */
    getLineState: (tokenId: number) => Promise<O.Option<LineStateStruct>>,
    
    /**
     * @returns The minimum price the user should pay for a bid of `tokenId`.
     */
    getMinPrice: (tokenId: number) => Promise<O.Option<bigint>>,

    getImage: (tokenId: number) => string,

    // TODO some kind of setCurrentSelectedLineIndex or whatever.
    
    getCollectionName: () => O.Option<string>,

    getCurrentTokenName: () => O.Option<string>,
    
    getAllCurrentLines: () => O.Option<LineStateStruct>[],
    
    /**
     * @dev Updates in `auctionData.lines` the inputed `line`.
     * @returns A new updated line.
     */
    updateLine: (line: O.Option<LineStateStruct>) => Promise<O.Option<LineStateStruct>>,

}

export const useParallelAuctionState = create<ParallelAuctionStoreState>((set, get) => {return {

    auctionData: O.none,

    currentSelectedLine: O.none,

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
        if (O.isSome(get().auctionData)) return

        //const getBestProvider = useUserStore(state => state.getBestProvider)
        const getBestProvider = useUserStore.getState().getBestProvider

        // If the new `addr` is the same as `currentAddress` just return
        // to evite redundant computations.
        if (pipe(pipe(
            get().auctionData,
            O.map(d => d.auctionAddress)
        ), O.exists(addr => addr === auctionAddress))) return
        
        if (!ethers.isAddress(auctionAddress)) return
        
        const bestProvider = getBestProvider()
        
        const auctionContract = pipe(
            bestProvider,
            O.map(prov => IParallelAutoAuction__factory.connect(auctionAddress, prov))
        )

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
            ))
        )()
        
        // Build the final data by unwrapping all Options.
        const data: O.Option<ParallelAuctionData> = pipe(
            O.Do,
            O.bind('auctionContract', () => auctionContract),
            O.bind('auctionedTokenAddress', () => auctionedTokenAddr),
            O.bind('auctionedToken', () => auctionedToken),
            O.bind('tokenName', () => O.of(auctionedTokenName)),
            O.bind('tokenImagesUri', () => O.of(tokenImagesUri)),
            O.bind('lines', () => lineOpts),
            O.map((data) => ({...data, auctionAddress}))
        )
        
        set({ auctionData: data })
    },
    
    // TODO Abstract this general pattern in a higher order function.
    getIdsToAuction: async () => await pipe(
        get().auctionData,
        O.map(data => data.auctionContract),
        TO.fromOption,
        TO2.flatTry(x => x.getIdsToAuction()),
        TO.map(x => x.map(Number))
    )(),

    getLineState: async (tokenId: number) => await pipe(
        get().auctionData,
        O.map(data => data.auctionContract),
        TO.fromOption,
        TO2.flatTry(x => x.lineState(tokenId))
    )(),

    getMinPrice: async (tokenId: number) => await pipe(
        get().auctionData,
        O.map(data => data.auctionContract),
        TO.fromOption,
        TO2.flatTry(x => x.getMinPriceFor(tokenId))
    )(),
    
    getImage: (tokenId: number) => pipe( 
        get().auctionData,
        O.map(data => data.tokenImagesUri),
        O.map(uri => `${uri}/${tokenId}.png`),
        O.getOrElse(() => '/404.png')
    ),
    
    updateLine: async (line: O.Option<LineStateStruct>) => {
        const newLine = await pipe(
            line,
            TO.fromOption,
            TO2.flatTry(line => get().getLineState(Number(line.head))),
            TO.flatMap(x => TO.fromOption(x)),
        )()
    
        const allLines = get().getAllCurrentLines()
        const lineIndex = allLines.indexOf(line)
        
        allLines[lineIndex] = newLine

        set(({ auctionData }) => ({ auctionData: pipe(
            auctionData,
            O.map(data => {
                data.lines = allLines;
                return data
            })
        ) }))

        return newLine
    },

    
    getCollectionName: () => pipe(
        get().auctionData,
        O.map(data => data.tokenName)
    ),

    getCurrentTokenName: () => pipe(
        O.Do,
        O.bind('name', get().getCollectionName),
        O.bind('line', () => get().currentSelectedLine),
        O.map(({ name, line }) => `${name} #${line.head}`)
    ),
    
    // TODO The `fill` shouldn't be hardcoded.
    getAllCurrentLines: () => pipe(
        get().auctionData,
        O.map(data => data.lines),
        O.getOrElse(() => new Array<O.Option<LineStateStruct>>(10).fill(O.none))
    )

}})

