import './App.css';
import { DappConnector } from './components/DappConnector';
import { UserAddress } from './components/UserAddress';

function App() {
  return (
    <div className="App">
        <DappConnector />
        <br/>
        <UserAddress />
    </div>
  );
}

export default App;
