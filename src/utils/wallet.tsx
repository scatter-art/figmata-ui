import { useUserStore } from "../state/userStore"
import * as O from 'fp-ts/Option'

export const getDappButtonText = (): 'Connect' | 'Disconnect' => {
    const addr = useUserStore(state => state.userAddress)
    if (O.isSome(addr)) return 'Disconnect'
    else return 'Connect'
}

