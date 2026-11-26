import Link from "next/link";
import { sampleHoldings, sampleCash, sampleMoney } from "@/lib/sample-portfolio";
import { calculateRisk } from "@/lib/risk";
import { PublicDemo } from "@/components/public-demo";
import {
  ArrowUpRight,
  ArrowRight,
  Activity,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "@/components/brand";
export const metadata = { alternates: { canonical: "/" } };
export default function Home() {
  const sample = calculateRisk(sampleHoldings, sampleCash);
  return (
    <div className="landing premium-home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Centurion",
            url: process.env.BETTER_AUTH_URL || "http://localhost:3000",
            description:
              "A portfolio risk analysis and paper trading workspace.",
          }).replace(/</g, "\\u003c"),
        }}
      />
      <header className="public-header">
        <Link href="/" aria-label="Centurion home">
          <Brand />
        </Link>
        <nav className="public-nav" aria-label="Main navigation"><a href="#demo" className="text-link">Sample portfolio</a><Link href="/login" className="button secondary">
          Sign in <ArrowUpRight size={16} />
        </Link></nav>
      </header>
      <main id="main">
        <section className="hero">
          <div>
            <span className="eyebrow">PORTFOLIO INTELLIGENCE, IN PERSPECTIVE</span>
            <h1>
              A clearer view.
              <br />
              <em>A considered next move.</em>
            </h1>
            <p>
              See where your portfolio stands. Explore its exposures, test your assumptions, and make your next paper trade with context.
            </p>
            <div className="hero-actions">
              <Link href="#demo" className="button">
                Explore the demo <ArrowRight size={17} />
              </Link>
              <a href="#approach" className="text-link">
                Explore the approach ↓
              </a>
            </div>
            <span className="fine-print">
              Paper trading only. No brokerage connection or real-money
              execution.
            </span>
          </div>
          <aside className="portfolio-preview" aria-label="Sample portfolio overview">
            <div className="preview-top"><span>THE CENTURION SAMPLE</span><span className="preview-badge">Fictional data</span></div>
            <div className="preview-value"><span>Total portfolio value</span><strong>{sampleMoney(sample.nav)}</strong><p>USD · {sampleHoldings.length} holdings + cash</p></div>
            <div className="preview-allocation" aria-hidden="true">{sampleHoldings.map(h => <span key={h.symbol} style={{flex: h.quantity * h.price, background: h.color}} />)}<span style={{flex: sampleCash, background:"#d5c6a3"}} /></div>
            <div className="preview-rows">{sampleHoldings.map(h => <div key={h.symbol}><span>{h.name}</span><strong>{sampleMoney(h.quantity * h.price)}</strong><small>{h.quantity * h.price / sample.nav * 100}%</small></div>)}<div><span>Cash reserve</span><strong>{sampleMoney(sampleCash)}</strong><small>15%</small></div></div>
            <a href="#demo" className="preview-link">Explore this portfolio <ArrowRight size={16} /></a>
            <p className="preview-note">Illustrative holdings. No live market prices.</p>
          </aside>
        </section>
        <PublicDemo />
        <section id="approach" className="approach">
          <div className="section-intro">
            <span className="eyebrow">ONE WORKSPACE. A CLEARER VIEW.</span>
            <h2>Built around the decisions that matter.</h2>
          </div>
          <div className="feature-grid">
            {[
              {
                Icon: Layers,
                n: "01",
                title: "See the whole portfolio",
                text: "Keep positions, cash, and manually marked prices together. Every figure has a clear source.",
              },
              {
                Icon: Activity,
                n: "02",
                title: "Put downside in context",
                text: "Explore Gaussian risk estimates and transparent price-shock scenarios before changing exposure.",
              },
              {
                Icon: ShieldCheck,
                n: "03",
                title: "Act with accountability",
                text: "Record paper reductions atomically, control team access, and review an append-only event history.",
              },
            ].map(({ Icon, n, title, text }) => (
              <article key={n}>
                <div>
                  <Icon size={26} />
                  <span>{n}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className="public-footer">
        <Brand />
        <span>
          Designed for deliberate decisions. No regulatory certification is
          claimed.
        </span>
      </footer>
    </div>
  );
}
