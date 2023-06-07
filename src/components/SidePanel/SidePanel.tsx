import React, { useEffect, useLayoutEffect, useRef } from 'react'
import { PROVIDER_DOWN_MESSAGE, useParallelAuctionState } from '../../state/autoAuctionStore'
import { DappConnector } from './DappConnector/DappConnector'
import * as O from 'fp-ts/Option'
import style from './SidePanel.module.css'

import { Countdown } from '../Utils/Countdown'
import { PlaceBidButton } from './PlaceBidButton/PlaceBidButton'
import { hideSidePanelObserver, reRenderSidePanelObserver, showSidePanelObserver } from '../../state/observerStore'
import { sleep } from '../../utils/pure'

export const SidePanel: React.FC = () => {
	const lineIndex = useParallelAuctionState((state) => state.currentLineIndex)
	const subscription = reRenderSidePanelObserver((s) => s.observer)

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
		sidePanelRef.current!.style.transform = 'translateX(var(--panel-w))'
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

				<div id={style['focus-token-image-container']}>
					<img id={style['focus-token-image']} src={imageUrl} />
				</div>

				<div id={style['focus-token-auction-details-container']}>
					<div className={style['focus-token-auction-details-item']}>
						<span>Current bid:</span>
						<span>{currentBid}</span>
					</div>

					<div className={style['focus-token-auction-details-item']}>
						<span>Ends in:</span>
						<span>
							{O.isSome(endTime) ? <Countdown endTimestamp={endTime.value} /> : PROVIDER_DOWN_MESSAGE()}
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
