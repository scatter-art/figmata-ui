import React from "react";
import * as O from 'fp-ts/Option'
import { useParallelAuctionState } from "../../../state/autoAuctionStore";
import { EtherscanSvg } from "../../Svgs/EtherscanSvg";
import { OpenseaSvg } from "../../Svgs/OpenseaSvg";
import style from './GalleryModalTile.module.css'
import { useGalleryStore } from "../../../state/galleryStore";
import { pipe } from "fp-ts/lib/function";

export type GalleryModalTileProps = {
    id: number
}

// FIXME Hardcode for the lulz.
const tokenEtherscanUrl = 'https://etherscan.io/token/0xe61443f7db3ca8b7fc083602dcc52726db3d5ff6?a='
const tokenOpenseaUrl = 'https://opensea.io/assets/ethereum/0xe61443f7db3ca8b7fc083602dcc52726db3d5ff6/'
const ipfsGateway = 'https://ipfs.io/ipfs/bafybeiam3hfazboofhhid2azc2qi4oksapfhtbdz6mls7lonc5lf62yeaa/'

export const GalleryModalTile: React.FC<GalleryModalTileProps> = ({ id }) => {

    //const imageUrl  = useParallelAuctionState(s => s.getImageForId(id))
    const imageUrl = `${ipfsGateway}${id}.png`
    const tokenName = useParallelAuctionState(s => s.getFormattedTokenNameFoId(id))
    const data      = useGalleryStore(s => s.getGalleryCardDataFor(id))

    const winner      = pipe(data, O.map(d => d.winner), O.getOrElse(() => 'Loading'))
    const hammerPrice = pipe(data, O.map(d => d.price), O.getOrElse(() => 'Loading'))
    const totalBids   = pipe(data, O.map(d => d.totalBids), O.getOrElse(() => 0))
    const totalBiddedAmount = pipe(data, O.map(d => d.totalBiddedAmount), O.getOrElse(() => 'Loading'))

    return (
        <div className={style['gallery-modal-tile-container']}>
            <div className={style['thumb']} data-is-ready={O.isSome(data)}>
                <img src={O.isSome(data) ? imageUrl : '/404.png'} alt={tokenName}/>
            </div>

            <div className={style['body']}>
                <h3>{tokenName}</h3>
                <div className={style['row']}>
                    <span>WINNER:</span>
                    <span>{winner}</span>
                </div>

                <div className={style['row']}>
                    <span>HAMMER PRICE:</span>
                    <span>{hammerPrice}</span>
                </div>

                <div className={style['row']}>
                    <span>TOTAL BIDS:</span>
                    <span>{totalBids}</span>
                </div>

                <div className={style['row']}>
                    <span>TOTAL BID VOLUME:</span>
                    <span>{totalBiddedAmount}</span>
                </div>

                <div className={style['aux']}>
                    <a href={`${tokenEtherscanUrl}${id}`}  target="_blank" rel="noopener noreferrer">
                        <EtherscanSvg />
                    </a>

                    <a href={`${tokenOpenseaUrl}${id}`} target="_blank" rel="noopener noreferrer">
                        <OpenseaSvg />
                    </a>
                </div>

            </div>
        </div>
    )
}
