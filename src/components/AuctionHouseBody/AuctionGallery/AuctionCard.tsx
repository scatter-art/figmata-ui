import React from 'react'
import style from './AuctionCard.module.css'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'
import { useParallelAuctionState } from '../../../state/autoAuctionStore'
import { hideSidePanelObserver, showSidePanelObserver } from '../../../state/observerStore'
import { fromWei } from '../../../utils/web3'
import { sleep } from '../../../utils/pure'
import Countdown from 'react-countdown'
import { VipBadgeSvg } from '../../Svgs/VipBadgeSvg'
import { useUserStatusStore } from '../../../state/userStatusStore'

interface AuctionCardProps {
    lineIndex: number
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ lineIndex }) => {

    const updateLine             = useParallelAuctionState(s => s.updateLine)
    const setCurrentSelectedLine = useParallelAuctionState(s => s.setCurrentSelectedIndex)
    const line                   = useParallelAuctionState(s => s.getLine(lineIndex))
    const imageUrl               = useParallelAuctionState(s => s.getImage(lineIndex))
    const isVip                  = useParallelAuctionState(s => s.getLineIsVip(line))


    /* ---------------- WINNING BADGE HANDLING ---------------- */
    const lineStatus = useUserStatusStore(s => s.getUserLineStatus)(line)
    
    const auctionStatusText = O.fold(
        () => '',
        s => { switch(s) {
            case 'userIsWinning': return 'YOU ARE WINNING!';
            case 'userGotOutbidded': return 'OUTBIDDED!';
            case 'userHasToClaim': return 'BID TO CLAIM!'
        }}
    )(lineStatus)


    /* ---------------- AUCTION DATA MANIPULATION ---------------- */
    const hideSidePanel = hideSidePanelObserver(s => s.notifyObservers)
    const showSidePanel = showSidePanelObserver(s => s.notifyObservers)

    const formattedCurrentBid = pipe(
        line,
        O.map(l => l.currentPrice),
        O.map(fromWei),
        O.map(parseFloat),
        O.map(n => n.toFixed(2)),
        O.map(f => `BID: ${f}`),
        O.getOrElse(() => '0.00')
    )

    const endTime = pipe(
        line,
        O.map(l => Number(l.endTime)),
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
        <div 
            className={style['auction-card']}
            onClick={onCardClick}
            data-is-vip={isVip}
            data-is-winning={O.isSome(lineStatus)}
        >
            <div className={style['user-winning-string-container']}>
                <span>{auctionStatusText}</span>
            </div>

            <div className={style['thumbnail-container']}>
                <span className={style['vip-string']}>VIP</span>

                <div className={style['vip-badge-container']}>
                    <div className={style['vip-badge']}>
                        <VipBadgeSvg />
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
                <span>{formattedCurrentBid}</span>
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
