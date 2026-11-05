import Link from "next/link";
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
  return (
    <div className="landing">
      <header className="public-header">
        <Link href="/" aria-label="Centurion home">
          <Brand />
        </Link>
        <Link href="/login" className="button secondary">
          Open workspace <ArrowUpRight size={16} />
        </Link>
      </header>
      <main id="main">
        <section className="hero">
          <div>
            <span className="eyebrow">CLARITY BEFORE ACTION</span>
            <h1>
              Understand your risk.
              <br />
              <em>Own your next move.</em>
            </h1>
            <p>
              A focused workspace to understand portfolio exposure, explore
              downside scenarios, and test protective actions with a traceable
              paper ledger.
            </p>
            <div className="hero-actions">
              <Link href="/login?mode=register" className="button">
                Create your workspace <ArrowRight size={17} />
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
          <div
            className="hero-visual"
            aria-label="Illustration of portfolio exposure analysis"
          >
            <div className="visual-top">
              <span>THE BIG PICTURE</span>
              <span className="pill">ILLUSTRATIVE</span>
            </div>
            <div className="orb">
              <ShieldCheck size={65} strokeWidth={1} />
            </div>
            <div className="visual-caption">
              <span>
                Make uncertainty
                <br />
                more understandable.
              </span>
              <Activity size={30} />
            </div>
            <div className="visual-grid" />
          </div>
        </section>
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
