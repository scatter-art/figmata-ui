import { CSSProperties, useEffect, useState } from "react"
import { useParallelAuctionState } from "../state/autoAuctionStore"
import * as O from 'fp-ts/Option'
import { LineStateStruct } from "../types/IHoldsParallelAutoAuctionData"
import { BigNumberish, ethers } from "ethers"
import { PlaceBidButton } from "./PlaceBidButton"
import { fformatAddr, formatAddr } from "../utils/web3"

const fromWei = (x: BigNumberish) => ethers.formatUnits(x, 'ether')

export const TokenCard: React.FC<{
    style?: CSSProperties, tokenId: number
}> = ({ style, tokenId }) => {
    
    const img = useParallelAuctionState(state => state.getImage)(tokenId)
    const auctionData = useParallelAuctionState(state => state.auctionData)
    // NOTE TODO Im scared this will be queried a shit ton of times, I
    // need to minimize states in the higher components.
    // TODO The lines should anyways be decoupled to the store.
    const getLineState = useParallelAuctionState(state => state.getLineState)

    const [lineState, setLineState] = useState<O.Option<LineStateStruct>>(O.none)

    const lineMap = (f: (line: LineStateStruct) => string) => 
        O.isSome(lineState) ? f(lineState.value) : null
        
    useEffect(() => {
        getLineState(tokenId).then(setLineState)
    }, [auctionData])

    return <>
        <img src={img} style={{width: '230px', ...style}} />
        <span>{lineMap(l => `Current bid: ${fromWei(l.currentPrice)}`)}</span>
        {O.isSome(lineState) ? <PlaceBidButton lineState={lineState.value} /> : null}
        <span>{lineMap(l => `Current winner. ${fformatAddr(l.currentWinner.toString())}`)}</span>
    </>
}
