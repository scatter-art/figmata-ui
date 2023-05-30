import { useParallelAuctionState } from '../../state/autoAuctionStore'
import { AuctionCard } from '../AuctionCard'
import style from './AuctionGallery.module.css'

export const AuctionGallery = () => {

    const lines = useParallelAuctionState(state => state.getAllCurrentLines)()

	return (
		<div id={style['auction-container']}>
            {lines.map(line => <AuctionCard line={line} />)}
		</div>
	)
}
