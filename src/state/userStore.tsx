import { 
    BrowserProvider, JsonRpcProvider, JsonRpcSigner, Provider
} from 'ethers'
import { create } from 'zustand'

import * as O from 'fp-ts/Option'
import * as TO from 'fp-ts/TaskOption'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/lib/function'
import { TE2, TO2 } from '../utils/pure'

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
    
    /**
     * @dev If this function is called, the state will get killed,
     * so the dev will need to call `connectUser`.
     */
    disconnectUser: () => void

    /**
     * @dev Tries to connect the user.
     * @returns Failure or succes.
     */
    connectUser: () => Promise<E.Either<any, any>>
    
    userConnected: () => boolean
}

export const useUserStore = create<UserStoreState>(set => ({
    userProvider: O.none,
    userAddress: O.none,
    defaultProvider: O.none,
    updateProviders,
    getBestProvider,
    disconnectUser,
    connectUser,
    userConnected
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

const userConnected = (): boolean => {
    return pipe(
        useUserStore(state => state.userAddress),
        O.match(
            (    ) => false,
            (addr) => true
        )
    )
}

const disconnectUser = () => {
    if (window.ethereum) 
        window.ethereum.removeAllListeners();

    useUserStore.setState({ userProvider: O.none })
    useUserStore.setState({ userAddress: O.none })
}

const connectUser = async () => {
    const provider = TE.fromOption(() => {})(_getUserProvider())
    return await pipe(
        provider,
        TE2.flatTryE(prov => prov.send('eth_requestAccounts', [])),
        TE.match(
            (err) => {
                disconnectUser()
                return E.left(err)
            },
            (res) => E.right(res)
        ),
    )()
};
