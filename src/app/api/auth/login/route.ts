import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { DUMMY_HASH, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { handleError, HttpError } from "@/lib/auth/guard";

const MAX_ATTEMPTS = 8; // در ۱۵ دقیقه، برای هر ایمیل و برای هر IP

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? "").trim().toLowerCase().slice(0, 200);
    const password = String(body?.password ?? "").slice(0, 200);
    const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim().slice(0, 64);

    const emailKey = `e:${email}`;
    const ipKey = `i:${ip}`;
    const { rows: att } = await sql`
      SELECT
        count(*) FILTER (WHERE key = ${emailKey})::int AS by_email,
        count(*) FILTER (WHERE key = ${ipKey})::int AS by_ip
      FROM login_attempts
      WHERE created_at > now() - interval '15 minutes'
    `;
    if (att[0].by_email >= MAX_ATTEMPTS || att[0].by_ip >= MAX_ATTEMPTS * 3) {
      throw new HttpError(429, "تعداد تلاش‌ها زیاد است؛ ۱۵ دقیقه بعد دوباره امتحان کن");
    }

    const { rows } = await sql`
      SELECT id, password_hash FROM users WHERE lower(email) = ${email} LIMIT 1
    `;
    const ok = await verifyPassword(password, rows[0]?.password_hash ?? DUMMY_HASH);

    if (!rows[0] || !ok) {
      await sql`INSERT INTO login_attempts (key) VALUES (${emailKey}), (${ipKey})`;
      throw new HttpError(401, "ایمیل یا رمز عبور نادرست است");
    }

    await sql`DELETE FROM login_attempts WHERE key = ${emailKey}`;
    await createSession(rows[0].id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
