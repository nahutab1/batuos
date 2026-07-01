import { NextRequest, NextResponse } from 'next/server';
import { NutritionService } from '@/modules/nutrition';

const service = new NutritionService();

export async function POST(req: NextRequest) {
  try {
    const { calories } = await req.json();
    if (!calories || typeof calories !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid calories' }, { status: 400 });
    }

    const result = await service.stepsToBurn(calories);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
