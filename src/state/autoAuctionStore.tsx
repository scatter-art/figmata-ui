import { BigNumberish, ethers } from 'ethers'
import { create } from 'zustand'

import * as O from 'fp-ts/Option'
import * as TO from 'fp-ts/TaskOption'
import * as A from 'fp-ts/Array'
import { constVoid, identity, pipe } from 'fp-ts/lib/function'

import { 
    IExternallyMintable,
    IExternallyMintable__factory,
    IParallelAutoAuction, IParallelAutoAuction__factory 
} from '../types'

import { useUserStore } from './userStore'
import { TO2 } from '../utils/pure'
import { AuctionConfigStruct, LineStateStruct } from '../types/IHoldsParallelAutoAuctionData'
import { formatAddr, fromWei, toWei } from '../utils/web3'
import { reRenderSidePanelObserver } from './observerStore'
import { useLineTimersStore } from './lineTimeoutsStore'

// Epic hardcodes :3
export const PROVIDER_DOWN_MESSAGE = () => 'Connect wallet :('
export const vipIds = [
    1, 7, 51, 55, 171, 81, 114, 180, 230, 211, 210, 17, 179, 247, 288, 308, 36, 323, 8
]
// Should I harcode those kinds of states? I think I should abstract
// this pattern of loading the whole immutable system state, because
// having lots of silly consts like `tokenName` only make the store
// uglier.
export const auctionsAtTheSameTime = 10

