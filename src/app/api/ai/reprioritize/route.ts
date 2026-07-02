import { NextResponse } from 'next/server';
import { container } from '@/core';
import { TASK_SERVICE } from '@/modules/tasks/index';
import { initTaskModule } from '@/modules/tasks/index';

initTaskModule();

export async function POST() {
  const service = container.resolve(TASK_SERVICE);
  try {
    await service.reprioritize();
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
