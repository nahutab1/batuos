import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/core';
import { TASK_SERVICE, initTaskModule } from '@/modules/tasks';

// Ensure module is initialized
initTaskModule();

export async function GET(request: NextRequest) {
  const service = container.resolve(TASK_SERVICE);
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

  const result = await service.getAll(page, pageSize);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const service = container.resolve(TASK_SERVICE);
  const body = await request.json();

  let result;
  if (body.natural_language) {
    result = await service.createFromNaturalLanguage(body.natural_language);
  } else {
    result = await service.create({
      title: body.title,
      priority: body.priority,
      due_date: body.due_date,
    });
  }

  // Return immediately, reprioritize in background (don't block)
  if (!result.error) {
    service.reprioritize().catch(e => console.error('Reprioritize error:', e));
  }

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data);
}

export async function DELETE(request: NextRequest) {
  const service = container.resolve(TASK_SERVICE);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  const result = await service.delete(id);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const service = container.resolve(TASK_SERVICE);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const body = await request.json().catch(() => ({}));

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  const dto: { title?: string; done?: boolean; priority?: number; due_date?: string } = {};

  if (body.title !== undefined) dto.title = body.title;
  if (body.done !== undefined) dto.done = body.done;
  if (body.priority !== undefined) dto.priority = body.priority;
  if (body.due_date !== undefined) dto.due_date = body.due_date;

  const result = await service.update(id, dto);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data);
}
