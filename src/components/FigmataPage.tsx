import React, { useEffect } from 'react'
import { useParallelAuctionState } from '../state/autoAuctionStore'
import { useUserStore } from '../state/userStore'
import { SidePanel } from './SidePanel/SidePanel'
import { AuctionHouseBody } from './AuctionHouseBody/AuctionHouseBody'
import { Header } from './Header/Header'
import { Toaster } from 'react-hot-toast'

export const FigmataPage: React.FC = () => {
	const config = useParallelAuctionState((state) => state.setAuctionData)
	const auctionData = useParallelAuctionState((state) => state.auctionData)
	const userConnected = useUserStore((state) => state.userConnected)

	useEffect(() => {
		// TODO This all should be decoupled into a config file and
		// evaluated from a store.
		config(
			'0x5a5e12f15505F3836f68e47B1c858548C5077335',
			'Figmata',
			'https://cloudflare-ipfs.com/ipfs/bafybeigw2oa3zw4rl2owcqm7f3yd7zcxzn37cvpantahh7n7kxlgov7u7e'
		)
	}, [userConnected, auctionData, config])

    // ???
	//useEffect(updateContractProviders, [userConnected, updateContractProviders])

	return (
		<>
			<div id="motif-border"></div>

			<main>
				<Header />
				<AuctionHouseBody />
			</main>

			<SidePanel />

			<Toaster
				position="top-center"
				containerStyle={{ top: 40 }}
				toastOptions={{
					className: '',
					style: {
						borderRadius: 'var(--sp-2)',
						padding: '16px',
						color: 'var(--clr-accent-heavy)',
						fontFamily: 'var(--font-pixel)',
						fontSize: '1.125rem'
					},
					iconTheme: {
						primary: 'var(--clr-accent-heavy)',
						secondary: 'var(--clr-accent-light)'
					}
				}}
			/>
		</>
	)
}
