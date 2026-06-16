import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const altText = formData.get('alt_text') as string;

    if (!file) {
      return NextResponse.json({ error: 'فایلی ارسال نشده است' }, { status: 400 });
    }

    // خواندن اطلاعات اتصال از دیتابیس ورسل
    const { rows } = await sql`SELECT wordpress_url, wordpress_username, wordpress_app_password FROM brand_info LIMIT 1`;
    
    if (!rows.length) {
      return NextResponse.json({ error: 'اطلاعات وردپرس در دیتابیس یافت نشد' }, { status: 500 });
    }

    const { wordpress_url, wordpress_username, wordpress_app_password } = rows[0];
    const credentials = Buffer.from(`${wordpress_username}:${wordpress_app_password}`).toString('base64');

    // تبدیل فایل به بافر برای ارسال ماتی‌پارت به وردپرس
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const wpFormData = new FormData();
    const blob = new Blob([buffer], { type: file.type });
    wpFormData.append('file', blob, file.name);
    wpFormData.append('title', title || '');
    wpFormData.append('alt_text', altText || '');

    // ارسال به API رسانه‌های وردپرس
    const response = await fetch(`${wordpress_url}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
      body: wpFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'خطا در آپلود رسانه به وردپرس' }, { status: response.status });
    }

    // بازگرداندن آدرس مستقیم عکس آپلود شده
    return NextResponse.json({ url: data.source_url });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
