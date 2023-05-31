import { ethers, Signer } from 'ethers'
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
    
    currentSelectedLine: O.Option<LineStateStruct>,

    lines: O.Option<O.Option<LineStateStruct>[]>,
    
    setCurrentSelectedLine: (line: O.Option<LineStateStruct>) => void,

    /**
     * @dev Updates in `lines` the inputed `line`.
     * @returns A new updated line.
     */
    updateLine: (line: O.Option<LineStateStruct>) => Promise<O.Option<LineStateStruct>>,

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

    createBid: (value: number) => Promise<O.Option<ethers.ContractTransactionResponse>>

}

export const useParallelAuctionState = create<ParallelAuctionStoreState>((set, get) => {return {

    auctionData: O.none,
    currentSelectedLine: O.none,
    lines: O.none,
    
    setCurrentSelectedLine: (line: O.Option<LineStateStruct>) => 
        set({ currentSelectedLine: line }),

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
        
        const defaultLine = pipe(
            lineOpts,
            O.flatMap(lines => lines[0])
        )

        set({ currentSelectedLine: defaultLine })

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

    updateLine: async (lineToUpdate: O.Option<LineStateStruct>) => {
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
        
        const indexToMutate = pipe(
            allLines,
            O.map(lines => lines.indexOf(lineToUpdate))
        )

        const updatedLines = pipe(
            O.Do,
            O.bind('i', () => indexToMutate),
            O.bind('allLines', () => allLines),
            O.map(({ i, allLines }) => {
                if (O.isSome(allLines[i])) allLines[i] = newLine
                return allLines
            })
        )
        
        set({ lines: updatedLines })
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
        O.bind('line', () => get().currentSelectedLine),
        O.map(({ name, line }) => `${name} #${line.head}`)
    ),

    getAuctionConfig: () => pipe(
        get().auctionData,
        O.map(data => data.auctionConfig),
        O.map(x => x)
    ),

    createBid: async (value: number) => { 
        
        /*const userSigner = useUserStore(state => state.userSigner)
        const data = get().auctionData
        const line = get().currentSelectedLine

        if (O.isNone(data) || O.isNone(line) || O.isNone(userSigner)) return O.none

        const auction = data.value.auctionContract
        const res = await auction.createBid(line.value.head, { value: toWei(value) })
        console.log(res)
        
        return O.some(res)*/

        return await pipe(
            O.Do,
            O.bind('signer', () => useUserStore.getState().userSigner),
            O.bind('data', () => get().auctionData),
            O.bind('auction', ({ data }) => O.of(data.auctionContract)),
            O.bind('line', () => get().currentSelectedLine),
            TO.fromOption,
            TO.flatMap(({ auction, line, signer }) => TO.tryCatch(() => 
                (auction.connect(signer) as IParallelAutoAuction)
                    .createBid(line.head, { value: toWei(value)})
            ))
        )()

    }

}})

