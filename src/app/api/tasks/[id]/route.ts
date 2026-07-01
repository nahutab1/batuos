import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/core';
import { TASK_SERVICE, initTaskModule } from '@/modules/tasks';

initTaskModule();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const service = container.resolve(TASK_SERVICE);
  const id = (await params).id;
  const result = await service.getById(id);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  if (!result.data) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const service = container.resolve(TASK_SERVICE);
  const id = (await params).id;
  const body = await request.json();

  const result = await service.update(id, {
    title: body.title,
    done: body.done,
    priority: body.priority,
    due_date: body.due_date,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const service = container.resolve(TASK_SERVICE);
  const id = (await params).id;
  const result = await service.delete(id);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
