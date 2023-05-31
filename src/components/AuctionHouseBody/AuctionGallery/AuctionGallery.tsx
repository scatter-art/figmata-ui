import { pipe } from 'fp-ts/lib/function'
import style from './AuctionGallery.module.css'
import * as O from 'fp-ts/Option'
import { useParallelAuctionState } from '../../../state/autoAuctionStore'
import { AuctionCard } from './AuctionCard'

export const AuctionGallery = () => {

    const linesOpt = useParallelAuctionState(state => state.lines)
    
    const lines = pipe(
        linesOpt,
        // NOTE This 10 shouldn't be hardcoded.
        O.getOrElse(() => new Array(10).fill(O.none))
    )

	return (
		<div id={style['auction-container']}>
            {lines.map((line, i) => <AuctionCard line={line} key={i} /> )}
		</div>
	)
}
