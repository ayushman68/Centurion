"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="center-state">
      <h1>We couldn’t load this page.</h1>
      <p>
        Please try again. If the problem persists, contact your workspace
        operator.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
