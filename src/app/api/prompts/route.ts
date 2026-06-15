import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'projectId الزامی است' }, { status: 400 });

    const { rows } = await sql`
      SELECT * FROM prompts WHERE project_id = ${Number(projectId)} ORDER BY created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در دریافت پرامپت‌ها' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { projectId, name, text } = await req.json();
    if (!projectId || !name || !text) return NextResponse.json({ error: 'همه فیلدها الزامی است' }, { status: 400 });

    const { rows } = await sql`
      INSERT INTO prompts (project_id, name, text)
      VALUES (${projectId}, ${name}, ${text})
      RETURNING *
    `;
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در ثبت پرامپت' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, text } = await req.json();
    const { rows } = await sql`
      UPDATE prompts SET name = ${name}, text = ${text}
      WHERE id = ${id} RETURNING *
    `;
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در ویرایش پرامپت' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await sql`DELETE FROM prompts WHERE id = ${Number(id)}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در حذف پرامپت' }, { status: 500 });
  }
}
