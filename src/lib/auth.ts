import { betterAuth } from "better-auth";
import { db } from "./db";
// Vercel overwrites this header at its ingress; never trust arbitrary forwarded
// headers on other hosts without an explicitly configured trusted proxy.
const trustedIpHeader = process.env.TRUSTED_IP_HEADER ||
  (process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : undefined);
export const auth = betterAuth({
  appName: "Centurion",
  database: db,
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
    },
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: trustedIpHeader ? [trustedIpHeader] : [],
    },
  },
});
