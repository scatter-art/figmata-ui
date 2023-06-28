import React from "react";
import * as O from 'fp-ts/Option'
import { PROVIDER_DOWN_MESSAGE, useParallelAuctionState } from "../../../state/autoAuctionStore";
import { EtherscanSvg } from "../../Svgs/EtherscanSvg";
import { OpenseaSvg } from "../../Svgs/OpenseaSvg";
import style from './GalleryModalTile.module.css'
import { useGalleryStore } from "../../../state/galleryStore";
import { pipe } from "fp-ts/lib/function";

export type GalleryModalTileProps = {
    id: number
}

export const GalleryModalTile: React.FC<GalleryModalTileProps> = ({ id }) => {

    const imageUrl  = useParallelAuctionState(s => s.getImageForId(id))
    const tokenName = useParallelAuctionState(s => s.getFormattedTokenNameFoId(id))
    const data      = useGalleryStore(s => s.getGalleryCardDataFor(id))

    const winner      = pipe(data, O.map(d => d.winner), O.getOrElse(PROVIDER_DOWN_MESSAGE))
    const hammerPrice = pipe(data, O.map(d => d.price), O.getOrElse(PROVIDER_DOWN_MESSAGE))
    const totalBids   = pipe(data, O.map(d => d.totalBids), O.getOrElse(() => 0))

    const etherscanUrl = '' // TODO
    const openSeaUrl = '' // TODO

    return (
        <div className={style['gallery-modal-tile-container']}>
            <div className={style['thumb']}>
                <img src={imageUrl} alt={tokenName}/>
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

                <div className={style['aux']}>
                    <a href={etherscanUrl}  target="_blank" rel="noopener noreferrer">
                        <EtherscanSvg />
                    </a>

                    <a href={openSeaUrl} target="_blank" rel="noopener noreferrer">
                        <OpenseaSvg />
                    </a>
                </div>

            </div>
        </div>
    )
}
