# Verification

Verified locally on 5 November 2026 with Node 24.20.0, PostgreSQL 18.6, and Chromium (Playwright). No production deployment, live market data, broker integration, compliance certification, performance SLA, or production-readiness certification is claimed.

| Check | Result |
| --- | --- |
| ESLint | Pass |
| TypeScript strict type check | Pass |
| Unit tests | 6 passed: risk factors, covariance, cash-only risk, NAV preservation, validation |
| PostgreSQL migration | Applied successfully to a real local PostgreSQL database |
| Production build | Pass; static public pages and dynamic authenticated/API routes |
| Production dependency audit | 0 known vulnerabilities reported by npm audit --omit=dev |
| End-to-end journey | Pass against the local development server and real PostgreSQL |
| Automated accessibility | No axe violations for tested desktop and 390px mobile overview using WCAG 2 A/AA, 2.1 AA and 2.2 AA tags |
| Visual inspection | Desktop and mobile overview screenshots inspected |
| Keyboard | Dialog initial input focus and Escape dismissal verified; scrollable tables made keyboard-focusable |
| Mobile layout | No document-level horizontal overflow at 390px; wide data tables scroll within their region |
| Health endpoint | HTTP 200 with database reachable |

The browser journey exercises signup, sample portfolio creation, persisted NAV, simultaneous duplicate paper sells (one order, one balance update), conflicting idempotency keys, oversized orders with unchanged balances, negative input rejection, foreign-origin rejection, unauthenticated access, cross-user access denial, viewer permissions, granting and revoking access, adding a position, a UI paper sale, scenario controls, activity history, and logout session invalidation. Repeated test runs also exercised the authentication throttle and received 429 after the configured signup limit.

Found and fixed during verification: table/footer text contrast, keyboard access to scrolling tables, dialog input focus, and loading-state/lint issues. Test selectors were scoped to dialogs and specific status messages to avoid matching background controls or loading indicators.

## Limits and release gates

- Browser tests were run locally; CI is configured but its final remote result is not asserted here.
- No deployed HTTPS environment, production restore drill, load test, real-user Core Web Vitals, screen-reader audit, full browser matrix, or independent security/model review has been completed.
- Automated accessibility checks cover representative screens and cannot establish complete WCAG conformance.
- No email verification/recovery delivery, MFA, SSO, market feed, broker, or monitoring-provider credentials are configured. Integrations are not represented as live.
- The runtime dependency audit was clean. Development-only dependency advisories may remain; inspect npm audit before updating the tooling.
- A strict nonce-based CSP, automated account recovery, and stronger customer-onboarding controls remain production hardening tasks.
- Real capital must not be connected to this illustrative model without a separately reviewed execution and risk-control system.
