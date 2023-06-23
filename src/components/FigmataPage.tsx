import React, { useEffect } from 'react'
import { useParallelAuctionState } from '../state/autoAuctionStore'
import { useUserStore } from '../state/userStore'
import { SidePanel } from './SidePanel/SidePanel'
import { AuctionHouseBody } from './AuctionHouseBody/AuctionHouseBody'
import { Header } from './Header/Header'
import { Toaster } from 'react-hot-toast'

export const FigmataPage: React.FC = () => {
	const config = useParallelAuctionState(s => s.setAuctionData)
	const auctionData = useParallelAuctionState(s => s.auctionData)
	const userConnected = useUserStore(s => s.userConnected)

	useEffect(() => {
		// TODO This all should be decoupled into a config file and
		// evaluated from a store.
		config(
			process.env.REACT_APP_AUCTION_CONTRACT!,
			'Figmata',
			process.env.REACT_APP_IMAGES_URI!
		)
	}, [userConnected, auctionData, config])

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
