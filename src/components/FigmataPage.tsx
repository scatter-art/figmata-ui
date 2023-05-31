import React, { useEffect } from "react";
import { useParallelAuctionState } from "../state/autoAuctionStore";
import { useUserStore } from "../state/userStore";
import { SidePanel } from "./SidePanel/SidePanel";
import { AuctionHouseBody } from "./AuctionHouseBody/AuctionHouseBody";
import { Header } from "./Header/Header";

export const FigmataPage: React.FC = () => {
    
    const config = useParallelAuctionState(state => state.setAuctionData)
    const auctionData = useParallelAuctionState(state => state.auctionData)
    const userConnected = useUserStore(state => state.userConnected)
    const updateContractProviders = useParallelAuctionState(state => state.updateContractsProvider)
    
    useEffect(() => {
        // TODO This all should be decoupled into a config file and
        // evaluated from a store.
        config(
            '0x3102B91D6c27213e570F85C6Ef0413D74234A4bc',
            'Figmata',
            'https://ipfs.io/ipfs/bafybeih5mqafo34424swmfdboww3s2tvfmzoojbip4jmcjbg5n3fl7edee'
        )

    }, [userConnected, auctionData]);

    useEffect(() => updateContractProviders(), [userConnected])

    
    return <>
        <div id="motif-border"></div>

        <main>
            <Header />
            <AuctionHouseBody />
        </main>

        <SidePanel />
    </>
    
}
