import React, { useEffect, useState } from "react";

import { formattedTimeLeft } from "../utils/pure";
import * as O from 'fp-ts/Option'

export const Countdown: React.FC<{
    endTimestamp: number,
    timerFinishedText?: string
}> = ({ endTimestamp, timerFinishedText = 'Finished!'}) => {
    
    const [
        timeLeft, setTimeLeft
    ] = useState<O.Option<string>>(formattedTimeLeft(endTimestamp))
    
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(formattedTimeLeft(endTimestamp))
        }, 1000);
        return () => { clearInterval(timer) }
    }, [endTimestamp])

    return <>{O.isSome(timeLeft) ? timeLeft.value : timerFinishedText}</>
}
