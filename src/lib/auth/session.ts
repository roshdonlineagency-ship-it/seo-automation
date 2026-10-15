import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { sql } from "@vercel/postgres";

export const SESSION_COOKIE = "sid";
const SESSION_DAYS = 14;

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);

  await sql`
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES (${sha256(token)}, ${userId}, ${expires.toISOString()})
  `;
  // پاک‌سازی نشست‌های منقضی (سبک و گاه‌به‌گاه)
  await sql`DELETE FROM sessions WHERE expires_at < now()`;

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function getSessionUser(): Promise<{ id: number; email: string } | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;

  const { rows } = await sql`
    SELECT u.id, u.email
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${sha256(token)} AND s.expires_at > now()
    LIMIT 1
  `;
  return rows[0] ? { id: rows[0].id, email: rows[0].email } : null;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await sql`DELETE FROM sessions WHERE token_hash = ${sha256(token)}`;
  store.delete(SESSION_COOKIE);
}
