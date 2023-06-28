import React from "react";
import { useParallelAuctionState } from "../../../state/autoAuctionStore";
import { useGalleryStore } from "../../../state/galleryStore";
import { EtherscanSvg } from "../../Svgs/EtherscanSvg";
import { OpenseaSvg } from "../../Svgs/OpenseaSvg";
import style from './GalleryModalTile.module.css'

export type GalleryModalTileProps = {
    id: number
}

export const GalleryModalTile: React.FC<GalleryModalTileProps> = ({ id }) => {
    const imageUrl = useParallelAuctionState(s => s.getImageForId(id))
    const tokenName = useParallelAuctionState(s => s.getFormattedTokenNameFoId(id))
    //const d = useGalleryStore(s => s.getGalleryCardDataFor)(id)

    const winner = 'savethefrogs.eth'
    const hammerPrice = '1.25'
    const totalBids = '12'
    const etherscanUrl = ''
    const openSeaUrl = ''

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
