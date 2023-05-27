import { ethers } from 'ethers'
import { create } from 'zustand'

import * as O from 'fp-ts/Option'
import * as S from 'fp-ts/string'
import * as TO from 'fp-ts/TaskOption'
import { pipe } from 'fp-ts/lib/function'

import { 
    IParallelAutoAuction, IParallelAutoAuction__factory 
} from '../types'
import { IERC721 } from '../types/IERC721'
import { IERC721__factory } from '../types/factories/IERC721__factory'

import { useUserStore } from './userStore'
import { TO2 } from '../utils/pure'


/**
 * @dev This store provides differente secure abstractions to interact
 * with a `ParallelAutoAuction.sol` contract. The user only needs
 * to call `setContractAddress` and ensure that theres a provider (see
 * `./userStore.tsx`).
 */
type ParallelAuctionStoreState = {
    setContractAddress: (address: string) => void,
    address: O.Option<string>,
    auctionContract: O.Option<IParallelAutoAuction>,
    auctionedToken: O.Option<IERC721>,
    getAuctionableIds: () => Promise<O.Option<bigint[]>>,
    getTokenIdPrice: (id: number) => Promise<O.Option<bigint>>
}

export const useParallelAuctionState = create<ParallelAuctionStoreState>(set => ({
    address: O.none,
    auctionContract: O.none,
    auctionedToken: O.none,
    setContractAddress,
    getAuctionableIds,
    getTokenIdPrice
}))


const getAuctionableIds = async (): Promise<O.Option<bigint[]>> => {
    const contractOpt = useParallelAuctionState(state => state.auctionContract)
    return pipe(
        contractOpt,
        TO.fromOption,
        TO2.flatTry(contract => contract.getIdsToAuction())
    )()
}

/**
 * @dev After the user provides an auction contract address, this hook
 * will also try to set the rest of the state related to it (see last 2
 * lines of the function definition).
 */
const setContractAddress = (addr: string) => {
    const currentAddr = useParallelAuctionState(state => state.address)
    
    // If the new `addr` is the same as `currentAddress` just return
    // to evite redundant computations.
    if (O.getEq(S.Eq).equals(O.of(addr), currentAddr)) return

    if (ethers.isAddress(addr)) 
        useParallelAuctionState.setState({ address: O.of(addr) })
    else useParallelAuctionState.setState({ address: O.none })

    _setAuctionContract()
    _setAuctionedToken()
}

const _setAuctionContract = () => {
    const providerOpt = useUserStore(state => state.getBestProvider)
    const addressOpt = useParallelAuctionState(state => state.address)
    
    const contractOpt = pipe(
        O.Do,
        O.bind('provider', providerOpt),
        O.bind('addr', () => addressOpt),
        O.map(({ addr, provider }) => 
            IParallelAutoAuction__factory.connect(addr, provider)
        )
    )

    useParallelAuctionState.setState({ auctionContract: contractOpt })
}

const _setAuctionedToken = async () => {
    const providerOpt = useUserStore(state => state.getBestProvider)
    const tokenAddressOpt = await _getAuctionedTokenAddress()

    const tokenOpt = pipe(
        O.Do,
        O.bind('provider', providerOpt),
        O.bind('tokenAddress', () => tokenAddressOpt),
        O.map(({ tokenAddress, provider }) => {
            return IERC721__factory.connect(tokenAddress, provider)
        })
    )

    useParallelAuctionState.setState({ auctionedToken: tokenOpt })
}

const _getAuctionedTokenAddress = async (): Promise<O.Option<string>> => {
    const contractOpt = useParallelAuctionState(state => state.auctionContract)
    return pipe(
        contractOpt,
        TO.fromOption,
        TO2.flatTry(contract => contract.getAuctionedToken())
    )()
}

const getTokenIdPrice = (id: number): Promise<O.Option<bigint>> => {
    const contractOpt = useParallelAuctionState(state => state.auctionContract)
    return pipe(
        contractOpt,
        TO.fromOption,
        TO2.flatTry(contract => contract.getMinPriceFor(id))
    )()
}

