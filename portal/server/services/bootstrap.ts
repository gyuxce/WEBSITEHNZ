import { sql } from "../db";

export async function ensureProfileAndProgress(input: {
  userId: string;
  fullName: string;
  whatsapp?: string | null;
  city?: string | null;
  programInterest?: string | null;
}) {
  await sql`
    insert into public.profiles (id, full_name, whatsapp, program_interest, city)
    values (
      ${input.userId},
      ${input.fullName || "Peserta"},
      ${input.whatsapp ?? null},
      ${input.programInterest ?? null},
      ${input.city ?? null}
    )
    on conflict (id) do update set
      full_name = excluded.full_name,
      whatsapp = coalesce(excluded.whatsapp, profiles.whatsapp),
      program_interest = coalesce(excluded.program_interest, profiles.program_interest),
      city = coalesce(excluded.city, profiles.city),
      updated_at = now()
  `;

  await sql`
    insert into public.user_progress (user_id)
    values (${input.userId})
    on conflict (user_id) do nothing
  `;
}

export async function updateProfile(
  userId: string,
  data: {
    fullName?: string;
    whatsapp?: string | null;
    city?: string | null;
    programInterest?: string | null;
  },
) {
  await sql`
    update public.profiles
    set
      full_name = coalesce(${data.fullName ?? null}, full_name),
      whatsapp = coalesce(${data.whatsapp ?? null}, whatsapp),
      program_interest = coalesce(${data.programInterest ?? null}, program_interest),
      city = coalesce(${data.city ?? null}, city),
      updated_at = now()
    where id = ${userId}
  `;
}
