import { useUserStore } from "../state/userStore"

const useWalletText = () => {
    const connected = useUserStore(s => s.userConnected)()
    if (connected) return 'Disconnect'
    else return 'Connect'
}

const useHandler = () => {
    const state = useUserStore
    if(state(s => s.userConnected)())
        state(s => s.disconnectUser)()
    else state(s => s.connectUser)()
}

export const DappConnector = () => {
    return <button onClick={useHandler}>
        {useWalletText()}
    </button>
}
