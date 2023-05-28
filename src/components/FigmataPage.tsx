import React, { useEffect, useState } from "react";
import { useParallelAuctionState } from "../state/autoAuctionStore";
import { useUserStore } from "../state/userStore";
import { DappConnector } from "./DappConnector";
import { UserAddress } from "./UserAddress";
import { TokenCards } from "./TokenCards";

export const FigmataPage: React.FC = () => {
    
    const config = useParallelAuctionState(state => state.setAuctionData)
    const auctionData = useParallelAuctionState(state => state.auctionData)
    const userConnected = useUserStore(state => state.userConnected)
    
    // TODO This should only get queried once, using the default
    // provider if needed.
    useEffect(() => {
        // TODO This all should be decoupled into a config file.
        config(
            '0x349fea47fa67fAF75C9F301Adb5108aef49223ff',
            'Figmata',
            'https://ipfs.io/ipfs/bafybeih5mqafo34424swmfdboww3s2tvfmzoojbip4jmcjbg5n3fl7edee'
        )
    }, [userConnected, auctionData]);

    
    return <>
        <DappConnector />
        <br/>
        <UserAddress />
        <br/>
        <TokenCards />
    </>
    
}
