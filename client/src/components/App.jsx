import { getWeb3, getContracts } from '../utils';
import React, { useState, useEffect } from 'react';
import Footer from './Footer';

function Loading() {
  return <div>Loading...</div>;
}

function Dex() {
  return (
    <div id="app">
      <div>Header</div>
      <div>Main part</div>
      <Footer />
    </div>
  );
}

function App() {
  const [web3, setWeb3] = useState();
  const [accounts, setAccounts] = useState([]);
  const [contracts, setContracts] = useState();

  useEffect(() => {
    const init = async () => {
      const web3 = await getWeb3();
      const contracts = await getContracts(web3);
      const accounts = await web3.eth.getAccounts();
      setWeb3(web3);
      setContracts(contracts);
      setAccounts(accounts);
    };
    init();
    // eslint-disable-next-line
  }, []);

  const isReady = () => {
    return (
      typeof web3 !== 'undefined' &&
      typeof contracts !== 'undefined' &&
      accounts.length > 0
    );
  };

  if (!isReady()) {
    return <Loading />;
  }

  return <Dex web3={web3} accounts={accounts} contracts={contracts} />;
}

export default App;
