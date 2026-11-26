import { PublicHeader, PublicFooter } from "@/components/public-header";
import { PublicDemo } from "@/components/public-demo";
import "../public-site.css";
export const metadata = { title: "Explore the demo", description: "Explore a fictional portfolio and interactive market scenarios without signing in.", alternates: { canonical: "/demo" } };
export default function DemoPage() {
  return <div className="landing institutional-site"><PublicHeader /><main id="main"><div className="demo-page-title"><span className="institutional-eyebrow">CENTURION / PUBLIC WORKSPACE</span><h1>Explore the Sample Portfolio</h1><p>Your first look at portfolio exposure. No account required.</p></div><PublicDemo /></main><PublicFooter /></div>;
}
