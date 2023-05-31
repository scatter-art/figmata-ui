import React, { ChangeEvent, useEffect, useState } from "react";
import { useParallelAuctionState } from "../../../state/autoAuctionStore";
import style from './PlaceBidButton.module.css'
import * as O from 'fp-ts/Option'
import { pipe } from "fp-ts/lib/function";
import { AuctionConfigStruct, LineStateStruct } from "../../../types/IHoldsParallelAutoAuctionData";
import { fromWei } from "../../../utils/web3";
import { ethers } from "ethers";
import { PROVIDER_DOWN_MESSAGE } from "../SidePanel";
import { useUserStore } from "../../../state/userStore";

const calcMinPriceForLine = (
    line: O.Option<LineStateStruct>,
    config: O.Option<AuctionConfigStruct>
): string => {
    
    const newPrice = pipe(
        O.Do,
        O.bind('line', () => line),
        O.bind('config', () => config),
        O.flatMap(({ line, config }) => O.of(fromWei(line.currentPrice) == '0.0' ?
            ethers.getBigInt(config.startingPrice) :
            ethers.getBigInt(line.currentPrice) + ethers.getBigInt(config.bidIncrement)
        ))
    )

    return pipe(
        newPrice,
        O.map(fromWei),
        O.getOrElse(PROVIDER_DOWN_MESSAGE)
    )
}

// TODO lineState shouldn't be passed as arg, it should be decoupled
// to the contract store.
export const PlaceBidButton = () => {
    
    const line = useParallelAuctionState(state => state.currentSelectedLine)
    const config = useParallelAuctionState(state => state.getAuctionConfig)()
    const createBid = useParallelAuctionState(state => state.createBid)

    const updateLine = useParallelAuctionState(state => state.updateLine)
    const setNewLine = useParallelAuctionState(state => state.setCurrentSelectedLine)
    // FIXME
    const userProv = useUserStore(state => state.userProvider)

    const minPrice = calcMinPriceForLine(line, config)

    const [inputValue, setInputValue] = useState<number>(0)

    const handleNewInput = (newValue: number) => {
        if (isNaN(newValue) || newValue < parseFloat(minPrice))
            setInputValue(parseFloat(minPrice))
        else setInputValue(newValue)
    }

    useEffect(() => {
        setInputValue(parseFloat(minPrice))
    }, [minPrice])
    
    const getModal = () => pipe(
        O.fromNullable(document.getElementById('bidModal')),
        O.flatMap(modal => O.tryCatch(() => modal as HTMLDialogElement)),
    )

    const handleModalOppening = () => pipe(
        getModal(),
        O.map(modal => modal.showModal())
    )

    const handleModalClosing = () => pipe(
        getModal(),
        O.map(modal => modal.close())
    )

    const handleBidConfirmation = async () => {
        const tx = await createBid(inputValue)
        if (O.isNone(tx)) return // TODO Handle signature failed
        const receipt = await tx.value.wait()
        console.log(receipt)
        const newLine = await updateLine(line) 
        setNewLine(newLine)
        handleModalClosing()
    }
    
    // TODO Handle wallet not connected.
    return (
        <>
        <div id={style['place-bid-button-container']} onClick={handleModalOppening}>
            <div id={style['place-bid-button']}>
                <span>PLACE YOUR BID</span>
            </div>
        </div>
        <dialog id='bidModal'>
            <input
                id={style['bid-input']}
                type='number'
                placeholder={minPrice}
                min={minPrice}
                step={minPrice.toString()}
                onChange={event => handleNewInput(parseFloat(event.target.value))}
                value={inputValue}
            />
            <div>
                <button id={style['confirm-modal']} onClick={handleBidConfirmation}>
                    Confirm
                </button>
                <button id={style['cancel-modal']} onClick={handleModalClosing}>
                    Cancel
                </button>
            </div>
        </dialog>
        </>
    )
}
