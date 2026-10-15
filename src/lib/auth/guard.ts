import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getSessionUser } from "./session";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// جلوگیری از CSRF: درخواست‌های تغییردهنده باید از همان دامنه بیایند
function assertSameOrigin(req: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const origin = req.headers.get("origin");
  if (!origin) return; // کلاینت‌های غیرمرورگری
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!host || new URL(origin).host !== host) {
    throw new HttpError(403, "درخواست نامعتبر");
  }
}

export async function requireUser(req: Request) {
  assertSameOrigin(req);
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "ابتدا وارد شوید");
  return user;
}

export function parseId(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isSafeInteger(n) || n <= 0) {
    throw new HttpError(400, "شناسه نامعتبر است");
  }
  return n;
}

// مالکیت پروژه؛ اگر مال کاربر نباشد 404 (وجود پروژه‌های دیگران فاش نمی‌شود)
export async function requireProject(userId: number, projectId: unknown) {
  const id = parseId(projectId);
  const { rows } = await sql`
    SELECT id FROM projects WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  `;
  if (!rows.length) throw new HttpError(404, "پروژه پیدا نشد");
  return id;
}

export function handleError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("API error:", error);
  return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
}
