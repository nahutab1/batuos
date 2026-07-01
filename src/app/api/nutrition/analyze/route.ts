import { NextRequest, NextResponse } from 'next/server';
import { NutritionService } from '@/modules/nutrition';

const service = new NutritionService();

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = await req.json();
    if (!image) return NextResponse.json({ error: 'Missing image data' }, { status: 400 });

    const result = await service.analyzeFoodPhoto(image, mimeType || 'image/jpeg');
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
