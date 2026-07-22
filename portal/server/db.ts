import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("DATABASE_URL belum diset — API Neon tidak bisa query.");
}

/** Tagged-template SQL client (HTTP). Safe for Vercel serverless. */
export const sql = databaseUrl
  ? neon(databaseUrl)
  : (((_strings: TemplateStringsArray, ..._values: unknown[]) => {
      throw new Error("DATABASE_URL is not configured");
    }) as ReturnType<typeof neon>);
