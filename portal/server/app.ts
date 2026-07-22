import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import type { AppVariables } from "./middleware/auth";
import { loadMe, requireAdmin, requireAuth } from "./middleware/auth";
import { ensureProfileAndProgress, updateProfile } from "./services/bootstrap";
import { sql } from "./db";
import { createHash } from "node:crypto";

const app = new Hono<{ Variables: AppVariables }>().basePath("/api");

const allowedOrigins = [
  process.env.BETTER_AUTH_URL,
  process.env.VITE_APP_URL,
  "http://localhost:5174",
  "http://127.0.0.1:5174",
].filter((v): v is string => Boolean(v));

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return allowedOrigins[0] ?? "*";
      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? origin;
    },
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));

app.get("/health", (c) => c.json({ ok: true, db: Boolean(process.env.DATABASE_URL) }));

app.get("/me", requireAuth, async (c) => {
  const user = c.get("user");
  let { profile, progress } = await loadMe(user.id);
  if (!profile || !progress) {
    await ensureProfileAndProgress({ userId: user.id, fullName: user.name || "Peserta" });
    ({ profile, progress } = await loadMe(user.id));
  }
  return c.json({
    user: { id: user.id, email: user.email, name: user.name },
    profile,
    progress,
  });
});

app.patch("/me/profile", requireAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{
    fullName?: string;
    whatsapp?: string;
    city?: string;
    programInterest?: string;
  }>();
  await ensureProfileAndProgress({
    userId: user.id,
    fullName: body.fullName || user.name || "Peserta",
    whatsapp: body.whatsapp ?? null,
    city: body.city ?? null,
    programInterest: body.programInterest ?? null,
  });
  if (body.fullName || body.whatsapp || body.city || body.programInterest) {
    await updateProfile(user.id, {
      fullName: body.fullName,
      whatsapp: body.whatsapp,
      city: body.city,
      programInterest: body.programInterest,
    });
  }
  const me = await loadMe(user.id);
  return c.json(me);
});

app.post("/payments/sandbox/settle", requireAuth, async (c) => {
  if (process.env.ALLOW_SANDBOX_PAY !== "true" && process.env.NODE_ENV === "production") {
    // Allow unless explicitly disabled in production with ALLOW_SANDBOX_PAY=false
  }
  if (process.env.ALLOW_SANDBOX_PAY === "false") {
    return c.json({ error: "Sandbox payment disabled" }, 403);
  }

  const user = c.get("user");
  const amount = Number(process.env.PEMETAAN_PRICE ?? 150000);
  const orderId = `HNZ-SANDBOX-${Date.now()}`;

  await sql`
    insert into public.payments (user_id, order_id, amount, status, payment_type)
    values (${user.id}, ${orderId}, ${amount}, 'settlement', 'pemetaan')
  `;

  await sql`
    update public.user_progress
    set payment_status = 'verified',
        language_test_status = 'available',
        updated_at = now()
    where user_id = ${user.id}
  `;

  const me = await loadMe(user.id);
  return c.json({ ok: true, orderId, ...me });
});

app.post("/payments/midtrans/create", requireAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{ amount?: number }>().catch(() => ({ amount: undefined }));
  const amount = Number(body.amount ?? process.env.PEMETAAN_PRICE ?? 150000);
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    return c.json({ error: "MIDTRANS_SERVER_KEY not configured" }, 500);
  }

  const orderId = `HNZ-${user.id.slice(0, 8)}-${Date.now()}`;
  await sql`
    insert into public.payments (user_id, order_id, amount, status, payment_type)
    values (${user.id}, ${orderId}, ${amount}, 'pending', 'pemetaan')
  `;

  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const midtransUrl = isProduction
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  const midtransRes = await fetch(midtransUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
    },
    body: JSON.stringify({
      transaction_details: { order_id: orderId, gross_amount: amount },
      customer_details: { email: user.email },
      item_details: [
        {
          id: "pemetaan",
          price: amount,
          quantity: 1,
          name: "Pemetaan Potensi Harunokaze",
        },
      ],
    }),
  });

  const midtransData = (await midtransRes.json()) as {
    token?: string;
    error_messages?: string[];
  };

  if (!midtransRes.ok || !midtransData.token) {
    return c.json(
      { error: midtransData.error_messages?.join(", ") ?? "Midtrans error" },
      400,
    );
  }

  return c.json({ token: midtransData.token, order_id: orderId });
});

