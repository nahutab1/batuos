import { NextRequest, NextResponse } from 'next/server';
import { NutritionService } from '@/modules/nutrition';

const service = new NutritionService();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const result = await service.getDaily(date);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
