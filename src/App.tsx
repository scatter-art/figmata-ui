import './style-dictionary/tokens/_STYLE_TOKENS_.css'
import './style/typography.css'
import './App.css'
import { FigmataPage } from './components/FigmataPage'
import { CountDownPage } from './components/CountDownPage'

function App() {
	return (
		<div className="App">
			{/* <FigmataPage /> */}
			<CountDownPage />
		</div>
	)
}

export default App
