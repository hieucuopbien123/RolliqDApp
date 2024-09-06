import { Decimal } from "../../../lib/@rolliq/lib-base";

const hasProp = (o, p) => p in o;

const validateCoinGeckoSimplePriceResponse = (
  expectedCoinIds,
  expectedCurrencies,
  body
) => {
  if (typeof body !== "object" || body === null) {
    throw new Error(`unexpected response from CoinGecko`);
  }

  for (const coinId of expectedCoinIds) {
    if (!hasProp(body, coinId)) {
      throw new Error(`coin "${coinId}" missing from CoinGecko response`);
    }

    const coinPrices = body[coinId];

    for (const currency of expectedCurrencies) {
      if (!hasProp(coinPrices, currency)) {
        throw new Error(
          `currency "${currency}" missing from CoinGecko response`
        );
      }

      if (typeof coinPrices[currency] !== "number") {
        throw new Error(
          `price of coin "${coinId}" in currency "${currency}" is not a number`
        );
      }
    }
  }

  return body;
};

const fetchCoinGeckoSimplePrice = async (coinIds, vsCurrencies) => {
  const simplePriceUrl =
    "https://api.coingecko.com/api/v3/simple/price?" +
    new URLSearchParams({
      ids: coinIds.join(","),
      vs_currencies: vsCurrencies.join(","),
    });

  const response = await window.fetch(simplePriceUrl, {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `couldn't fetch price from CoinGecko: got status ${response.status}`
    );
  }

  return validateCoinGeckoSimplePriceResponse(
    coinIds,
    vsCurrencies,
    await response.json()
  );
};

export const fetchRiqPrice = async () => {
  const response = await fetchCoinGeckoSimplePrice(["rolliq"], ["usd"]);

  return {
    riqPriceUSD: Decimal.from(response.rolliq.usd),
  };
};
