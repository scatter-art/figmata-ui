import { 
    BrowserProvider, JsonRpcProvider, JsonRpcSigner, Provider
} from 'ethers'
import { create } from 'zustand'

import * as O from 'fp-ts/Option'
import * as TO from 'fp-ts/TaskOption'
import * as T from 'fp-ts/Task'
import { pipe } from 'fp-ts/lib/function'
import { TO2 } from '../utils/pure'

/**
 * @notice The system should work even if `O.isNone(defaultProvider)`
 * so its not dependent on any API.
 */
export type UserStoreState = {
    userProvider: O.Option<BrowserProvider>,
    userAddress: O.Option<string>,
    defaultProvider: O.Option<Provider>,
    /**
     * @dev This function will try to reinitialize `window.ethereum`s
     * BrowserProvider and the `defaultProvider`. It should generally
     * be avoided unless dealing with some weird state loading logics.
     */
    updateProviders: () => void,

    /**
     * @returns `userProvider` if exists, if not, 
     *  returns `defaultProvider` if exists, if not,
     *  returns `O.none`
     */
    getBestProvider: () => O.Option<Provider | BrowserProvider>
}

export const useUserStore = create<UserStoreState>(set => ({
    userProvider: _getUserProvider(),
    userAddress: O.none,
    defaultProvider: O.none,
    updateProviders,
    getBestProvider,
}))

const getBestProvider = (): O.Option<Provider | BrowserProvider> => {
    const userProvider = useUserStore(state => state.userProvider)
    const defaultProvider = useUserStore(state => state.defaultProvider)
    
    return pipe(
        userProvider,
        O.orElse(() => defaultProvider)
    )
}

const updateProviders = () => {
    useUserStore.setState({ userProvider: _getUserProvider() })
    // TODO
    useUserStore.setState({ defaultProvider: O.none })
}

const _getUserProvider = (): O.Option<BrowserProvider> => {
    const provider = O.tryCatch(() => new BrowserProvider(window.ethereum))
    _getUserAddress().then(addr => useUserStore.setState({ userAddress: addr }))
    return provider
}

const _getUserAddress = (): Promise<O.Option<string>> => {
    const userOpt = TO.fromOption(useUserStore(state => state.userProvider))
    return pipe(
        userOpt,
        TO2.flatTry(provider => provider.getSigner()),
        TO.map(signer => signer.address)
    )()
}

