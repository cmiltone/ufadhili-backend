import axios from "axios";
import { EXCHANGE_RATES_API_KEY, EXCHANGE_RATES_API_URL } from "../config/exchangeRates";

export const getRandomEmail = (domain = 'ufadhili.net', length = 6): string => {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text + domain;
}

export const convertCurrency = async ({ amount, from, to, }: { amount: number; from: string; to: string }): Promise<number> => {
  const url = `${EXCHANGE_RATES_API_URL}/latest?access_key=${EXCHANGE_RATES_API_KEY}&symbols=${from},${to}&amount=${amount}`;

  try {
    const res = await axios.get(url);

    const rates = res.data.rates;

    const converted = (rates[to] * amount) / rates[from];

    return converted;
  } catch (err) {
    console.log('error converting: ', err);

    return -1;
  }
}