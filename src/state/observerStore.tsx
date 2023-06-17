import { boolean } from "fp-ts"
import { create } from "zustand"
import * as O from 'fp-ts/Option'

type ObserverStoreState = {
    /**
     * @dev All observers will just subscribe to this state.
     */
    observer: O.Option<{ 
        firstTimeNotified: boolean,
        counter: number 
    }>,

    /**
     * @dev Observer notifiers will call this function to re-render all its
     * observers.
     */
    notifyObservers: () => void,
}

const mkObserver = () => create<ObserverStoreState>(set => ({

    observer: O.none,

    notifyObservers: () => set(s => {

        if (O.isNone(s.observer)) 
            return { observer: O.some({ 
                firstTimeNotified: true,
                counter: 1
            })}

        const currentCount = s.observer.value.counter
        return { observer: O.some({
            firstTimeNotified: false,
            counter: currentCount + 1
        })}

    })

}))

/**
 * @dev This observer will be used to notify a state change request
 * over a `SidePanel.tsx`.
 */
export const hideSidePanelObserver = mkObserver()
export const showSidePanelObserver = mkObserver()
export const reRenderSidePanelObserver = mkObserver()
export const pageSwapObserver = mkObserver()
