// Fetch exchange rates and convert amounts
export async function fetchExchangeRates(baseCurrency = 'USD') {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
    const data = await res.json();
    return data.rates;
  } catch (err) {
    console.error("Failed to fetch exchange rates", err);
    return {};
  }
}

export function convertToBase(amount, fromCurrency, rates) {
  if (!rates[fromCurrency]) return amount;
  return Number(amount) / rates[fromCurrency];
}