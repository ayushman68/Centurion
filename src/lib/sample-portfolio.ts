export const sampleHoldings = [
  { name: "Atlas Technology", symbol: "ATLS", quantity: 100, price: 200, cost: 180, volatility: 0.025, color: "#244b43" },
  { name: "Harbor Healthcare", symbol: "HBR", quantity: 200, price: 100, cost: 95, volatility: 0.018, color: "#7a8e72" },
  { name: "Summit Industrials", symbol: "SUM", quantity: 100, price: 150, cost: 140, volatility: 0.022, color: "#bda56e" },
  { name: "Cedar Consumer", symbol: "CDR", quantity: 300, price: 100, cost: 105, volatility: 0.02, color: "#5e7e8a" },
];
export const sampleCash = 15000;
export const sampleMoney = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
