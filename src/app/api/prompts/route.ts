import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { handleError, HttpError, parseId, requireProject, requireUser } from "@/lib/auth/guard";

function cleanFields(name: unknown, text: unknown) {
  const n = String(name ?? "").trim();
  const t = String(text ?? "").trim();
  if (!n || !t) throw new HttpError(400, "همه فیلدها الزامی است");
  if (n.length > 200 || t.length > 20000) throw new HttpError(400, "طول ورودی بیش از حد مجاز است");
  return { n, t };
}

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const projectId = await requireProject(user.id, new URL(req.url).searchParams.get("projectId"));
    const { rows } = await sql`
      SELECT id, project_id, name, text, created_at FROM prompts
      WHERE project_id = ${projectId} ORDER BY created_at DESC
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
    const projectId = await requireProject(user.id, body?.projectId);
    const { n, t } = cleanFields(body?.name, body?.text);
    const { rows } = await sql`
      INSERT INTO prompts (project_id, name, text) VALUES (${projectId}, ${n}, ${t})
      RETURNING id, project_id, name, text, created_at
    `;
    return NextResponse.json(rows[0]);
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser(req);
    const body = await req.json().catch(() => null);
    const id = parseId(body?.id);
    const { n, t } = cleanFields(body?.name, body?.text);
    // مالکیت داخل خود کوئری اعمال می‌شود
    const { rows } = await sql`
      UPDATE prompts p SET name = ${n}, text = ${t}
      FROM projects pr
      WHERE p.id = ${id} AND p.project_id = pr.id AND pr.user_id = ${user.id}
      RETURNING p.id, p.project_id, p.name, p.text, p.created_at
    `;
    if (!rows.length) throw new HttpError(404, "پرامپت پیدا نشد");
    return NextResponse.json(rows[0]);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser(req);
    const id = parseId(new URL(req.url).searchParams.get("id"));
    const { rows } = await sql`
      DELETE FROM prompts p USING projects pr
      WHERE p.id = ${id} AND p.project_id = pr.id AND pr.user_id = ${user.id}
      RETURNING p.id
    `;
    if (!rows.length) throw new HttpError(404, "پرامپت پیدا نشد");
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
