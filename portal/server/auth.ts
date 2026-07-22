import { betterAuth } from "better-auth";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for Better Auth");
  }
  return new Pool({ connectionString: url });
}

const pool = process.env.DATABASE_URL ? createPool() : null;

export const auth = betterAuth({
  database: pool as Pool,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.VITE_APP_URL ?? "http://localhost:5174",
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-only-change-me-to-32chars-min!!",
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    process.env.VITE_APP_URL,
    "http://localhost:5174",
    "http://127.0.0.1:5174",
  ].filter((v): v is string => Boolean(v)),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      const key = process.env.RESEND_API_KEY;
      const from = process.env.RESEND_FROM ?? "Harunokaze <noreply@harunokaze.id>";
      if (!key) {
        console.info(`[auth] Password reset for ${user.email}: ${url}`);
        return;
      }
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: user.email,
          subject: "Reset password — Portal Harunokaze",
          html: `<p>Halo ${user.name || ""},</p><p>Klik link berikut untuk reset password:</p><p><a href="${url}">${url}</a></p>`,
        }),
      });
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const { ensureProfileAndProgress } = await import("./services/bootstrap");
          await ensureProfileAndProgress({
            userId: user.id,
            fullName: user.name || "Peserta",
          });
        },
      },
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
