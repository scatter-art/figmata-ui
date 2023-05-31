import React, { ChangeEvent, useEffect, useState } from "react";
import { useParallelAuctionState } from "../../../state/autoAuctionStore";
import style from './PlaceBidButton.module.css'

/*
const calcMinPriceForLine = (line: LineStateStruct): string => {
    // TODO The initial price and bid increment should be queried 
    // from the contract and stored in the store state, not hardcoded here.
    if (fromWei(line.currentPrice) == '0.0') return '0.1'
    return String(Number(fromWei(line.currentPrice)) + 0.05)
};*/

// TODO lineState shouldn't be passed as arg, it should be decoupled
// to the contract store.
export const PlaceBidButton = () => {
    
    //const line = useParallelAuctionState(state => state.currentSelectedLine)

    /*const minPrice = calcMinPriceForLine(lineState)

    const [inputValue, setInputValue] = useState<number>(0)

    const handleNewInput = (newValue: number) => {
        if (isNaN(newValue) || newValue < parseFloat(minPrice))
            setInputValue(parseFloat(minPrice))
        else setInputValue(newValue)
    }

    useEffect(() => {
        setInputValue(parseFloat(minPrice))
    }, [minPrice])*/

    return (
        <div id={style['place-bid-button-container']}>
            <div id={style['place-bid-button']}>
                <span>PLACE YOUR BID</span>
            </div>
        </div>
    )

    {/*return <>
        <button>
            PlaceBid
        </button>
        <input
            type='number'
            placeholder={minPrice}
            min={minPrice}
            step='0.1'
            onChange={event => handleNewInput(parseFloat(event.target.value))}
            value={inputValue}
        />
    </>*/}
}
