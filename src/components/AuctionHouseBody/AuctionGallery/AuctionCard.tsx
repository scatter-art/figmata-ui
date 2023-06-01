import React from 'react'
import style from './AuctionCard.module.css'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'
import { useParallelAuctionState } from '../../../state/autoAuctionStore'
import { fromWei } from '../../../utils/web3'
import { Countdown } from '../../Utils/Countdown'

interface AuctionCardProps {
    lineIndex: number;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ lineIndex }) => {

    const getImg = useParallelAuctionState(state => state.getImage)
    const updateLine = useParallelAuctionState(state => state.updateLine)
    const setCurrentSelectedLine = useParallelAuctionState(state => state.setCurrentSelectedIndex)
    const line = useParallelAuctionState(state => state.getLine)(lineIndex)

    const imageUrl = pipe(
        line,
        O.map(line => getImg(O.of(Number(line.head)))),
        O.getOrElse(() => getImg(O.none))
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

    const onCardClick = async () => {
        const newLine = await updateLine(lineIndex)
        setCurrentSelectedLine(lineIndex)
    }

	return (
		<div className={style['auction-card']} onClick={onCardClick}>
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
