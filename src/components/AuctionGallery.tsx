import React from 'react'
import style from './AuctionGallery.module.css'
import { AuctionCard } from './AuctionCard'

export const AuctionGallery = () => {
	return (
		<div id={style['auction-container']}>
			<AuctionCard
				currentBid={0.1}
				timeRemaining="02:25:51"
				imageUrl="https://pbs.twimg.com/media/FwlGNPPXoAYtMhb?format=png"
			/>
			<AuctionCard
				currentBid={0.1}
				timeRemaining="02:25:51"
				imageUrl="https://pbs.twimg.com/media/FwbwzpwWcAsdYF3?format=png"
			/>
			<AuctionCard
				currentBid={0.1}
				timeRemaining="02:25:51"
				imageUrl="https://pbs.twimg.com/media/FwQU-OLaYAYKfoU?format=png"
			/>
			<AuctionCard
				currentBid={0.1}
				timeRemaining="02:25:51"
				imageUrl="https://pbs.twimg.com/media/FwGVB9EXgAEAera?format=png"
			/>
			<AuctionCard
				currentBid={0.1}
				timeRemaining="02:25:51"
				imageUrl="https://pbs.twimg.com/media/FwBPJdcXoAUK5yf?format=png"
			/>
			<AuctionCard
				currentBid={0.1}
				timeRemaining="02:25:51"
				imageUrl="https://pbs.twimg.com/media/Fvy5B2UXsAIJ8CG?format=png"
			/>
			<AuctionCard
				currentBid={0.1}
				timeRemaining="02:25:51"
				imageUrl="https://pbs.twimg.com/media/FvyPa-NXoAAc6Gq?format=png"
			/>
			<AuctionCard
				currentBid={0.1}
				timeRemaining="02:25:51"
				imageUrl="https://pbs.twimg.com/media/FvyORJEXgAEmJeQ?format=png"
			/>
			<AuctionCard
				currentBid={0.1}
				timeRemaining="02:25:51"
				imageUrl="https://pbs.twimg.com/media/FvyN3vpWAAAVkcp?format=png"
			/>
			<AuctionCard
				currentBid={0.1}
				timeRemaining="02:25:51"
				imageUrl="https://pbs.twimg.com/media/FvyNZh-WcA4xBTO?format=png"
			/>
		</div>
	)
}
