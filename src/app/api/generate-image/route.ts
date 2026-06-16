import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'پرامپت الزامی است' }, { status: 400 });

    const Replicate = (await import('replicate')).default;
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    const output = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt,
          aspect_ratio: "1:1",
          output_format: "webp",
          output_quality: 80,
        }
      }
    );

    return NextResponse.json({ url: Array.isArray(output) ? output[0] : output });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
