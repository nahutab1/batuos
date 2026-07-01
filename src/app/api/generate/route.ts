import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { prompt, system } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });

    const text = await generateText(prompt, system || 'You are BatuOS, a helpful AI assistant.');
    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
