import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import Wallet from './Wallet';

function Dex({ web3, accounts, contracts }) {
  const [tokens, setTokens] = useState([]);
  const [user, setUser] = useState({
    accounts: [],
    balances: {
      tokenDex: 0,
      tokenWallet: 0,
    },
    selectedToken: undefined,
  });

  const selectToken = (token) => {
    setUser({
      ...user,
      selectedToken: token,
    });
  };

  const getBalances = async (account, token) => {
    const tokenDex = await contracts.dex.methods
      .traderBalances(account, web3.utils.fromAscii(token.ticker))
      .call();
    const tokenWallet = await contracts[token.ticker].methods
      .balanceOf(account)
      .call();

    return { tokenDex, tokenWallet };
  };

  const deposit = async (amount) => {
    await contracts[user.selectedToken.ticker].methods
      .approve(contracts.dex.options.address, amount)
      .send({ from: user.accounts[0] });

    await contracts.dex.methods
      .deposit(amount, web3.utils.fromAscii(user.selectedToken.ticker))
      .send({ from: user.accounts[0] });

    const balances = await getBalances(user.accounts[0], user.selectedToken);

    setUser((user) => ({
      ...user,
      balances,
    }));
  };

  const withdraw = async (amount) => {
    await contracts.dex.methods
      .withdraw(amount, web3.utils.fromAscii(user.selectedToken.ticker))
      .send({ from: user.accounts[0] });

    const balances = await getBalances(user.accounts[0], user.selectedToken);

    setUser((user) => ({
      ...user,
      balances,
    }));
  };

  useEffect(() => {
    const getTokenInfo = async () => {
      const tokenList = await contracts.dex.methods.getTokens().call();
      const tokensWithTicker = tokenList.map((token) => ({
        ...token,
        ticker: web3.utils.hexToUtf8(token.ticker),
      }));

      const balances = await getBalances(accounts[0], tokensWithTicker[0]);
      setTokens(tokensWithTicker);
      setUser({
        accounts,
        balances,
        selectedToken: tokensWithTicker[0],
      });
    };

    getTokenInfo();
    // eslint-disable-next-line
  }, []);

  return !!user?.selectedToken ? (
    <div id="app">
      <Header
        user={user}
        contracts={contracts}
        tokens={tokens}
        selectToken={selectToken}
      />
      <main className="container-fluid">
        <div className="row">
          <div className="col-sm-4 first-col">
            <Wallet user={user} deposit={deposit} withdraw={withdraw} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  ) : (
    <div>Loading...</div>
  );
}

export default Dex;
