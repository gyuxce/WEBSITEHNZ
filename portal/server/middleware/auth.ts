import type { Context, Next } from "hono";
import { auth } from "../auth";
import { sql } from "../db";
import type { Profile, UserProgress } from "../../src/lib/database.types";

export type AppUser = {
  id: string;
  email: string;
  name: string;
};

export type AppVariables = {
  user: AppUser;
  profile: Profile | null;
};

export async function requireAuth(c: Context<{ Variables: AppVariables }>, next: Next) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("user", {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  });
  await next();
}

export async function requireAdmin(c: Context<{ Variables: AppVariables }>, next: Next) {
  const user = c.get("user");
  const rows = await sql`
    select * from public.profiles where id = ${user.id} limit 1
  `;
  const profile = (rows[0] as Profile | undefined) ?? null;
  if (!profile || profile.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }
  c.set("profile", profile);
  await next();
}

export async function loadMe(userId: string): Promise<{
  profile: Profile | null;
  progress: UserProgress | null;
}> {
  const [profiles, progressRows] = await Promise.all([
    sql`select * from public.profiles where id = ${userId} limit 1`,
    sql`select * from public.user_progress where user_id = ${userId} limit 1`,
  ]);
  return {
    profile: (profiles[0] as Profile | undefined) ?? null,
    progress: (progressRows[0] as UserProgress | undefined) ?? null,
  };
}
