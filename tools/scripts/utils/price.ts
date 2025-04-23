import { readFileSync, writeFileSync } from 'fs';

export const getPrices = async (isoDate: string) => {
  const date = isoToDate(isoDate);
  const btcPrice = await addPrice('bitcoin', date.date);
  const stxPrice = await addPrice('blockstack', date.date);
  return { btcPrice, stxPrice };
};

const prices: {
  [key: string]: {
    [key: string]: {
      usd: number;
      sgd: number;
    };
  };
} = {};

const isoToDate = (time: string) => {
  const year = time.substring(0, 4);
  const month = time.substring(5, 7);
  const day = time.substring(8, 10);
  const date = `${day}-${month}-${year}`;
  return { date, month, year, time };
};

const addPrice = async (token: string, date: string) => {
  console.log(date);
  if (prices[token]?.[date]) {
    return prices[token][date];
  }
  const priceFilename = `data/price/price-${token}-${date}.json`;
  try {
    const price = JSON.parse(readFileSync(priceFilename).toString());
    const priceData = {
      usd: price.market_data.current_price.usd,
      sgd: price.market_data.current_price.sgd,
      eur: price.market_data.current_price.eur,
    };
    if (!prices[token]) {
      prices[token] = {};
    }
    prices[token][date] = priceData;
    return priceData;
  } catch (e) {
    console.log(e);
    // ignore
  }

  const url = `https://api.coingecko.com/api/v3/coins/${token}/history?localization=false&date=${date}&x_cg_demo_api_key=${process.env.COINGECKO_DEMO_API_KEY}`;
  console.log(url);
  const response = await fetch(url, {
    credentials: 'include',
    method: 'GET',
    mode: 'cors',
  });
  const price = await response.json();

  try {
    const priceData = {
      usd: price.market_data.current_price.usd,
      sgd: price.market_data.current_price.sgd,
      eur: price.market_data.current_price.eur,
    };
    if (!prices[token]) {
      prices[token] = {};
    }
    prices[token][date] = priceData;
    writeFileSync(priceFilename, JSON.stringify({ market_data: { current_price: priceData } }));
    return priceData;
  } catch (e) {
    console.log(price, priceFilename);
    throw e;
  }
};
