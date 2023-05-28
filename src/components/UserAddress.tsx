import React, { CSSProperties } from 'react'
import { useUserStore } from "../state/userStore"
import * as O from 'fp-ts/Option'
import { formatAddr } from "../utils/web3"
import { pipe } from "fp-ts/lib/function"

export const UserAddress: React.FC<{ style?: CSSProperties }> = ({ style }) => {
    const addr = useUserStore(state => state.userAddress)

    const finalAddr = pipe(
        addr,
        O.chain(addr => formatAddr(addr)),
        O.getOrElse(() => '')
    )

    return <span style={style}>{finalAddr}</span>
}
