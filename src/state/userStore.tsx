import { 
    BrowserProvider, JsonRpcSigner, Provider, AlchemyProvider
} from 'ethers'
import { create } from 'zustand'

import * as O from 'fp-ts/Option'
import * as TO from 'fp-ts/TaskOption'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/lib/function'
import { TE2, TO2 } from '../utils/pure'
import { formatOptAddr } from '../utils/web3'

/**
 * @notice The system should work even if `O.isNone(defaultProvider)`
 * so its not dependent on any API.
 */
export type UserStoreState = {
    userProvider: O.Option<BrowserProvider>,
    userSigner: O.Option<JsonRpcSigner>,
    userAddress: O.Option<string>,
    formattedUserAddress: string,
    defaultProvider: O.Option<Provider>,
    userConnected: boolean,

    /**
     * @dev This function will try to reinitialize `window.ethereum`
     * BrowserProvider and the `defaultProvider`. It should generally
     * be avoided unless dealing with some weird state loading logics.
     */
    updateProviders: () => void,

    /**
     * @returns `userProvider` if exists, if not, 
     *  returns `defaultProvider` if exists, if not,
     *  returns `O.none`
     */
    getBestProvider: () => O.Option<Provider | BrowserProvider>,
    
    /**
     * @dev If this function is called, the state will get killed,
     * so the dev will need to call `connectUser`.
     */
    disconnectUser: () => void,

    isRightChainId: () => Promise<boolean>,

    /**
     * @dev Tries to connect the user.
     * @returns Failure or succes.
     */
    connectUser: () => Promise<E.Either<any, any>>,

    _getUserProvider: () =>  O.Option<BrowserProvider>,

    _getUserAddress: () => Promise<O.Option<string>>

    _getUserSigner: () => Promise<O.Option<JsonRpcSigner>>
}


export const useUserStore = create<UserStoreState>((set, get) => ({
    userProvider: O.none,
    userSigner: O.none,
    userAddress: O.none,
    formattedUserAddress: '',
    // TODO Dont have the network hardcoded, also the logic could get cleaned a bit.
    defaultProvider: O.of(new AlchemyProvider(process.env.REACT_APP_NETWORK, process.env.REACT_APP_DEFAULT_PROVIDER)),
    userConnected: false,

    updateProviders: () => {
        set({ userProvider: get()._getUserProvider() })
        // TODO
        set({ defaultProvider: O.some(
            new AlchemyProvider(process.env.REACT_APP_NETWORK, process.env.REACT_APP_DEFAULT_PROVIDER)
        )})
    },

    getBestProvider: () => pipe(
        get().userProvider,
        O.orElse(() => get().defaultProvider)
    ),

    disconnectUser: () => {
        console.log('Wallet disconnected')
        if (window.ethereum) window.ethereum.removeAllListeners();
        set({ 
            userProvider: O.none,
            userAddress: O.none,
            formattedUserAddress: '',
            userConnected: false,
            userSigner: O.none,
        })
    },

    connectUser: async () => {
        const connection = await pipe(
            get().updateProviders(),
            () => get().userProvider,
            TE.fromOption(() => 'Non existent user provider'),
            TE2.flatTryE(prov => prov.send('eth_requestAccounts', [])),
        )()

        if (E.isLeft(connection)) {
            E.mapLeft(console.log)(connection)
            get().disconnectUser()
        } else {
            console.log('Wallet connected')
            // FIXME This is some hardcore spaguetti code, I should
            // refactor the whole store now that I know some shit
            // about this kind of design.
            get()._getUserProvider() 
            set({ userConnected: true }) 
        }
        return connection
    },

    isRightChainId: async () => {
        const userNetId = await pipe(
            TO.fromOption(get().userProvider),
            TO2.flatTry(prov => prov.getNetwork()),
            TO.map(net => net.chainId)
        )()

        const providerNetId = await pipe(
            TO.fromOption(get().defaultProvider),
            TO2.flatTry(prov => prov.getNetwork()),
            TO.map(net => net.chainId)
        )()
        
        const defaultChainId = pipe(
            O.fromNullable(process.env.REACT_APP_CHAINID),
            O.map(Number),
            O.getOrElse(() => 1)
        )

        if (O.isNone(providerNetId)) return pipe(
            userNetId,
            O.exists(x => x === BigInt(defaultChainId))
        )

        return pipe(
            userNetId,
            O.exists(x => x === providerNetId.value)
        )
    },

    _getUserProvider: () => {
        const provider = O.tryCatch(() => new BrowserProvider(window.ethereum))
        set({ userProvider: provider })
        get()._getUserAddress().then(addr => set({ 
            userAddress: addr, formattedUserAddress: formatOptAddr(addr)
        }))
        get()._getUserSigner().then(userSigner => set({ userSigner }))
        return provider
    },

    _getUserAddress: () => pipe(
        TO.fromOption(get().userProvider),
        TO2.flatTry(provider => provider.getSigner()),
        TO.map(signer => signer.address)
    )(),

    _getUserSigner: () => pipe(
        TO.fromOption(get().userProvider),
        TO2.flatTry(provider => provider.getSigner())
    )()

}))
