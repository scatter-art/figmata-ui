import { pipe } from 'fp-ts/lib/function'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useParallelAuctionState } from '../../state/autoAuctionStore'
import { DappConnector } from './DappConnector/DappConnector'
import * as O from 'fp-ts/Option'
import style from './SidePanel.module.css'

import { formatAddr, fromWei } from '../../utils/web3'
import { Countdown } from '../Utils/Countdown'
import { PlaceBidButton } from './PlaceBidButton/PlaceBidButton'

export const PROVIDER_DOWN_MESSAGE = () => 'Scatter is down, connect wallet :('

export const SidePanel: React.FC = () => {
    
    const getName = useParallelAuctionState(state => state.getCurrentTokenName)
    const getImg = useParallelAuctionState(state => state.getImage)
    const lineUpdater = useParallelAuctionState(state => state.getCurrentSelectedLine)
    
    // NOTE I need this ugly state to only update `line`
    // some time after `lineIndex` gets updated. See this component
    // `useEffect`.
    const [ line, setLine ] = useState(lineUpdater())
    const lineIndex = useParallelAuctionState(state => state.currentLineIndex)
    
    const sidePanelRef = useRef<HTMLDivElement>(null)

    const tokenName = pipe(
        getName(),
        O.getOrElse(PROVIDER_DOWN_MESSAGE)
    )

    const currentBid = pipe(
        line,
        O.map(line => `Ξ${fromWei(line.currentPrice)}`),
        O.getOrElse(PROVIDER_DOWN_MESSAGE)
    )
    
    const endTime = pipe(
        line,
        O.map(line => Number(line.endTime)),
    )

    const imageUrl = pipe(
        line,
        O.map(line => getImg(O.of(Number(line.head)))),
        O.getOrElse(() => getImg(O.none))
    )

    const currentWinner = pipe(
        line,
        O.flatMap(line => formatAddr(line.currentWinner.toString(), 11)),
        O.getOrElse(PROVIDER_DOWN_MESSAGE)
    )
   

    const isFirstRender = useRef(0)
    
    useLayoutEffect(() => {
        // Ignore this hack.
        if (isFirstRender.current < 2) {
            isFirstRender.current++
            return
        }
            
        if (!sidePanelRef.current) return

        sidePanelRef.current.style.transform = 'translateX(600px)'
        setTimeout(() => {
            setLine(lineUpdater())
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
