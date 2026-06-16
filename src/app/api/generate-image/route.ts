import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'پرامپت الزامی است' }, { status: 400 });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Generate an image for this topic: ${prompt}` }]
          }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          }
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || 'خطا در Gemini' }, { status: 500 });
    }

    const parts = data.candidates?.[0]?.content?.parts;
    const imagePart = parts?.find((p: any) => p.inlineData);

    if (!imagePart?.inlineData?.data) {
      return NextResponse.json({ error: 'تصویر دریافت نشد: ' + JSON.stringify(data) }, { status: 500 });
    }

    const mimeType = imagePart.inlineData.mimeType || 'image/png';
    const url = `data:${mimeType};base64,${imagePart.inlineData.data}`;

    return NextResponse.json({ url });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
