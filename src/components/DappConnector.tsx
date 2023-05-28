import React, { CSSProperties } from 'react'
import { useUserStore } from "../state/userStore"

export const DappConnector: React.FC<{style?: CSSProperties}> = ({ style }) => {
    
    const userConnected = useUserStore(state => state.userConnected)
    const connection = useUserStore(state => state.connectUser)
    const disconnection = useUserStore(state => state.disconnectUser)

    const handleClick = async () => {
        if (!userConnected) connection()
        else disconnection()
    }

    const getWalletText = () => {
        if (userConnected) return 'Disconnect'
        else return 'Connect'
    }

    return <button style={style} onClick={handleClick}>
        {getWalletText()}
    </button>
}

