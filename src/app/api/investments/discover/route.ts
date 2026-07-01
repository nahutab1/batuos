import { NextRequest, NextResponse } from 'next/server';
import { InvestmentDiscoveryService } from '@/modules/investments';

const service = new InvestmentDiscoveryService();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');
    if (!symbol) return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });

    const analysis = await service.analyzeAsset(symbol.toUpperCase());
    if (!analysis) return NextResponse.json({ error: 'Analysis failed' }, { status: 404 });
    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
