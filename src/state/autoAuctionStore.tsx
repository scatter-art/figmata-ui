import { ethers } from 'ethers'
import { create } from 'zustand'

import * as O from 'fp-ts/Option'
import * as TO from 'fp-ts/TaskOption'
import { pipe } from 'fp-ts/lib/function'

import { 
    IExternallyMintable,
    IExternallyMintable__factory,
    IParallelAutoAuction, IParallelAutoAuction__factory 
} from '../types'
import { IERC721 } from '../types/IERC721'

import { useUserStore } from './userStore'
import { TO2 } from '../utils/pure'
import { LineStateStruct } from '../types/IHoldsParallelAutoAuctionData'


type ParallelAuctionData = {
    readonly auctionAddress: string,
    readonly auctionContract: IParallelAutoAuction,
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

    getImage: (tokenId: number) => string

}

export const useParallelAuctionState = create<ParallelAuctionStoreState>((set, get) => {return {
    auctionData: O.none,

    setAuctionData: async (
        auctionAddress: string[42], 
        auctionedTokenName: string, 
        tokenImagesUri: string
    ) => {
        
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
        
        // Build the final data by unwrapping all Options.
        const data: O.Option<ParallelAuctionData> = pipe(
            O.Do,
            O.bind('auctionContract', () => auctionContract),
            O.bind('auctionedTokenAddress', () => auctionedTokenAddr),
            O.bind('auctionedToken', () => auctionedToken),
            O.bind('tokenName', () => O.of(auctionedTokenName)),
            O.bind('tokenImagesUri', () => O.of(tokenImagesUri)),
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
    
    // TODO Add 'notFound.png'
    getImage: (tokenId: number) => pipe( 
        get().auctionData,
        O.map(data => data.tokenImagesUri),
        O.map(uri => `${uri}/${tokenId}.png`),
        O.getOrElse(() => 'notFound.png')
    ),

}})

