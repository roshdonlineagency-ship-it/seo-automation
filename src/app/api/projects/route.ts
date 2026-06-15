export async function POST(req: Request) {
  try {
    const { name, url } = await req.json();
    if (!name) return NextResponse.json({ error: 'نام پروژه الزامی است' }, { status: 400 });
    
    // چک کن همین اسم قبلاً ثبت نشده باشه
    const { rows: existing } = await sql`
      SELECT id FROM projects WHERE name = ${name} AND user_id = ${TEMP_USER_ID}
    `;
    if (existing.length > 0) return NextResponse.json(existing[0]);

    const { rows } = await sql`
      INSERT INTO projects (user_id, name, url)
      VALUES (${TEMP_USER_ID}, ${name}, ${url || ''})
      RETURNING *
    `;
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در ثبت پروژه' }, { status: 500 });
  }
}
