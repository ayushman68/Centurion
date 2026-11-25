import Link from "next/link";
import { Brand } from "@/components/brand";
import { PublicDemo } from "@/components/public-demo";
export const metadata = { title: "Explore the demo", description: "Explore a fictional portfolio and interactive market scenarios without signing in.", alternates: { canonical: "/demo" } };
export default function DemoPage() {
  return <div className="landing"><header className="public-header"><Link href="/" aria-label="Centurion home"><Brand /></Link><Link href="/login" className="button secondary">Sign in</Link></header><main id="main"><PublicDemo /></main><footer className="public-footer"><Link href="/" className="text-link">Back to Centurion</Link><span>Paper trading only. No real money moves.</span></footer></div>;
}
