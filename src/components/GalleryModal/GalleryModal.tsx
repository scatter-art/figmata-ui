import * as O from 'fp-ts/Option'
import React, {useState, useEffect} from "react";
import { useGalleryStore } from "../../state/galleryStore";
import style from './GalleryModal.module.css'
import { GalleryModalTile } from "./GalleryModalTile/GalleryModalTile";

const itemsToShowPerLoad = 6

export const GalleryModal: React.FC = () => {

    const loadIds = useGalleryStore(s => s.getAllWonIds)
    const ids = useGalleryStore(s => s.wonIds)

    // NOTE This function could be used to change the ids order from
    // ascending to descending.
    //const swap = useGalleryStore(s => s.reverseGallery)

    const [isVisible, setIsVisible] = useState(false);
    const openModal = () => {
        if (O.isNone(ids)) loadIds()
        setIsVisible(true)
    }
    const closeModal = () => setIsVisible(false)

    const [visibleItems, setVisibleItems] = useState<number>(itemsToShowPerLoad)

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeModal()
        }

        if (isVisible) window.addEventListener("keydown", handleEsc)
        else window.removeEventListener("keydown", handleEsc)

        return () => window.removeEventListener("keydown", handleEsc)
    }, [isVisible])

    const handleLoadMore = () => {
        if (O.isSome(ids)) setVisibleItems(
            current => Math.min(current + itemsToShowPerLoad, ids.value.length)
        )
    }

    return <>
        <div id={style['gallery-button-container']}>
            <button id={style['gallery-button']} onClick={openModal}>Gallery</button>
        </div>


        <div id={style['gallery-modal-container']} data-is-visible={isVisible}>
            <div className={style['header']}>
                <h2>Figmata Gallery</h2>
                <button id={style['action-close']} onClick={closeModal}>x</button>
            </div>

            <div className={style['body']}>
                {O.isSome(ids) ? ids.value.slice(0, visibleItems).map(id => 
                    <GalleryModalTile id={id} key={id}/> 
                ) :  
                    <span style={{color: 'gray', fontSize: '32px'}}>Loading...</span>
                }
            </div>

            {O.isSome(ids) && visibleItems < ids.value.length && (
                <button 
                    onClick={handleLoadMore}
                    id={style['load-more-button']}
                >Load More</button>
            )}
        </div>
    </>
}
