import { pipe } from 'fp-ts/lib/function'
import { useUserStore } from '../../../state/userStore'
import style from './DappConnector.module.css'
import * as O from 'fp-ts/Option'
import { formatAddr } from '../../../utils/web3'

export const DappConnector = () => {
    
    const userConnected = useUserStore(state => state.userConnected)
    const connection = useUserStore(state => state.connectUser)
    const disconnection = useUserStore(state => state.disconnectUser)
    const userAddr = useUserStore(state => state.formattedUserAddress)

    const handleClick = async () => {
        if (!userConnected) connection()
        else disconnection()
    }

    const getWalletText = () => {
        if (userConnected) return `Disconnect ${userAddr}`
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

