import { useUserStore } from '../../../state/userStore'
import style from './DappConnector.module.css'

export const DappConnector = () => {
    
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

    return (
        <div id={style['connect-button-container']}>
            <div id={style['connect-button']} onClick={handleClick}>
                <span>{getWalletText()}</span>
            </div>
        </div>
    )

}

