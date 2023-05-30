import './style-dictionary/tokens/_STYLE_TOKENS_.css'
import './style/typography.css'
import './App.css'
import { Header } from './components/Header'
import { AuctionGallery } from './components/AuctionGallery'
import { SidePanel } from './components/SidePanel'
import { Footer } from './components/Footer'

function App() {
	return (
		<div className="App">
			<div id="motif-border"></div>

			<main>
				<Header />
				<div className="body">
					<AuctionGallery />
					<Footer />
				</div>
			</main>

			<SidePanel imageUrl="https://pbs.twimg.com/media/FwlGNPPXoAYtMhb?format=png" />
		</div>
	)
}

export default App
