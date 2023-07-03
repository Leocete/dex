import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import Wallet from './Wallet';
import NewOrder from './NewOrder';
import AllOrders from './AllOrders';
import MyOrders from './MyOrders';
import AllTrades from './AllTrades';

import { SIDE } from '../utils/constants';

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
  const [orders, setOrders] = useState({
    buy: [],
    sell: [],
  });
  const [trades, setTrades] = useState([]);
  const [eventListener, setEventListener] = useState();

  useEffect(() => {
    const getTokenInfo = async () => {
      const tokenList = await contracts.dex.methods.getTokens().call();
      const tokensWithTicker = tokenList.map((token) => ({
        ...token,
        ticker: web3.utils.hexToUtf8(token.ticker),
      }));
      const defaultToken = tokensWithTicker[0];
      const [balances, orders] = await Promise.all([
        getBalances(accounts[0], defaultToken),
        getOrders(defaultToken),
      ]);

      listenToTrades(defaultToken);
      setOrders(orders);
      setTokens(tokensWithTicker);
      setUser({
        accounts,
        balances,
        selectedToken: defaultToken,
      });
    };

    getTokenInfo();
    // eslint-disable-next-line
  }, []);

  useEffect(
    () => {
      const init = async () => {
        const [balances, orders] = await Promise.all([
          getBalances(accounts[0], user.selectedToken),
          getOrders(user.selectedToken),
        ]);

        listenToTrades(user.selectedToken);
        setOrders(orders);
        setUser({ ...user, balances });
      };

      if (!!user.selectedToken) {
        init();
      }
    },
    [user.selectedToken],
    // Unsubscribe from token trade events if user changed the token
    () => {
      eventListener.unsubscribe();
    }
  );

  const listenToTrades = (token) => {
    const tradeIds = new Set();
    // Refresh trades, to prevent storing trades from different tokens
    setTrades([]);
    const listener = contracts.dex.events
      .NewTrade({
        filter: { ticker: web3.utils.fromAscii(token.ticker) },
        fromBlock: 0,
      })
      .on('data', (newTrade) => {
        if (tradeIds.has(newTrade.returnValues.tradeId)) return;
        tradeIds.add(newTrade.returnValues.tradeId);
        setTrades((trades) => [...trades, newTrade.returnValues]);
      });
    setEventListener(listener);
  };

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

  const getOrders = async (token) => {
    const [buy, sell] = await Promise.all([
      contracts.dex.methods
        .getOrders(web3.utils.fromAscii(token.ticker), SIDE.BUY)
        .call(),
      contracts.dex.methods
        .getOrders(web3.utils.fromAscii(token.ticker), SIDE.SELL)
        .call(),
    ]);

    return { buy, sell };
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

  const createMarketOrder = async (amount, side) => {
    await contracts.dex.methods
      .createMarketOrder(
        web3.utils.fromAscii(user.selectedToken.ticker),
        amount,
        side
      )
      .send({ from: user.accounts[0] });

    const orders = await getOrders(user.selectedToken);
    setOrders(orders);
  };

  const createLimitOrder = async (amount, price, side) => {
    await contracts.dex.methods
      .createLimitOrder(
        web3.utils.fromAscii(user.selectedToken.ticker),
        amount,
        price,
        side
      )
      .send({ from: user.accounts[0] });

    const orders = await getOrders(user.selectedToken);
    setOrders(orders);
  };

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
            {user.selectedToken.ticker !== 'DAI' ? (
              <NewOrder
                createMarketOrder={createMarketOrder}
                createLimitOrder={createLimitOrder}
              />
            ) : null}
          </div>
          {user.selectedToken.ticker !== 'DAI' ? (
            <div className="col-sm-8">
              <AllTrades trades={trades} />
              <AllOrders orders={orders} />
              <MyOrders
                orders={{
                  buy: orders.buy.filter(
                    (order) =>
                      order.trader.toLowerCase() ===
                      user.accounts[0].toLowerCase()
                  ),
                  sell: orders.sell.filter(
                    (order) =>
                      order.trader.toLowerCase() ===
                      user.accounts[0].toLowerCase()
                  ),
                }}
              />
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  ) : (
    <div>Loading...</div>
  );
}

export default Dex;
