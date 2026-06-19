import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const altText = formData.get('alt_text') as string;

    // ۱. دریافت projectId از فرم‌دیتا یا پارامترهای URL (برای اطمینان بیشتر، هر دو حالت پوشش داده شده است)
    const url = new URL(req.url);
    const projectId = (formData.get('projectId') as string) || url.searchParams.get('projectId');

    if (!file) {
      return NextResponse.json({ error: 'فایلی ارسال نشده است' }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: 'آیدی پروژه (projectId) به سرور ارسال نشده است' }, { status: 400 });
    }

    // ۲. خواندن اطلاعات اتصال از دیتابیس بر اساس projectId فیلتر شده
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
    const credentials = Buffer.from(`${wordpress_username}:${wordpress_app_password}`).toString('base64');

    // تبدیل فایل به بافر برای ارسال مالتی‌پارت به وردپرس
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const wpFormData = new FormData();
    const blob = new Blob([buffer], { type: file.type });
    wpFormData.append('file', blob, file.name);
    wpFormData.append('title', title || '');
    wpFormData.append('alt_text', altText || '');

    // ارسال به API رسانه‌های همان وردپرس هدف
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

    // بازگرداندن آدرس مستقیم عکس آپلود شده از سایت هدف
    return NextResponse.json({ url: data.source_url });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