export type WonEvent = {
    readonly id: BigNumberish,
    readonly winner: string,
    readonly price: BigNumberish
}

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
    
    /* --------------- CONTRACT INITIALIZATION --------------- */
    setAuctionData: (
        auctionAddress: string[42], 
        auctionedTokenName: string, 
        tokenImagesUri: string
    ) => void,
    
    /* ------------- GENERAL CONTRACT QUERIES ------------- */

    getImagesUri: () => O.Option<string>,

    getImage: (forLineIndex: number) => string,

    getImageForId: (id: BigNumberish) => string,

    getCollectionName: () => O.Option<string>,

    getFormattedTokenName: (forLineIndex: number) => string,

    getFormattedTokenNameFoId: (id: BigNumberish) => string,

    getAuctionConfig: () => O.Option<AuctionConfigStruct>,
    
    getEndTime: (forLineIndex: number) => O.Option<number>,

    getFormattedCurrentBid: (forLineIndex: number) => string,

    getFormattedCurrentWinner: (forLineIndex: number) => string,

    getCurrentlyAuctionedIds: () => Promise<O.Option<number[]>>,

    createBid: (value: number) => Promise<O.Option<ethers.ContractTransactionResponse>>,

    /**
     * @returns If the current user is vip.
     */
    getIsVip: () => Promise<boolean>,

    /**
     * @returns If the current selected line is a vip id.
     */
    getCurrentLineIsVipId: () => boolean,

    /**
     * @returns If the 
     */
    getLineIsVip: (line: O.Option<LineStateStruct>) => boolean,

    getContractWonEventFor: (id: BigNumberish) => Promise<O.Option<WonEvent>>
    
    /* --------------- CALLBACK FUNCTIONS --------------- */
    /**
     * @dev Event function that should only trigger if an event
     * happens over `biddedId`.
     */
    _onBidEventDo: (biddedId: bigint, bidder: string, value: BigNumberish) => void,

    /**
     * @dev Callback function that will restart a line data on its
     * timer end.
     */
    _onLineTimerEndDo: (index: number) => void

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
        
        if (O.isNone(data)) return
        
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
        
        if (O.isNone(lineOpts)) return

        set({ auctionData: data })
        set({ lines: lineOpts })
        
        // Finally, we specify all events that will manipulate `lines`.
        pipe(
            auctionContract,
            O.map(c => c.addListener('Bid', get()._onBidEventDo))
        )
        
        // Setting callback function for timers.
        useLineTimersStore.getState().setCallbackIfDoesntExist(        
            get()._onLineTimerEndDo 
        )

        // Setting all timers.
        pipe(
            get().lines,
            O.map(A.mapWithIndex((i,l) => pipe(
                l,
                O.map(l => useLineTimersStore.getState().clearAndSetTimerFor(i,l))
            )))
        )
    },

    updateLine: async (lineIndexToUpdate) => {

        const lineToUpdateOpt = get().getLine(lineIndexToUpdate)
        const allLinesOpt = get().lines

        if (O.isNone(lineToUpdateOpt) || O.isNone(allLinesOpt)) return O.none

        const lineToUpdate = lineToUpdateOpt.value
        const allLines = allLinesOpt.value

        const newLine = await pipe(
            get().auctionData,
            TO.fromOption,
            TO2.flatTry(data => 
                data.auctionContract.lineState(Number(lineToUpdate.head))
            ),
        )()
    
        // NOTE Index could be out of bounds.
        const indexToMutate = allLines.findIndex(pipe(
            O.exists(line => line.head === lineToUpdate.head)
        ))

        if (allLines[indexToMutate] !== undefined && O.isSome(newLine)) 
            allLines[indexToMutate] = newLine
        else return O.none

        set({ lines: O.some(allLines) }) 
        
        useLineTimersStore.getState().clearAndSetTimerFor(
            lineIndexToUpdate, newLine.value
        )
        
        return newLine
    },
    

    getImagesUri: () => pipe(
        get().auctionData,
        O.map(d => d.tokenImagesUri)
    ),

    getImage: lineIndex => pipe(
        get().getLine(lineIndex),
        O.map(l => l.head),
        O.map(get().getImageForId),
        O.getOrElse(() => '/404.png')
    ),

    getImageForId: id => pipe(
        get().getImagesUri(),
        O.map(uri => `${uri}/${id}.png`),
        O.getOrElse(() => '/404.png')
    ),
    
    getCollectionName: () => pipe(
        get().auctionData,
        O.map(data => data.tokenName)
    ),

    getFormattedTokenName: lineIndex => pipe(
        get().getLine(lineIndex),
        O.map(l => l.head),
        O.map(get().getFormattedTokenNameFoId),
        O.getOrElse(PROVIDER_DOWN_MESSAGE)
    ),

    getFormattedTokenNameFoId: id => pipe(
        get().getCollectionName(),
        O.map(name => `${name} #${id}`),
        O.getOrElse(PROVIDER_DOWN_MESSAGE)
    ),

    getAuctionConfig: () => pipe(
        get().auctionData,
        O.map(data => data.auctionConfig)
    ),

    getEndTime: (forLineIndex: number) => pipe(
        get().getLine(forLineIndex),
        O.flatMap(line => O.tryCatch(() => Number(line.endTime)))
    ),

    getFormattedCurrentBid: (forLineIndex: number) => pipe(
        get().getLine(forLineIndex),
        O.map(line => `Ξ${fromWei(line.currentPrice)}`),
        O.getOrElse(PROVIDER_DOWN_MESSAGE)
    ),

    getFormattedCurrentWinner: (forLineIndex: number) => pipe(
        get().getLine(forLineIndex),
        O.flatMap(line => formatAddr(line.currentWinner.toString(), 11)),
        O.getOrElse(PROVIDER_DOWN_MESSAGE)
    ),

    getCurrentlyAuctionedIds: async () => await pipe(
        get().auctionData,
        O.map(d => d.auctionContract),
        TO.fromOption,
        TO2.flatTry(x => x.getIdsToAuction()),
        TO.map(A.map(Number))
    )(),
    
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

    getIsVip: async () => await pipe(
        O.Do,
        O.bind('signer', () => useUserStore.getState().userSigner),
        O.bind('signerAddress', () => useUserStore.getState().userAddress),
        O.bind('data', () => get().auctionData),
        O.bind('auctionAddr', ({ data }) => O.of(data.auctionAddress)),
        O.bind('newAbi', () => O.of(['function userIsVip(address user) public view returns (bool)'])),
        O.bind('vipChecker', ({ auctionAddr, newAbi, signer }) => 
            O.of(new ethers.Contract(auctionAddr, newAbi, signer))
        ),
        TO.fromOption,
        TO.flatMap(({ vipChecker, signerAddress }) => TO.tryCatch(() =>
            vipChecker.userIsVip(signerAddress)
        )),
        TO.map(x => x as boolean),
    )().then(O.exists(identity)),

    getCurrentLineIsVipId: () => pipe(
        get().getCurrentSelectedLine(),
        get().getLineIsVip,
    ),

    getLineIsVip: l => pipe(
        l,
        O.map(l => l.head),
        O.exists(i => vipIds.includes(Number(i)))
    ),

    getContractWonEventFor: async (id) => {
        const auctionDataOpt = get().auctionData
        if (O.isNone(auctionDataOpt)) return O.none
        const auctionData = auctionDataOpt.value

        const winsFilter = auctionData.auctionContract.filters.Won(id)
        
        const rawEvents = await auctionData.auctionContract.queryFilter(winsFilter)

        return pipe(
            rawEvents[0],
            e => O.fromNullable(({
                id: e.args[0], winner: e.args[1], price: e.args[2]
            }))
        )
    },

    /* --------------- CALLBACK FUNCTIONS --------------- */
    _onBidEventDo: (biddedId: bigint, bidder: string, value: BigNumberish) => pipe(
        get().getAuctionConfig(),
        O.map(auctionConfig => auctionConfig.lines),
        O.map(lines => (Number(biddedId) - 1) % Number(lines)),
        O.map(lineIndex => get().updateLine(lineIndex).then(() => {
            if (lineIndex === get().currentLineIndex)
                reRenderSidePanelObserver.getState().notifyObservers()
        })),
        constVoid
    ),

    _onLineTimerEndDo: async (index: number) => {
        await get().updateLine(index)
        if (index === get().currentLineIndex)
            reRenderSidePanelObserver.getState().notifyObservers()
    }

}})

