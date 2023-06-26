import React, { useEffect, useState } from 'react'
import style from './AuctionCard.module.css'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'
import { useParallelAuctionState } from '../../../state/autoAuctionStore'
import { hideSidePanelObserver, showSidePanelObserver } from '../../../state/observerStore'
import { fromWei, ZERO_ADDR } from '../../../utils/web3'
import { sleep } from '../../../utils/pure'
import Countdown from 'react-countdown'
import { VipBadgeSvg } from './VipBadgeSvg'
import { useUserStore } from '../../../state/userStore'

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
    const userAddress = useUserStore(s => s.userAddress)
    
    const isUserWinning = pipe(
        O.Do,
        O.bind('userAddr', () => userAddress),
        O.bind('winner', () => pipe(line, O.map(l => l.currentWinner))),
        O.exists(({ userAddr, winner }) => userAddr === winner)
    )

    const [userHasWonAnyTime, setUserHasWonAnyTime] = useState<boolean>(false)

    useEffect(() => {
        if (isUserWinning) setUserHasWonAnyTime(true)
    }, [isUserWinning])

    useEffect(() => {
        const newAuction = pipe(
            line,
            O.exists(l => l.currentWinner.toString() === ZERO_ADDR)
        )
        // If the auction changed then remove the badge!
        if (newAuction) setUserHasWonAnyTime(false)
    }, [line])

    const auctionStatusText = isUserWinning
        ? 'YOU ARE WINNING!'
        : userHasWonAnyTime 
            ? 'YOU GOT OUTBIDDED!'
            : ''
   

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
            data-is-winning={isUserWinning || userHasWonAnyTime}
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
