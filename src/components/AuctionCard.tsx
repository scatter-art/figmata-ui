import React from 'react'
import style from './AuctionCard.module.css'
import * as O from 'fp-ts/Option'
import { LineStateStruct } from '../types/IHoldsParallelAutoAuctionData'
import { pipe } from 'fp-ts/lib/function'
import { useParallelAuctionState } from '../state/autoAuctionStore'
import { fromWei } from '../utils/web3'
import { Countdown } from './Countdown'

interface AuctionCardProps {
    line: O.Option<LineStateStruct>
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ line }) => {

    const getImg = useParallelAuctionState(state => state.getImage)

    const imageUrl = pipe(
        line,
        O.map(line => getImg(Number(line.head))),
        O.getOrElse(() => getImg(0))
    )

    const currentBid = pipe(
        line,
        O.map(line => `Ξ${fromWei(line.currentPrice)}`),
        O.getOrElse(() => '')
    )
    
    const endTime = pipe(
        line,
        O.map(line => Number(line.endTime)),
    )

	return (
		<div className={style['auction-card']}>
			<div className={style['thumbnail-container']}>
				<div 
                    className={style['thumbnail']}
                    style={{ backgroundImage: `url(${imageUrl})`}}
                ></div>
			</div>
			<div className={style['details']}>
				<span>{currentBid}</span>
				<span> {O.isSome(endTime) ? 
                    <Countdown endTimestamp={endTime.value} /> : ''
                } </span>
			</div>
			<button className={style['action']}>
                {O.isSome(endTime) ? 'PLACE BID' : '404 :('}
            </button>
		</div>
	)
}
