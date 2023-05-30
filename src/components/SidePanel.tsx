import React from 'react'
import style from './SidePanel.module.css'

interface SidePanelProps {
	imageUrl: string
}

export const SidePanel = (props: SidePanelProps) => {
	const { imageUrl } = props

	return (
		<div id={style['side-panel']}>
			<div id={style['connect-button-container']}>
				<div id={style['connect-button']}>
					<span>Connect</span>
				</div>
			</div>

			<div id={style['focus-token-details']}>
				<div id={style['focus-token-title']}>
					<span>Pixelady #1102</span>
				</div>

				<div id={style['focus-token-image-container']}>
					<img id={style['focus-token-image']} src={imageUrl} />
				</div>

				<div id={style['focus-token-auction-details-container']}>
					<div className={style['focus-token-auction-details-item']}>
						<span>Current bid:</span>
						<span>Ξ0.01</span>
					</div>

					<div className={style['focus-token-auction-details-item']}>
						<span>Ends in:</span>
						<span>Ξ0.01</span>
					</div>

					<div className={style['focus-token-auction-details-item']}>
						<span>Last bid by:</span>
						<span>Ξ0.01</span>
					</div>
				</div>
			</div>

			<div id={style['place-bid-button-container']}>
				<div id={style['place-bid-button']}>
					<span>PLACE YOUR BID</span>
				</div>
			</div>
		</div>
	)
}
