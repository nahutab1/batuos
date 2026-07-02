import { NextResponse } from 'next/server';
import { parseNaturalLanguageTask } from '@/lib/gemini';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // 1. Parse text with Gemini
    const parsed = await parseNaturalLanguageTask(text);

    // 2. Save to Supabase
    const db = createServerClient();
    const { data, error } = await db.from('tasks').insert({
      title: parsed.title,
      description: parsed.description,
      due_date: parsed.due_date || null,
      status: 'todo'
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
