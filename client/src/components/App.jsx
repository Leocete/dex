import { getWeb3, getContracts } from '../utils';
import React, { useState, useEffect } from 'react';
import Dex from './Dex';

function Loading() {
  return <div>Loading...</div>;
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
  }, []);

  const dataIsLoaded = !!web3 && !!contracts && accounts.length;

  return dataIsLoaded ? (
    <Dex web3={web3} accounts={accounts} contracts={contracts} />
  ) : (
    <Loading />
  );
}

export default App;
