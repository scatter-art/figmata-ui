import { useUserStore } from '../../../state/userStore'
import style from './DappConnector.module.css'
import toast from 'react-hot-toast'
import * as E from 'fp-ts/Either'

export const DappConnector = () => {
	const userConnected = useUserStore((state) => state.userConnected)
	const connection = useUserStore((state) => state.connectUser)
	const disconnection = useUserStore((state) => state.disconnectUser)
	const userAddr = useUserStore((state) => state.formattedUserAddress)

	const handleClick = async () => {
		if (!userConnected && E.isRight(await connection()))
			toast.success('Wallet connected')
		else {
			disconnection()
			toast('Wallet disconnected')
		}
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
