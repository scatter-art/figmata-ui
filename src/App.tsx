import './style-dictionary/tokens/_STYLE_TOKENS_.css'
import './style/typography.css'
import './App.css'
import { FigmataPage } from './components/FigmataPage'
import { CountDownPage } from './components/CountDownPage'
import { useEffect, useState } from 'react'
import { pageSwapObserver } from './state/observerStore'
import { pipe } from 'fp-ts/lib/function'
import * as O from 'fp-ts/Option'

function App() {
    
    const [ shouldShowTimer, setShouldShowTimer ] = useState(true)
    const shouldChangePage = pageSwapObserver(s => s.observer) 
    
    useEffect(() => pipe(
        O.isSome(shouldChangePage),
        b => setShouldShowTimer(!b)
    ), [shouldChangePage])

	return <div className="App">
        { shouldShowTimer ? <CountDownPage/> : <FigmataPage/> }
	</div>
}

export default App
