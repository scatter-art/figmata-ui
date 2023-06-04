import { create } from "zustand"

type ObserverStoreState = {
    /**
     * @dev All observers will just subscribe to this state.
     */
    observer: number,

    /**
     * @dev Observer notifiers will call this function to re-render all its
     * observers.
     */
    notifyObservers: () => void,
}

const mkObserver = () => create<ObserverStoreState>(set => ({
    observer: 0,
    notifyObservers: () => set(s => ({observer: s.observer + 1 }))
}))

/**
 * @dev This observer will be used to notify a state change request
 * over a `SidePanel.tsx`.
 */
export const hideSidePanelObserver = mkObserver()
export const showSidePanelObserver = mkObserver()
export const reRenderSidePanelObserver = mkObserver()
