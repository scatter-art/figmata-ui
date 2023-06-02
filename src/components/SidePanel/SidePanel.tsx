import React, { useLayoutEffect, useRef } from 'react'
import { PROVIDER_DOWN_MESSAGE, useParallelAuctionState } from '../../state/autoAuctionStore'
import { DappConnector } from './DappConnector/DappConnector'
import * as O from 'fp-ts/Option'
import style from './SidePanel.module.css'

import { Countdown } from '../Utils/Countdown'
import { PlaceBidButton } from './PlaceBidButton/PlaceBidButton'
import { sidePanelObserver } from '../../state/observerStore'

export const SidePanel: React.FC = () => {
    
    const lineIndex = useParallelAuctionState(state => state.currentLineIndex)
    sidePanelObserver(s => s.observer)

    const tokenName = useParallelAuctionState(s => s.getFormattedCurrentWinner)(lineIndex)
    const currentBid = useParallelAuctionState(s => s.getFormattedCurrentBid)(lineIndex)
    const endTime = useParallelAuctionState(s => s.getEndTime)(lineIndex)
    const imageUrl = useParallelAuctionState(s => s.getImage)(lineIndex)
    const currentWinner = useParallelAuctionState(s => s.getFormattedCurrentWinner)(lineIndex)

    const isFirstRender = useRef(0)
    const sidePanelRef = useRef<HTMLDivElement>(null)

    useLayoutEffect(() => {
        // Ignore this hack.
        if (isFirstRender.current < 2) {
            isFirstRender.current++
            return
        }
            
        if (!sidePanelRef.current) return

        sidePanelRef.current.style.transform = 'translateX(600px)'
        setTimeout(() => {
            sidePanelRef.current!.style.transform = 'translateX(0px)'
        }, 250)

    }, [lineIndex])
    
	return (
		<div id={style['side-panel']} ref={sidePanelRef}>

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
                            {O.isSome(endTime) ? 
                                <Countdown endTimestamp={endTime.value} /> : 
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
