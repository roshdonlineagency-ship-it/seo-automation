import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, model } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'پرامپت الزامی است' }, { status: 400 });

    let content = '';

    if (model === 'claude') {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });
      content = message.content[0].type === 'text' ? message.content[0].text : '';

    } else if (model === 'openai') {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });
      content = completion.choices[0].message.content || '';

    } else {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await geminiModel.generateContent(prompt);
      content = result.response.text();
    }

    return NextResponse.json({ content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
