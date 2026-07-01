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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
