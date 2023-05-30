import React from 'react'
import style from './AuctionCard.module.css'

interface AuctionCardProps {
	imageUrl: string
	currentBid: number
	timeRemaining: string
}

export const AuctionCard = (props: AuctionCardProps) => {
	const { imageUrl, currentBid, timeRemaining } = props

	const bgImage = {
		backgroundImage: `url(${imageUrl})`
	}

	return (
		<div className={style['auction-card']}>
			<div className={style['thumbnail-container']}>
				<div className={style['thumbnail']} style={bgImage}></div>
			</div>
			<div className={style['details']}>
				<span>Ξ{currentBid}</span>
				<span>{timeRemaining}</span>
			</div>
			<button className={style['action']}>PLACE BID</button>
		</div>
	)
}
