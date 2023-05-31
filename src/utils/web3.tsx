import * as O from 'fp-ts/Option'
import { BigNumberish, ethers } from "ethers"
import { pipe } from 'fp-ts/lib/function'

export const formatAddr = (
    addr: string[42], digitsToShow: number = 6
): O.Option<string> => {
    if (!ethers.isAddress(addr)) return O.none
    const n = Math.floor(digitsToShow / 2)
    const m = digitsToShow % 2 != 0 ? n + 1 : n
    return O.of(`${addr.substr(0, n + 2)}...${addr.substr(m * (-1))}`)
}

/**
 * @dev Forces a `fromatAddr`
 */
export const fformatAddr = (
    addr: string[42], digitsToShow: number = 6
): string => {
    const optF = formatAddr(addr, digitsToShow)
    if (O.isSome(optF)) return optF.value
    else return ''
}

export const formatOptAddr = (
    addr: O.Option<string[42]>, digitToShow: number = 6
): string => pipe(
    addr,
    O.chain(addr => formatAddr(addr, digitToShow)),
    O.getOrElse(() => '')
)

export const fromWei = (x: BigNumberish) => ethers.formatUnits(x, 'ether')
