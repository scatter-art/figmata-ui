import React, { useEffect, useRef } from 'react'
import { PROVIDER_DOWN_MESSAGE, useParallelAuctionState, vipIds } from '../../state/autoAuctionStore'
import { DappConnector } from './DappConnector/DappConnector'
import * as O from 'fp-ts/Option'
import style from './SidePanel.module.css'

import { PlaceBidButton } from './PlaceBidButton/PlaceBidButton'
import { hideSidePanelObserver, reRenderSidePanelObserver, showSidePanelObserver } from '../../state/observerStore'
import { sleep } from '../../utils/pure'
import Countdown from 'react-countdown'
import { pipe } from 'fp-ts/lib/function'

export const SidePanel: React.FC = () => {
	const line = useParallelAuctionState((state) => state.getCurrentSelectedLine)()
	const lineIndex = useParallelAuctionState((s) => s.currentLineIndex)
	reRenderSidePanelObserver((s) => s.observer) // Subscription

    const isVip = pipe(
        line,
        O.map(l => l.head),
        O.exists(i => vipIds.includes(Number(i)))
    )

	const tokenName = useParallelAuctionState((s) => s.getFormattedTokenName)(lineIndex)
	const currentBid = useParallelAuctionState((s) => s.getFormattedCurrentBid)(lineIndex)
	const endTime = useParallelAuctionState((s) => s.getEndTime)(lineIndex)
	const imageUrl = useParallelAuctionState((s) => s.getImage)(lineIndex)
	const currentWinner = useParallelAuctionState((s) => s.getFormattedCurrentWinner)(lineIndex)

	// NOTE That the side panel animation depends on other component
	// interactions, thats why we use those following hooks and observers.
	const sidePanelRef = useRef<HTMLDivElement>(null)
	const onChangeHidePanel = hideSidePanelObserver((s) => s.observer)
	const onChangeShowPanel = showSidePanelObserver((s) => s.observer)

	useEffect(() => {
		if (!sidePanelRef.current) return
		sidePanelRef.current!.style.transform = 'translateX(100%)'
	}, [onChangeHidePanel])

	useEffect(() => {
		if (!sidePanelRef.current) return
		sidePanelRef.current!.style.transform = 'translateX(0px)'
	}, [onChangeShowPanel])

	const hideSidePanel = hideSidePanelObserver((s) => s.notifyObservers)

	const handleHide = async () => {
		hideSidePanel()
		await sleep(0.25)
	}

	return (
		<div id={style['side-panel']} ref={sidePanelRef}>
			<div id={style['hide-button']} onClick={handleHide}>
				{' '}
				<span>HIDE PANEL →</span>
			</div>

			<DappConnector />

			<div id={style['focus-token-details']}>
				<div id={style['focus-token-title']}>
					<span>{tokenName}</span>
				</div>

				<div id={style['focus-token-image-container']} data-is-vip={isVip}>
					
					<div className={style['vip-badge-container']}>
						<div className={style['vip-badge']}>
						<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="m772-635-43-100-104-46 104-45 43-95 43 95 104 45-104 46-43 100Zm0 595-43-96-104-45 104-45 43-101 43 101 104 45-104 45-43 96ZM333-194l-92-197-201-90 201-90 92-196 93 196 200 90-200 90-93 197Z"/></svg>

							<span className={style['vip-string']}>VIP ONLY: Pixelady, Pixelady BC, Milady, Remilio</span>
						</div>

					</div>

					<img id={style['focus-token-image']} src={imageUrl} alt='Pixelady Figmata NFT artwork' />
				</div>

				<div id={style['focus-token-auction-details-container']}>
					<div className={style['focus-token-auction-details-item']}>
						<span>Current bid:</span>
						<span>{currentBid}</span>
					</div>

					<div className={style['focus-token-auction-details-item']}>
						<span>Ends in:</span>
						<span>
							{O.isSome(endTime) ? 
                                <Countdown date={endTime.value*1000} daysInHours/> :
                                PROVIDER_DOWN_MESSAGE()
                            }
						</span>
					</div>

					<div className={style['focus-token-auction-details-item']}>
						<span>Last bid by:</span>
						<span>{currentWinner}</span>
					</div>
				</div>
			</div>

			<PlaceBidButton />
		</div>
	)
}
