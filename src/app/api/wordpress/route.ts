import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(req: Request) {
  try {
    const { title, content } = await req.json();

    const { rows } = await sql`SELECT wordpress_url, wordpress_username, wordpress_app_password FROM brand_info LIMIT 1`;
    
    if (!rows.length) {
      return NextResponse.json({ error: 'اطلاعات وردپرس در دیتابیس یافت نشد' }, { status: 500 });
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
        status: 'draft',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message }, { status: 500 });
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
