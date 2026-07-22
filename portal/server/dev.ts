import { serve } from "@hono/node-server";

// Load .env from portal root when running locally (tsx)
try {
  const { readFileSync, existsSync } = await import("node:fs");
  const { resolve } = await import("node:path");
  const envPath = resolve(process.cwd(), ".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (!m) continue;
      const key = m[1].trim();
      const val = m[2].trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = val;
    }
  }
} catch {
  /* ignore */
}

const { app } = await import("./app");

const port = Number(process.env.API_PORT ?? 8787);
serve({ fetch: app.fetch, port }, () => {
  console.log(`API listening on http://localhost:${port}`);
});
