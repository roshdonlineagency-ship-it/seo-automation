import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'پرامپت الزامی است' }, { status: 400 });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "1:1",
          }
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || 'خطا' }, { status: 500 });
    }

    const base64 = data.predictions?.[0]?.bytesBase64Encoded;
    if (!base64) return NextResponse.json({ error: 'تصویر دریافت نشد' }, { status: 500 });

    const url = `data:image/png;base64,${base64}`;
    return NextResponse.json({ url });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
