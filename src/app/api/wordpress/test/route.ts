import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    const { rows } = await sql`SELECT wordpress_url, wordpress_username, wordpress_app_password FROM brand_info LIMIT 1`;
    
    if (!rows.length) {
      return NextResponse.json({ error: 'ردیفی در brand_info نیست' });
    }

    return NextResponse.json({
      url: rows[0].wordpress_url || 'NOT SET',
      username: rows[0].wordpress_username || 'NOT SET',
      password: rows[0].wordpress_app_password ? 'SET' : 'NOT SET',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
