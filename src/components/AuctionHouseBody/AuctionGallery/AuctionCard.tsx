import React from 'react'
import style from './AuctionCard.module.css'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'
import { useParallelAuctionState } from '../../../state/autoAuctionStore'
import { hideSidePanelObserver, showSidePanelObserver } from '../../../state/observerStore'
import { fromWei } from '../../../utils/web3'
import { sleep } from '../../../utils/pure'
import Countdown from 'react-countdown'
import { VipBadgeSvg } from './VipBadgeSvg'

interface AuctionCardProps {
    lineIndex: number
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ lineIndex }) => {

    const updateLine             = useParallelAuctionState(s => s.updateLine)
    const setCurrentSelectedLine = useParallelAuctionState(s => s.setCurrentSelectedIndex)
    const line                   = useParallelAuctionState(s => s.getLine(lineIndex))
    const imageUrl               = useParallelAuctionState(s => s.getImage(lineIndex))
    const isVip                  = useParallelAuctionState(s => s.getLineIsVip(line))

    const isUserWinning = true;

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
        <div className={style['auction-card']} onClick={onCardClick} data-is-vip={isVip} data-is-winning={isUserWinning}>
            <div className={style['user-winning-string-container']}>
                <span>YOU ARE WINNING!</span>
            </div>

            <div className={style['thumbnail-container']}>
                <span className={style['vip-string']}>VIP</span>

                <div className={style['user-winning-badge']}>
                    <svg width="40" height="56" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0H40V56L20 46L0 56V0Z" fill="#F7DC43"/>
                        <mask id="mask0_71_686" maskUnits="userSpaceOnUse" x="8" y="10" width="24" height="24">
                        <rect x="8" y="10" width="24" height="24" fill="#D9D9D9"/>
                        </mask>
                        <g mask="url(#mask0_71_686)">
                        <path d="M20 33L17 30H13C12.45 30 11.9792 29.8042 11.5875 29.4125C11.1958 29.0208 11 28.55 11 28V14C11 13.45 11.1958 12.9792 11.5875 12.5875C11.9792 12.1958 12.45 12 13 12H27C27.55 12 28.0208 12.1958 28.4125 12.5875C28.8042 12.9792 29 13.45 29 14V28C29 28.55 28.8042 29.0208 28.4125 29.4125C28.0208 29.8042 27.55 30 27 30H23L20 33ZM13 26.85C13.9 25.9667 14.9458 25.2708 16.1375 24.7625C17.3292 24.2542 18.6167 24 20 24C21.3833 24 22.6708 24.2542 23.8625 24.7625C25.0542 25.2708 26.1 25.9667 27 26.85V14H13V26.85ZM20 22C20.9667 22 21.7917 21.6583 22.475 20.975C23.1583 20.2917 23.5 19.4667 23.5 18.5C23.5 17.5333 23.1583 16.7083 22.475 16.025C21.7917 15.3417 20.9667 15 20 15C19.0333 15 18.2083 15.3417 17.525 16.025C16.8417 16.7083 16.5 17.5333 16.5 18.5C16.5 19.4667 16.8417 20.2917 17.525 20.975C18.2083 21.6583 19.0333 22 20 22ZM20 20C19.5833 20 19.2292 19.8542 18.9375 19.5625C18.6458 19.2708 18.5 18.9167 18.5 18.5C18.5 18.0833 18.6458 17.7292 18.9375 17.4375C19.2292 17.1458 19.5833 17 20 17C20.4167 17 20.7708 17.1458 21.0625 17.4375C21.3542 17.7292 21.5 18.0833 21.5 18.5C21.5 18.9167 21.3542 19.2708 21.0625 19.5625C20.7708 19.8542 20.4167 20 20 20ZM20 30.2L22.2 28H25V27.75C24.3 27.1667 23.525 26.7292 22.675 26.4375C21.825 26.1458 20.9333 26 20 26C19.0667 26 18.175 26.1458 17.325 26.4375C16.475 26.7292 15.7 27.1667 15 27.75V28H17.8L20 30.2Z" fill="#8A7606"/>
                        </g>
                    </svg>
                </div>

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
