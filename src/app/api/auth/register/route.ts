import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { timingSafeEqual } from "crypto";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { handleError, HttpError } from "@/lib/auth/guard";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function codeMatches(input: string) {
  const expected = process.env.AUTH_SIGNUP_CODE;
  if (!expected) throw new HttpError(403, "ثبت‌نام فعال نیست (AUTH_SIGNUP_CODE تنظیم نشده)");
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const code = String(body?.inviteCode ?? "");

    if (!codeMatches(code)) throw new HttpError(403, "کد دعوت نادرست است");
    if (!EMAIL_RE.test(email) || email.length > 200) throw new HttpError(400, "ایمیل نامعتبر است");
    if (password.length < 12 || password.length > 200) {
      throw new HttpError(400, "رمز عبور باید حداقل ۱۲ کاراکتر باشد");
    }

    const { rows: exists } = await sql`SELECT 1 FROM users WHERE lower(email) = ${email} LIMIT 1`;
    if (exists.length) throw new HttpError(409, "این ایمیل قبلاً ثبت شده است");

    const { rows: countRows } = await sql`SELECT count(*)::int AS n FROM users`;
    const isFirstUser = countRows[0].n === 0;

    const hash = await hashPassword(password);
    const { rows } = await sql`
      INSERT INTO users (email, password_hash) VALUES (${email}, ${hash}) RETURNING id
    `;
    const userId: number = rows[0].id;

    // اولین کاربر = مالک فعلی پروژه؛ پروژه‌های قدیمی (بدون کاربر معتبر) به او منتقل می‌شوند
    if (isFirstUser) {
      await sql`
        UPDATE projects SET user_id = ${userId}
        WHERE user_id NOT IN (SELECT id FROM users)
      `;
    }

    await createSession(userId);
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
