import React, { useEffect } from "react";
import { useParallelAuctionState } from "../state/autoAuctionStore";
import { useUserStore } from "../state/userStore";
import { Header } from "./Header";
import { SidePanel } from "./SidePanel/SidePanel";
import { AuctionHouseBody } from "./AuctionHouseBody/AuctionHouseBody";

export const FigmataPage: React.FC = () => {
    
    const config = useParallelAuctionState(state => state.setAuctionData)
    const auctionData = useParallelAuctionState(state => state.auctionData)
    const userConnected = useUserStore(state => state.userConnected)
    
    useEffect(() => {
        // TODO This all should be decoupled into a config file and
        // evaluated from a store.
        config(
            '0x0a3591da8d0f8Df57f4D1F5d56Ac8dE51124EECd',
            'Figmata',
            'https://ipfs.io/ipfs/bafybeih5mqafo34424swmfdboww3s2tvfmzoojbip4jmcjbg5n3fl7edee'
        )
    }, [userConnected, auctionData]);

    
    return <>
        <div id="motif-border"></div>

        <main>
            <Header />
            <AuctionHouseBody />
        </main>

        <SidePanel />
    </>
    
}
