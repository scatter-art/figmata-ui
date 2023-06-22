import { pipe } from 'fp-ts/lib/function'
import style from './AuctionGallery.module.css'
import * as O from 'fp-ts/Option'
import { useParallelAuctionState } from '../../../state/autoAuctionStore'
import { AuctionCard } from './AuctionCard'

// Epic hardcode :3
export const vipIds = [
    1, 7, 51, 55, 171, 81, 114, 180, 230, 211, 210, 17, 179, 247, 288, 308, 36, 323, 8
]

export const AuctionGallery = () => {

    const linesOpt = useParallelAuctionState(state => state.lines)

    const lines = pipe(
        linesOpt,
        // NOTE This 10 shouldn't be hardcoded.
        O.getOrElse(() => new Array(10).fill(O.none))
    )

	return (
		<div id={style['auction-container']}>
            {lines.map((_,i) => <AuctionCard 
                lineIndex={i} 
                key={i} 
            /> )}
		</div>
	)
}
