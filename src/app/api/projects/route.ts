import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { handleError, HttpError, requireUser } from "@/lib/auth/guard";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const { rows } = await sql`
      SELECT id, name, url, created_at FROM projects
      WHERE user_id = ${user.id} ORDER BY id DESC
    `;
    return NextResponse.json(rows);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const body = await req.json().catch(() => null);
    const name = String(body?.name ?? "").trim();
    const url = String(body?.url ?? "").trim();

    if (!name || name.length > 120) throw new HttpError(400, "نام پروژه الزامی است (حداکثر ۱۲۰ کاراکتر)");
    if (url) {
      let ok = false;
      try { ok = ["http:", "https:"].includes(new URL(url).protocol) && url.length <= 300; } catch {}
      if (!ok) throw new HttpError(400, "آدرس سایت نامعتبر است");
    }

    const { rows: existing } = await sql`
      SELECT id, name, url, created_at FROM projects
      WHERE name = ${name} AND user_id = ${user.id} LIMIT 1
    `;
    if (existing.length) return NextResponse.json(existing[0]);

    const { rows } = await sql`
      INSERT INTO projects (user_id, name, url) VALUES (${user.id}, ${name}, ${url})
      RETURNING id, name, url, created_at
    `;
    return NextResponse.json(rows[0]);
  } catch (e) {
    return handleError(e);
  }
}
