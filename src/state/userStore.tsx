import { 
    BrowserProvider, Provider
} from 'ethers'
import create from 'zustand'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'

/**
 * @notice The system should work even if `O.isNone(defaultProvider)`
 * so its not dependent on any API.
 */
type UserStoreState = {
    userProvider: O.Option<BrowserProvider>,
    defaultProvider: O.Option<Provider>,
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
    defaultProvider: O.none,
    updateProviders,
    getBestProvider
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
    return O.tryCatch(() => new BrowserProvider(window.ethereum))
}

