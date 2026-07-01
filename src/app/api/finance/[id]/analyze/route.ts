import { NextRequest, NextResponse } from 'next/server';
import { FinanceService } from '@/modules/finance';

const service = new FinanceService();

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await service.generateAnalysis(id);
    if (!result) return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const analysis = await service.getAnalysis(id);
    return NextResponse.json(analysis || { error: 'No analysis yet' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
