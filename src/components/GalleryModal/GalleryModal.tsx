import React, {useState, useEffect} from "react";
import style from './GalleryModal.module.css'
import { GalleryModalTile } from "./GalleryModalTile/GalleryModalTile";

export const GalleryModal: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    const openModal = () => {
        setIsVisible(true);
    };

    const closeModal = () => {
        setIsVisible(false);
    };

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeModal()
            }
        }

        if (isVisible) {
            window.addEventListener("keydown", handleEsc)
        } else {
            window.removeEventListener("keydown", handleEsc)
        }

        return () => {
            window.removeEventListener("keydown", handleEsc)
        }
    }, [isVisible])

    return (
        <>
        <div id={style['gallery-button-container']}>
            <button id={style['gallery-button']} onClick={openModal}>Gallery</button>
        </div>


            <div id={style['gallery-modal-container']} data-is-visible={isVisible}>
                <div className={style['header']}>
                    <h2>Figmata Gallery</h2>
                    <button id={style['action-close']} onClick={closeModal}>x</button>
                </div>

                <div className={style['body']}>
                    {/* TODO: Currently hardcoded sample tiles need to be rendered dynamically here */}
                    <GalleryModalTile id={1}/>
                    <GalleryModalTile id={2}/>
                    <GalleryModalTile id={3}/>
                    <GalleryModalTile id={4}/>
                    <GalleryModalTile id={5}/>
                </div>
            </div>
        </>
    )
}
