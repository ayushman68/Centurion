# Centurion

A portfolio-risk workspace with a responsive interface, PostgreSQL persistence, authenticated portfolio access, scenario analysis, and transactional **paper sales**. No broker is connected and no real trades execute. Sample portfolios and manual prices are explicitly labelled. No Basel, FRTB, SOC 2, investment-performance, or production-certification claims are made.

## Stack and architecture

Next.js App Router, TypeScript, Tailwind CSS with shared design tokens, PostgreSQL, node-postgres, Zod, Decimal.js, and Better Auth. One application handles rendering and APIs; no separate Python server, Redis, queue, or cloud storage is needed for this workload. Database migrations are plain SQL and are checksummed and advisory-locked. Core modules are in `src/lib`; the UI is in `src/components`; route handlers live in `src/app/api`.

The previous implementation is preserved in Git history. This replacement does not migrate prior Azure SQL data automatically. Do not point it at an existing production database without a separately reviewed data migration.

## Local setup

Requires Node.js 22+ (24 tested), npm, and PostgreSQL 18 (or the included local development helper).

```sh
npm ci
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Paste the generated value into BETTER_AUTH_SECRET in .env.
npm run db:local
# Keep that terminal running. In another terminal:
npm run db:migrate
npm run dev
```

On Windows use `Copy-Item .env.example .env`. Open http://localhost:3000, create an account with a password of at least 12 characters, then create a portfolio. Select sample data to explore a populated workspace, or use paper cash and add positions. No default account or password is seeded. The development database helper listens only on 127.0.0.1:54329 and uses the explicitly non-production password in `.env.example`; never expose it publicly. Stop it with Ctrl+C. PostgreSQL data persists in ignored `.local-db/`.

Alternatively run PostgreSQL yourself or use `docker compose up -d db` with POSTGRES_PASSWORD set and update DATABASE_URL. Production must use separately generated credentials, TLS, restricted network access, and a dedicated application database role.

## Environment

| Variable | Purpose |
| --- | --- |
| DATABASE_URL | Server-only PostgreSQL connection string; set appropriate verified TLS options in production |
| BETTER_AUTH_URL | Exact canonical application origin; HTTPS in production |
| BETTER_AUTH_SECRET | High-entropy server-only secret, at least 32 characters |
| TRUSTED_IP_HEADER | Optional header overwritten by your trusted ingress; empty uses a shared conservative authentication rate limit |

Never commit `.env`, database files, credentials, or tokens. No secret is sent to the browser.

## Working journeys

- Sign up, sign in, sign out; database-backed sessions and authentication throttling.
- Create personal portfolios with cash or clearly labelled sample data.
- Add positions from paper cash; update manual prices and daily volatility assumptions.
- View allocation, NAV, unrealized P&L, Gaussian VaR and expected shortfall.
- Explore uniform price-shock scenarios without changing saved holdings.
- Execute paper sales using decimal arithmetic, a locked portfolio, idempotency keys, and an atomic cash/position/order/audit transaction.
- Browse paginated order and activity records; filter positions by symbol; export a JSON report.
- Owners grant or remove manager/viewer access to existing accounts. Managers edit/execute; viewers only read/export. Every API checks membership server-side. The owner cannot be demoted.
- Adjust risk thresholds. Breaches are informational; they do not trigger autonomous trades.

## Data and model

Schema: users, sessions, accounts, verification records, authentication rate limits, portfolios, members, holdings, orders, audit_events, and request_limits. Foreign keys, unique symbols, positive-value checks, role constraints, idempotency uniqueness, and access/history indexes enforce invariants. Audit rows reject UPDATE and DELETE via a trigger. This is not tamper-proof against a database administrator; regulated archival/WORM retention is outside scope.

Risk uses signed-dollar exposures for supported long-only positions, user-entered daily volatility, zero drift, and a fixed **assumed** pairwise correlation of 0.35. Portfolio variance is `sum(exposure_i * vol_i * exposure_j * vol_j * correlation_ij)`. One-day 99% VaR uses 2.326347874 sigma; one-day 97.5% expected shortfall uses 2.337802792 sigma. Cash has zero market volatility. The former application mislabeled a 99% ES factor as 97.5%; this implementation corrects that.

