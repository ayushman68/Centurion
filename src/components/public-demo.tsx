"use client";
import { useState } from "react";
import Link from "next/link";
import { calculateRisk } from "@/lib/risk";

import { sampleHoldings as holdings, sampleCash as cash, sampleMoney as money } from "@/lib/sample-portfolio";

export function PublicDemo() {
  const [shock, setShock] = useState(-10);
  const risk = calculateRisk(holdings, cash, shock / 100);
  return (
    <section id="demo" className="public-demo" aria-labelledby="demo-title">
      <div className="demo-intro">
        <span className="eyebrow">EXPLORE WITHOUT AN ACCOUNT</span>
        <h2 id="demo-title">Your first look inside Centurion.</h2>
        <p>A complete view, before you commit. Inspect the holdings and stress-test a fictional portfolio—no account required.</p>
        <span className="pill">SAMPLE DATA · NOT LIVE PRICES</span>
      </div>
      <div className="metric-grid">
        <article className="metric"><span>SAMPLE PORTFOLIO VALUE</span><strong>{money(risk.nav)}</strong><small>Holdings plus cash · USD</small></article>
        <article className="metric"><span>INVESTED</span><strong>{money(risk.invested)}</strong><small>Four fictional companies</small></article>
        <article className="metric"><span>CASH RESERVE</span><strong>{money(cash)}</strong><small>15% of portfolio value</small></article>
        <article className="metric"><span>ILLUSTRATIVE DAILY VaR · 99%</span><strong>{money(risk.var99)}</strong><small>Model estimate, not a loss limit</small></article>
      </div>
      <div className="scenario-grid">
        <section className="panel" aria-labelledby="demo-holdings">
          <div className="panel-heading"><h3 id="demo-holdings">What the sample holds</h3><span className="pill">USD</span></div>
          <div className="demo-allocation" role="img" aria-label="Allocation: Atlas 20%, Harbor 20%, Summit 15%, Cedar 30%, cash 15%">
            {holdings.map(h => <span key={h.symbol} style={{ width: (h.quantity * h.price / risk.nav * 100) + "%", background: h.color }} />)}
            <span style={{ width: "15%", background: "#e0e5e1" }} />
          </div>
          <div className="table-scroll" tabIndex={0} role="region" aria-label="Sample holdings table">
            <table><caption className="demo-caption">Fictional holdings and manually chosen example prices</caption><thead><tr><th scope="col">Asset</th><th scope="col" className="numeric">Shares</th><th scope="col" className="numeric">Price</th><th scope="col" className="numeric">Value</th></tr></thead>
              <tbody>{holdings.map(h => <tr key={h.symbol}><th scope="row"><span className="demo-asset"><span className="demo-monogram" aria-hidden="true">{h.symbol.slice(0,1)}</span><span>{h.name}<small>{h.symbol}</small></span></span></th><td className="numeric">{h.quantity}</td><td className="numeric">{money(h.price)}</td><td className="numeric">{money(h.quantity * h.price)}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
        <section className="panel" aria-labelledby="demo-scenario">
          <div className="panel-heading"><h3 id="demo-scenario">Try a market scenario</h3></div>
          <div className="scenario-body">
            <label htmlFor="demo-shock" className="shock-label">Price change <strong>{shock > 0 ? "+" : ""}{shock}%</strong></label>
            <input id="demo-shock" className="range" type="range" min={-50} max={20} step={1} value={shock} onChange={e => setShock(Number(e.target.value))} aria-describedby="demo-assumptions" />
            <div className="range-labels"><span>−50%</span><span>+20%</span></div>
            <div className="scenario-presets">{[-30, -10, 0, 10].map(value => <button key={value} type="button" className={"chip" + (shock === value ? " selected" : "")} aria-pressed={shock === value} onClick={() => setShock(value)}>{value > 0 ? "+" : ""}{value}%</button>)}</div>
            <div className="scenario-result" aria-live="polite" aria-atomic="true"><div><span>VALUE AFTER SCENARIO</span><strong data-testid="demo-value">{money(risk.nav + risk.shockLoss)}</strong></div><div><span>CHANGE IN VALUE</span><strong>{money(risk.shockLoss)}</strong></div></div>
            <p id="demo-assumptions" className="muted">Applies the same price change to every holding. Cash stays unchanged. This is a hypothetical calculation, not a forecast.</p>
            <button type="button" className="text-link" onClick={() => setShock(-10)}>Reset scenario</button>
          </div>
        </section>
      </div>
      <details className="demo-method"><summary>How the risk estimate works</summary><p>Daily value at risk uses a zero-mean Gaussian model, example daily volatilities of 2.5%, 1.8%, 2.2%, and 2%, and assumed pairwise correlation of 0.35. Actual losses can exceed this estimate. These fictional assets are not investment recommendations.</p></details>
      <div className="demo-cta"><div><h3>Ready to use your own numbers?</h3><p>Create an account to save portfolios, record paper trades, and manage access. Demo changes reset when you reload.</p></div><Link href="/login?mode=register" className="button">Create your workspace</Link></div>
    </section>
  );
}
