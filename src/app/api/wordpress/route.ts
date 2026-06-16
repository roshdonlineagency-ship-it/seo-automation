import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { title, content } = await req.json();

    const credentials = Buffer.from(
      `${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APP_PASSWORD}`
    ).toString('base64');

    const response = await fetch(`${process.env.WORDPRESS_URL}/wp-json/wp/v2/posts`, {
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
