import { NextRequest, NextResponse } from 'next/server';
import { FinanceService } from '@/modules/finance';

const service = new FinanceService();

export async function GET() {
  try {
    const result = await service.getAll();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await service.refreshPrices();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
