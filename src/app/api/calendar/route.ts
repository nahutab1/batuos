import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  const db = createServerClient();
  const { data, error } = await db.from('events').select('*').order('start_time', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = createServerClient();

  const { data, error } = await db.from('events').insert({
    title: body.title,
    description: body.description || null,
    start_time: body.start_time,
    end_time: body.end_time,
    is_all_day: body.is_all_day || false
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