app.post("/payments/midtrans/webhook", async (c) => {
  const body = await c.req.json<{
    order_id: string;
    status_code: string;
    gross_amount: string;
    signature_key?: string;
    transaction_status?: string;
    transaction_id?: string;
  }>();

  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  if (body.signature_key) {
    const sigInput = `${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`;
    const expected = createHash("sha512").update(sigInput).digest("hex");
    if (expected !== body.signature_key) {
      return c.json({ error: "Invalid signature" }, 403);
    }
  }

  let paymentStatus = "pending";
  const transactionStatus = body.transaction_status;
  if (transactionStatus === "settlement" || transactionStatus === "capture") {
    paymentStatus = "settlement";
  } else if (transactionStatus === "expire") {
    paymentStatus = "expire";
  } else if (transactionStatus === "cancel" || transactionStatus === "deny") {
    paymentStatus = transactionStatus;
  }

  await sql`
    update public.payments
    set status = ${paymentStatus},
        midtrans_transaction_id = ${body.transaction_id ?? null},
        updated_at = now()
    where order_id = ${body.order_id}
  `;

  return c.json({ ok: true });
});

app.post("/tests/pimsleur/start", requireAuth, async (c) => {
  const user = c.get("user");
  await sql`
    update public.user_progress
    set language_test_status = 'in_progress', updated_at = now()
    where user_id = ${user.id}
  `;
  return c.json({ ok: true });
});

app.post("/tests/pimsleur/submit", requireAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{
    answers: Record<string, string>;
    score_section2: number;
    score_section3: number;
    score_section4: number;
    score_section5: number;
    score_section6: number;
    score_verbal: number;
    score_audio: number;
    score_total: number;
    grade: string;
    grade_label: string;
    status_label: string;
    recommendation: string;
    duration_seconds?: number | null;
    started_at?: string;
  }>();

  await sql`
    insert into public.pimsleur_results (
      user_id, answers,
      score_section2, score_section3, score_section4, score_section5, score_section6,
      score_verbal, score_audio, score_total,
      grade, grade_label, status_label, recommendation,
      duration_seconds, started_at, completed_at
    ) values (
      ${user.id},
      ${JSON.stringify(body.answers)}::jsonb,
      ${body.score_section2}, ${body.score_section3}, ${body.score_section4},
      ${body.score_section5}, ${body.score_section6},
      ${body.score_verbal}, ${body.score_audio}, ${body.score_total},
      ${body.grade}, ${body.grade_label}, ${body.status_label}, ${body.recommendation},
      ${body.duration_seconds ?? null},
      ${body.started_at ?? new Date().toISOString()},
      now()
    )
    on conflict (user_id) do update set
      answers = excluded.answers,
      score_section2 = excluded.score_section2,
      score_section3 = excluded.score_section3,
      score_section4 = excluded.score_section4,
      score_section5 = excluded.score_section5,
      score_section6 = excluded.score_section6,
      score_verbal = excluded.score_verbal,
      score_audio = excluded.score_audio,
      score_total = excluded.score_total,
      grade = excluded.grade,
      grade_label = excluded.grade_label,
      status_label = excluded.status_label,
      recommendation = excluded.recommendation,
      duration_seconds = excluded.duration_seconds,
      started_at = excluded.started_at,
      completed_at = excluded.completed_at
  `;

  await sql`
    update public.user_progress
    set language_test_status = 'completed',
        result_status = 'available',
        cfit_test_status = 'available',
        updated_at = now()
    where user_id = ${user.id}
  `;

  return c.json({ ok: true });
});

app.get("/tests/pimsleur/result", requireAuth, async (c) => {
  const user = c.get("user");
  const rows = await sql`
    select * from public.pimsleur_results
    where user_id = ${user.id}
    order by completed_at desc
    limit 1
  `;
  return c.json({ result: rows[0] ?? null });
});

app.post("/tests/cfit/start", requireAuth, async (c) => {
  const user = c.get("user");
  await sql`
    update public.user_progress
    set cfit_test_status = 'in_progress', updated_at = now()
    where user_id = ${user.id}
  `;
  return c.json({ ok: true });
});

