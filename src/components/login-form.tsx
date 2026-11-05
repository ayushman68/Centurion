"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Brand } from "./brand";
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [register, setRegister] = useState(params.get("mode") === "register");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData(e.currentTarget);
    try {
      const credentials = {
        email: String(data.get("email")),
        password: String(data.get("password")),
      };
      const result = register
        ? await authClient.signUp.email({
            ...credentials,
            name: String(data.get("name")),
          })
        : await authClient.signIn.email(credentials);
      if (result.error)
        throw new Error(result.error.message || "Unable to sign in.");
      router.push("/workspace");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to connect. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" className="auth-layout">
      <div className="auth-story">
        <Link href="/">
          <Brand />
        </Link>
        <div>
          <span className="eyebrow">A MORE CONSIDERED PERSPECTIVE</span>
          <h1>
            Confidence starts
            <br />
            with clarity.
          </h1>
          <p>
            Your portfolio. Your assumptions.
            <br />
            Every decision, accounted for.
          </p>
        </div>
        <span className="auth-note">
          <ShieldCheck size={18} /> Private workspaces · Controlled access ·
          Paper execution
        </span>
      </div>
      <div className="auth-panel">
        <div className="auth-card">
          <span className="eyebrow">WELCOME TO CENTURION</span>
          <h2>
            {register ? "Create your workspace" : "Good to see you again."}
          </h2>
          <p>
            {register
              ? "Start with an empty portfolio or an explicitly labelled sample."
              : "Sign in to put your portfolio in perspective."}
          </p>
          <form onSubmit={submit}>
            {register && (
              <label>
                Full name
                <input
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={80}
                />
              </label>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                required
                minLength={register ? 12 : 1}
                maxLength={128}
              />
            </label>
            {register && (
              <small>
                Use at least 12 characters. Email verification and password
                recovery are not enabled in this release.
              </small>
            )}
            {error && (
              <div role="alert" className="notice error">
                {error}
              </div>
            )}
            <button className="button full" disabled={busy}>
              {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
              <ArrowRight size={16} />
            </button>
          </form>
          <p className="auth-toggle">
            {register ? "Already have an account?" : "New to Centurion?"}{" "}
            <button
              className="text-link"
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Sign in" : "Create an account"}
            </button>
          </p>
          <p className="fine-print">
            A research and paper-trading workspace. No real money moves.
          </p>
        </div>
      </div>
    </main>
  );
}
