import Link from "next/link";
import { ChevronDown, ArrowUpRight, Menu } from "lucide-react";
import { Brand } from "./brand";
import { PublicNavMenu } from "./public-nav-menu";

export function PublicHeader() {
  return <header className="institutional-header">
    <div className="utility-bar"><div><Link href="/#getting-started">For Individuals</Link><Link href="/#account-structure">For Teams</Link></div><div><Link href="/demo">FREE DEMO</Link><Link href="/#resources">Support Resources</Link></div></div>
    <div className="institutional-nav">
      <Link href="/" aria-label="Centurion home"><Brand /></Link>
      <nav className="desktop-links" aria-label="Main navigation">
        <Link href="/#getting-started">Why Centurion</Link>
        <PublicNavMenu className="nav-dropdown" label={<>Platform <ChevronDown size={13} /></>}><div><Link href="/demo">Sample portfolio</Link><Link href="/#methodology">Risk methodology</Link><Link href="/#account-structure">Account structure</Link></div></PublicNavMenu>
        <Link href="/#security">Security</Link><Link href="/#resources">Resources</Link>
      </nav>
      <div className="header-actions"><Link href="/login" className="button secondary">Sign in</Link><Link href="/login?mode=register" className="button">Open account <ArrowUpRight size={14} /></Link></div>
      <PublicNavMenu className="mobile-menu" label={<><Menu size={20} /> Menu</>}><nav aria-label="Mobile navigation"><Link href="/#getting-started">Getting started</Link><Link href="/demo">Sample portfolio</Link><Link href="/#account-structure">Account structure</Link><Link href="/#security">Security</Link><Link href="/#resources">Resources</Link><Link href="/login?mode=register">Open account</Link></nav></PublicNavMenu>
    </div>
  </header>;
}

export function PublicFooter() {
  return <footer className="institutional-footer">
    <div className="footer-columns"><div><Brand /><p>A focused environment for portfolio research and simulated trading.</p></div>
    <nav aria-label="Account links"><h2>Account</h2><Link href="/login">Sign in</Link><Link href="/login?mode=register">Open account</Link><Link href="/demo">Explore the sample</Link></nav>
    <nav aria-label="Platform links"><h2>Platform</h2><Link href="/#account-structure">Portfolio structure</Link><Link href="/#methodology">Risk methodology</Link><Link href="/#security">Access controls</Link></nav>
    <nav aria-label="Resource links"><h2>Resources</h2><Link href="/#getting-started">Getting started</Link><Link href="/#resources">Frequently asked questions</Link><a href="https://github.com/ayushman68/Centurion">Project repository</a></nav></div>
    <div className="site-disclosure"><p>Centurion is a research and paper-trading workspace. It does not provide brokerage, custody, investment advice, or real-money execution. Sample companies and prices are fictional. Risk calculations use simplifying assumptions and do not predict or limit actual losses.</p><span>© Centurion · Portfolio intelligence</span><a href="#main">Back to top ↑</a></div>
  </footer>;
}
