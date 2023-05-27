import { useUserStore } from "../state/userStore"
import * as O from 'fp-ts/Option'
import { formatAddr } from "../utils/wallet"
import { pipe } from "fp-ts/lib/function"

export const UserAddress = () => {
    const addr = useUserStore(state => state.userAddress)
    //const connected = useUserStore(state => state.userConnected)

    const finalAddr = pipe(
        addr,
        O.chain(addr => formatAddr(addr)),
        O.getOrElse(() => '')
    )

    return <span>{finalAddr}</span>
}
