import React, { useEffect, useState } from "react"
import { useParallelAuctionState } from "../state/autoAuctionStore"
import { useUserStore } from "../state/userStore"
import * as O from 'fp-ts/Option'
import { TokenCard } from "./TokenCard"


export const TokenCards: React.FC = () => {

    const getIds = useParallelAuctionState(state => state.getIdsToAuction)
    const auctionData = useParallelAuctionState(state => state.auctionData)
    
    // TODO Decouple this state into the auction store.
    const [ids, setIds] = useState<number[]>([])
    
    // TODO This should only get queried once, using the default
    // provider if needed.
    useEffect(() => {
        getIds()
            .then(res => O.isSome(res) ? res.value : [])
            .then(setIds)
            .catch(e => console.log(e))
        //setIds([1])
    }, [auctionData]);

    return <div>
        {ids.map(id => 
            <TokenCard tokenId={id} key={id} />
        )}
    </div>
    
}