The model does not estimate correlations from history, backtest, model options, support short positions, or account for fat tails, liquidity, fees, slippage, or FX. It is an illustrative research model, not a basis for claiming regulatory compliance. Manual price marks show dates; updating them does not fetch live data. Paper orders use the current server mark at execution, not a guaranteed quoted price.

## Security and operations

Parameterized SQL; strict server schemas; bounded financial values and lists; origin checks on application writes; Better Auth origin/session protections; server-side membership checks; database-backed write throttles; no public caching of private APIs; noindex for private pages. No upload or payment surface exists. Public self-registration gives access only to the new account’s portfolios. Email delivery, verification, password recovery, MFA and enterprise SSO are **not configured**; add them before onboarding real customers. Membership grants require an existing account.

Authenticated application writes allow 60 requests per user per minute. Authentication has tighter limits. Configure a trusted proxy to overwrite its IP header and deny direct origin access before enabling TRUSTED_IP_HEADER. Without it authentication uses a shared conservative bucket. Daily maintenance should delete old `request_limits` buckets, expired sessions/verification records, and stale `rateLimit` rows according to your retention policy; never delete audit history casually.

`GET /api/health` checks PostgreSQL and returns 503 on failure without connection details. JSON logs contain request IDs, method, path, status, duration, and sanitized error types, not bodies or secrets. Ingest these logs into your monitoring provider. Alert on health failures, rising 5xx, latency, DB saturation, and backup failures. Monitoring provider credentials are not configured. Add provider instrumentation in `src/lib/http.ts` without logging session cookies or financial payloads.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
# With a running test database, migrated schema and server:
npx playwright install chromium
npm run test:e2e
```

Use a dedicated database for E2E tests: they create uniquely named users and portfolios. Playwright covers account creation, sample portfolios, paper orders, duplicate concurrent requests, authorization, CSRF rejection, invalid/oversized orders, persistence, member access/revocation, UI actions, modal keyboard focus, mobile overflow, and axe accessibility checks. CI runs the checks against PostgreSQL. Actual local verification results and limitations are in `docs/VERIFICATION.md`.

## Deployment, backups and rollback

Deploy as a Node.js application behind an HTTPS reverse proxy (a managed Node host or container host). Do not statically export. Provision PostgreSQL privately, use a separate migration role, and grant the runtime role only required table/sequence rights. The runtime role must not be database owner or superuser. Terminate TLS at ingress, redirect HTTP to HTTPS, preserve secure cookies, restrict origin access, configure health checks, and supply secrets via the host’s secret store. Security headers include HSTS in production, nosniff, frame denial, referrer policy and permissions policy. A strict nonce-based CSP is a future hardening task; do not claim it is configured.

Release: back up the database; `npm ci`; run validation; execute migrations once using a migration role (`npx tsx scripts/migrate.ts` with environment variables injected); `npm run build`; deploy and `npm start`. Run authenticated smoke tests, health checks and backup verification before routing users. No paid resources or public deployment are created by this repository.

Backups: enable managed point-in-time recovery with retention appropriate to your needs, plus encrypted daily `pg_dump -Fc` snapshots in separate storage. Restrict backup access. Restore quarterly into an isolated database using `pg_restore --no-owner --no-acl`, run migrations/checks, verify row counts, portfolio balances and audit continuity, and record recovery time. Pick and document RPO/RTO with the operator; none is claimed here.

Rollback: retain the previous built artifact and schema version. Roll back the app only when its schema remains compatible. Use additive forward migrations; never edit applied SQL. For incompatible schema changes, restore to a new DB at a known recovery point, validate it, and switch connection configuration during a controlled maintenance window. Never drop current data as an automatic rollback.

Before real-money use, integrate a supported broker sandbox and market-data feed, perform independent model validation, add quote freshness and execution controls, test reconciling broker positions, obtain applicable review, and conduct a security assessment. This release intentionally executes paper transactions only.
