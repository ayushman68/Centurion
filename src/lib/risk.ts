export interface RiskHolding {quantity:string|number;price:string|number;cost:string|number;volatility:string|number}
/** Illustrative, zero-mean Gaussian model. Constant pairwise correlation is an assumption, not measured market data. */
export function calculateRisk(holdings:RiskHolding[],cash:number,shock=-0.1) {
  const exposures=holdings.map(h=>Number(h.quantity)*Number(h.price));
  const sigmas=holdings.map((h,i)=>exposures[i]*Number(h.volatility));
  const invested=exposures.reduce((a,b)=>a+b,0);
  const nav=cash+invested;
  const variance=sigmas.reduce((sum,a,i)=>sum+sigmas.reduce((s,b,j)=>s+a*b*(i===j?1:0.35),0),0);
  const dailySigma=Math.sqrt(Math.max(0,variance));
  const var99=2.326347874*dailySigma;
  const es975=2.337802792*dailySigma;
  return {nav,invested,cash,var99,es975,varPercent:nav>0?var99/nav:0,pnl:holdings.reduce((s,h)=>s+(Number(h.price)-Number(h.cost))*Number(h.quantity),0),shockLoss:invested*shock,concentration:invested?Math.max(0,...exposures)/invested:0};
}
