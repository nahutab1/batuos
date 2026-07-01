import { NextResponse } from 'next/server';
import { InvestmentDiscoveryService } from '@/modules/investments';

const service = new InvestmentDiscoveryService();

export async function GET() {
  try {
    const data = await service.getAll();
    return NextResponse.json({ data, count: data.length });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await service.runDiscovery();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
