# Vercel + Neon deployment

Status: configuration prepared; no hosted application or database has been provisioned yet. Account connections are required before deployment can be completed. Do not mistake a successful local build for a deployed application.

Source: `rebuild/centurion-platform` in `ayushman68/Centurion`. The existing `main` branch contains the previous implementation. Deploy the rebuild branch explicitly; do not import the old frontend directory. The project root is the repository root.

## Provision and configure

Use a Vercel account and Neon account with an eligible no-charge plan. Confirm available plan/quotas before provisioning; do not enable paid upgrades, billing, or overages without authorization. Pick nearby compute regions supported by both accounts.

Create an empty PostgreSQL database, not a copy of the local development database. Local test users and example credentials must not be uploaded. Obtain the direct migration connection and a pooled application connection. Keep verified TLS enabled. Store values only in the hosting secret store or transient process environment.

Use a separate migration role and application role. The application role needs schema usage, SELECT/INSERT/UPDATE/DELETE on authentication/application tables and sequence usage, but no DDL or ownership. Audit events require SELECT/INSERT only. Keep the database owner credential out of the runtime deployment.

Run `npm run db:migrate:deploy` with `MIGRATION_DATABASE_URL` set to the direct migration-role connection. This command is deliberately separate from the Vercel build so preview deployments cannot mutate the production schema. The migration runner uses an advisory lock and verifies applied migration checksums.

Create a Vercel Next.js project from the rebuild branch using Node.js 24, root directory `.`, `npm ci`, and `npm run build`. Choose its final domain before building metadata, then configure:

- `DATABASE_URL`: pooled application-role PostgreSQL URL, server-only.
- `BETTER_AUTH_URL`: exact final HTTPS origin, without a path.
- `BETTER_AUTH_SECRET`: new high-entropy secret of at least 32 characters; never reuse the development secret.
- `TRUSTED_IP_HEADER`: leave unset initially (shared conservative auth throttle); only set after confirming ingress overwrites the selected header.

Do not set any of these as `NEXT_PUBLIC_*`. Do not add `MIGRATION_DATABASE_URL` to the runtime app. Keep Vercel preview environments isolated from the production database and use matching preview auth origins.

## Release verification

Wait for the deployment to reach Ready. Verify `/api/health` is 200, then create a test account through the HTTPS site, create a sample portfolio, record a paper sale, reload and confirm persistence, sign out, and verify protected APIs reject the signed-out request. Confirm the UI labels the environment as paper and manual/sample data. Check HTTPS, private cache headers, mobile layout, logs, and application database privileges. Remove test accounts only through a separately designed retention workflow; do not erase audit events.

Record the deployed URL and deployment ID after verification. No live brokerage integration is part of this release. Email recovery/verification, monitoring-provider setup, backup restore drills, and independent security/model review remain additional production requirements described in README.md.

## Rollback

Redeploy the last compatible Vercel deployment. Never run schema downgrades automatically. Preserve Neon backups/restore points under the selected plan's actual limits; use an isolated restoration and explicit cutover if a schema rollback is needed.

References: [Vercel environment variables](https://vercel.com/docs/environment-variables), [Vercel project settings](https://vercel.com/docs/project-configuration/project-settings), [Neon connections](https://neon.com/docs/connect/connect-from-any-app).