app.post("/tests/cfit/submit", requireAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{
    answers: Record<string, string>;
    birth_date: string;
    age_years: number;
    age_months: number;
    age_band: string;
    score_subtest1: number;
    score_subtest2: number;
    score_subtest3: number;
    score_subtest4: number;
    score_raw: number;
    iq: number;
    classification: string;
    classification_label: string;
    category_color: string;
    category_label: string;
    duration_seconds?: number | null;
    started_at?: string;
  }>();

  await sql`
    insert into public.cfit_results (
      user_id, answers, birth_date, age_years, age_months, age_band,
      score_subtest1, score_subtest2, score_subtest3, score_subtest4,
      score_raw, iq, classification, classification_label,
      category_color, category_label, duration_seconds, started_at, completed_at
    ) values (
      ${user.id},
      ${JSON.stringify(body.answers)}::jsonb,
      ${body.birth_date},
      ${body.age_years}, ${body.age_months}, ${body.age_band},
      ${body.score_subtest1}, ${body.score_subtest2}, ${body.score_subtest3}, ${body.score_subtest4},
      ${body.score_raw}, ${body.iq}, ${body.classification}, ${body.classification_label},
      ${body.category_color}, ${body.category_label},
      ${body.duration_seconds ?? null},
      ${body.started_at ?? new Date().toISOString()},
      now()
    )
    on conflict (user_id) do update set
      answers = excluded.answers,
      birth_date = excluded.birth_date,
      age_years = excluded.age_years,
      age_months = excluded.age_months,
      age_band = excluded.age_band,
      score_subtest1 = excluded.score_subtest1,
      score_subtest2 = excluded.score_subtest2,
      score_subtest3 = excluded.score_subtest3,
      score_subtest4 = excluded.score_subtest4,
      score_raw = excluded.score_raw,
      iq = excluded.iq,
      classification = excluded.classification,
      classification_label = excluded.classification_label,
      category_color = excluded.category_color,
      category_label = excluded.category_label,
      duration_seconds = excluded.duration_seconds,
      started_at = excluded.started_at,
      completed_at = excluded.completed_at
  `;

  await sql`
    update public.user_progress
    set cfit_test_status = 'completed',
        character_test_status = 'available',
        updated_at = now()
    where user_id = ${user.id}
  `;

  return c.json({ ok: true });
});

app.get("/tests/cfit/result", requireAuth, async (c) => {
  const user = c.get("user");
  const rows = await sql`
    select * from public.cfit_results
    where user_id = ${user.id}
    order by completed_at desc
    limit 1
  `;
  return c.json({ result: rows[0] ?? null });
});

app.get("/admin/pimsleur", requireAuth, requireAdmin, async (c) => {
  const rows = await sql`
    select
      r.id,
      r.user_id,
      r.score_section2,
      r.score_section3,
      r.score_section4,
      r.score_section5,
      r.score_section6,
      r.score_verbal,
      r.score_audio,
      r.score_total,
      r.grade,
      r.grade_label,
      r.status_label,
      r.recommendation,
      r.duration_seconds,
      r.completed_at,
      coalesce(
        nullif(nullif(trim(p.full_name), ''), 'Peserta'),
        split_part(u.email, '@', 1),
        'Peserta'
      ) as full_name,
      u.email,
      p.whatsapp,
      p.city
    from public.pimsleur_results r
    left join public.profiles p on p.id = r.user_id
    left join "user" u on u.id = r.user_id
    order by r.completed_at desc
  `;
  return c.json({ rows });
});

app.get("/admin/pimsleur/:userId", requireAuth, requireAdmin, async (c) => {
  const userId = c.req.param("userId");
  const detail = await sql`
    select
      r.id,
      r.user_id,
      r.answers,
      r.score_section2,
      r.score_section3,
      r.score_section4,
      r.score_section5,
      r.score_section6,
      r.score_verbal,
      r.score_audio,
      r.score_total,
      r.grade,
      r.grade_label,
      r.status_label,
      r.recommendation,
      r.duration_seconds,
      r.completed_at,
      coalesce(
        nullif(nullif(trim(p.full_name), ''), 'Peserta'),
        split_part(u.email, '@', 1),
        'Peserta'
      ) as full_name,
      u.email,
      p.whatsapp,
      p.city
    from public.pimsleur_results r
    left join public.profiles p on p.id = r.user_id
    left join "user" u on u.id = r.user_id
    where r.user_id = ${userId}
    order by r.completed_at desc
    limit 1
  `;
  return c.json({ result: detail[0] ?? null });
});

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message || "Internal error" }, 500);
});

export { app };
export default app;
