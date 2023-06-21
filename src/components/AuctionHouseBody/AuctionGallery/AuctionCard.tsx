import React from 'react'
import style from './AuctionCard.module.css'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'
import { useParallelAuctionState } from '../../../state/autoAuctionStore'
import { hideSidePanelObserver, showSidePanelObserver } from '../../../state/observerStore'
import { fromWei } from '../../../utils/web3'
import { sleep } from '../../../utils/pure'
import Countdown from 'react-countdown'
import { vipIds } from './AuctionGallery'

interface AuctionCardProps {
    lineIndex: number
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ lineIndex }) => {

    const updateLine = useParallelAuctionState(state => state.updateLine)
    const setCurrentSelectedLine = useParallelAuctionState(state => state.setCurrentSelectedIndex)
    const line = useParallelAuctionState(state => state.getLine)(lineIndex)

    const isVip = pipe(
        line,
        O.map(l => l.head),
        O.exists(i => vipIds.includes(Number(i)))
    )

    const hideSidePanel = hideSidePanelObserver(s => s.notifyObservers)
    const showSidePanel = showSidePanelObserver(s => s.notifyObservers)

    const imageUrl = useParallelAuctionState(s => s.getImage)(lineIndex)

    const currentBid = pipe(
        line,
        O.map(line => `BID: ${fromWei(line.currentPrice)}`),
        O.getOrElse(() => '')
    )

    const endTime = pipe(
        line,
        O.map(line => Number(line.endTime)),
    )

    const onCardClick = async () => {
        hideSidePanel()
        // NOTE This sleep should be based on how long the side panel
        // hidding animation takes.
        await sleep(0.25)
        await updateLine(lineIndex)
        setCurrentSelectedLine(lineIndex)
        showSidePanel()
    }

    return (
        <div className={style['auction-card']} onClick={onCardClick} data-is-vip={isVip}>
            <div className={style['thumbnail-container']}>
                <span className={style['vip-string']}>VIP</span>

                <div className={style['vip-badge-container']}>
                    <div className={style['vip-badge']}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="m772-635-43-100-104-46 104-45 43-95 43 95 104 45-104 46-43 100Zm0 595-43-96-104-45 104-45 43-101 43 101 104 45-104 45-43 96ZM333-194l-92-197-201-90 201-90 92-196 93 196 200 90-200 90-93 197Z"/></svg>
                    </div>
                </div>

                <span className={style['vip-string']}>ONLY</span>

                <div
                    className={style['thumbnail']}
                    style={{ backgroundImage: `url(${imageUrl})` }}
                >
                </div>
            </div>
            <div className={style['details']}>
                <span>{currentBid}</span>
                <span> {O.isSome(endTime) ?
                    <Countdown date={endTime.value*1000} daysInHours/> : ''
                } </span>
            </div>
            <button className={style['action']}>
                {O.isSome(endTime) ? 'PLACE BID' : '404 :('}
            </button>
        </div>
    )
}
