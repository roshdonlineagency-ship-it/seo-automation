import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(req: Request) {
  try {
    // ۱. دریافت projectId به همراه سایر مقادیر از فرانت‌اند
    const { projectId, title, content, slug, excerpt, meta } = await req.json();

    if (!projectId) {
       return NextResponse.json({ error: 'آیدی پروژه (projectId) به سرور ارسال نشده است' }, { status: 400 });
    }

    // ۲. فیلتر کردن کوئری دیتابیس دقیقاً بر اساس آیدی همان پروژه
    // توجه: فرض بر این است که ستون کلید اصلی در جدول شما id نام دارد.
    const { rows } = await sql`
      SELECT wordpress_url, wordpress_username, wordpress_app_password 
      FROM brand_info 
      WHERE id = ${projectId}
      LIMIT 1
    `;
    
    if (!rows.length) {
      return NextResponse.json({ error: `اطلاعات وردپرس برای پروژه شماره ${projectId} در دیتابیس یافت نشد` }, { status: 404 });
    }

    const { wordpress_url, wordpress_username, wordpress_app_password } = rows[0];

    const credentials = Buffer.from(
      `${wordpress_username}:${wordpress_app_password}`
    ).toString('base64');

    const response = await fetch(`${wordpress_url}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify({
        title,
        content,
        slug, // اعمال نامک سئوشده
        excerpt, // اعمال متا دیسکریپشن در خلاصه وردپرس
        status: 'draft', // وضعیت پیش‌نویس جهت بررسی نهایی شما
        meta: meta || {}, // تزریق آبجکت متادیتا برای RankMath و سئو
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message }, { status: response.status });
    }

    return NextResponse.json({ 
      success: true, 
      postId: data.id,
      link: data.link 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
