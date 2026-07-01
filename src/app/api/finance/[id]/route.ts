import { NextRequest, NextResponse } from 'next/server';
import { FinanceService } from '@/modules/finance';

const service = new FinanceService();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const asset = await service.getById(id);
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    return NextResponse.json(asset);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
