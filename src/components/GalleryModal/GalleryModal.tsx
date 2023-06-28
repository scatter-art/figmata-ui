import * as O from 'fp-ts/Option'
import React, {useState, useEffect} from "react";
import { useGalleryStore } from "../../state/galleryStore";
import style from './GalleryModal.module.css'
import { GalleryModalTile } from "./GalleryModalTile/GalleryModalTile";

export const GalleryModal: React.FC = () => {

    const ids = useGalleryStore(s => s.getAllWonIds)()

    const [isVisible, setIsVisible] = useState(false);
    const openModal = () => setIsVisible(true)
    const closeModal = () => setIsVisible(false)

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeModal()
        }

        if (isVisible) window.addEventListener("keydown", handleEsc)
        else window.removeEventListener("keydown", handleEsc)

        return () => window.removeEventListener("keydown", handleEsc)
    }, [isVisible])

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
                {O.isSome(ids) ? ids.value.slice(0, 4).map(id => 
                    <GalleryModalTile id={id} key={id}/> 
                ) :  
                    <span style={{color: 'gray', fontSize: '32px'}}>Loading...</span>
                }
            </div>
        </div>
    </>
}
