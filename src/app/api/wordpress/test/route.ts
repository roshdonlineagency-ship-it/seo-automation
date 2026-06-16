import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    url: process.env.WORDPRESS_URL || 'NOT SET',
    username: process.env.WORDPRESS_USERNAME || 'NOT SET',
    password: process.env.WORDPRESS_APP_PASSWORD ? 'SET' : 'NOT SET',
  });
}
