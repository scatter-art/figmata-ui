import style from './AuctionGallery.module.css'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import { AuctionCard } from './AuctionCard'
import { auctionsAtTheSameTime } from '../../../state/autoAuctionStore'


export const AuctionGallery = () => (
    <div id={style['auction-container']}>
        <div id={style['placeholder-overlay']}></div>
        {RNEA.range(0, auctionsAtTheSameTime - 1).map((_,i) => {
            return <AuctionCard lineIndex={i} key={i} />
        })}
    </div>
)
