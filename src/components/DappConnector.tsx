import { useUserStore } from "../state/userStore"

export const DappConnector = () => {
    const userProvider = useUserStore(state => state.userProvider)
}
