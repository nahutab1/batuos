import { GoogleGenAI } from '@google/genai';
import { createServerClient } from '@/lib/supabase';
import type { FoodLog, CreateFoodLogDTO, DailyNutrition, AnalysisResult, StepsToBurnResult, MealType } from './types';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODEL = 'gemini-2.5-flash';

const DATA_DIR = path.join(process.cwd(), '.data');
const FOOD_FILE = path.join(DATA_DIR, 'food_logs.json');

function ensureDir() { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); }
function readFood(): FoodLog[] { try { if (fs.existsSync(FOOD_FILE)) return JSON.parse(fs.readFileSync(FOOD_FILE, 'utf-8')); } catch {} return []; }
function writeFood(data: FoodLog[]) { ensureDir(); fs.writeFileSync(FOOD_FILE, JSON.stringify(data, null, 2)); }
function uid() { return crypto.randomUUID(); }

async function useSupabase(): Promise<boolean> {
  try {
    const db = createServerClient();
    const { error } = await db.from('food_logs').select('id').limit(1);
    return !error;
  } catch { return false; }
}

export class NutritionService {
  async getAll(date?: string): Promise<{ data: FoodLog[]; count: number }> {
    if (await useSupabase()) {
      const db = createServerClient();
      let q = db.from('food_logs').select('*', { count: 'exact' }).order('logged_at', { ascending: false });
      if (date) {
        const s = new Date(date); s.setHours(0,0,0,0);
        const e = new Date(s); e.setDate(e.getDate()+1);
        q = q.gte('logged_at', s.toISOString()).lt('logged_at', e.toISOString());
      }
      const { data, error, count } = await q;
      if (error) throw new Error(error.message);
      return { data: (data || []) as FoodLog[], count: count || 0 };
    }
    const all = readFood();
    if (date) {
      const d = date.slice(0,10);
      return { data: all.filter(i => i.logged_at?.slice(0,10) === d), count: all.length };
    }
    return { data: all, count: all.length };
  }

  async create(dto: CreateFoodLogDTO): Promise<FoodLog> {
    if (await useSupabase()) {
      const db = createServerClient();
      const { data, error } = await db.from('food_logs').insert(dto).select().single();
      if (error) throw new Error(error.message);
      return data as FoodLog;
    }
    const entry: FoodLog = {
      id: uid(),
      meal_type: dto.meal_type,
      food_name: dto.food_name,
      calories: dto.calories,
      protein_g: dto.protein_g || 0,
      carbs_g: dto.carbs_g || 0,
      fat_g: dto.fat_g || 0,
      image_url: dto.image_url || null,
      notes: dto.notes || null,
      logged_at: dto.logged_at || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const all = readFood();
    all.unshift(entry);
    writeFood(all);
    return entry;
  }

  async delete(id: string): Promise<void> {
    if (await useSupabase()) {
      const db = createServerClient();
      await db.from('food_logs').delete().eq('id', id);
      return;
    }
    writeFood(readFood().filter(i => i.id !== id));
  }

  async getDaily(date: string): Promise<DailyNutrition> {
    const { data: meals } = await this.getAll(date);
    return {
      date,
      total_calories: meals.reduce((s, m) => s + m.calories, 0),
      total_protein: meals.reduce((s, m) => s + m.protein_g, 0),
      total_carbs: meals.reduce((s, m) => s + m.carbs_g, 0),
      total_fat: meals.reduce((s, m) => s + m.fat_g, 0),
      meals,
    };
  }

  /** Analyze a food photo using Gemini Vision */
  async analyzeFoodPhoto(imageBase64: string, mimeType: string): Promise<AnalysisResult> {
    const prompt = `Analyze this food photo. Return a raw JSON object (no markdown) with:
{
  "food_name": "short name of the dish/food",
  "calories": <number>,
  "protein_g": <number>,
  "carbs_g": <number>,
  "fat_g": <number>,
  "estimated": true
}
If you cannot determine exact values, give your best estimate and set "estimated": true.`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
        ],
        config: {
          temperature: 0.15,
          maxOutputTokens: 300,
        },
      });

      const text = response.text ?? '';
      const cleaned = text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        food_name: String(parsed.food_name || 'Unknown food'),
        calories: Number(parsed.calories) || 0,
        protein_g: Number(parsed.protein_g) || 0,
        carbs_g: Number(parsed.carbs_g) || 0,
        fat_g: Number(parsed.fat_g) || 0,
        estimated: parsed.estimated !== false,
      };
    } catch (e) {
      console.error('[Nutrition] Vision analysis failed:', e);
      return {
        food_name: 'Analysis failed',
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        estimated: true,
      };
    }
  }

  /** Calculate steps needed to burn given calories */
  async stepsToBurn(calories: number): Promise<StepsToBurnResult> {
    // Average: 100 steps ~= 4 calories for a 70kg person
    const avgStepsPerCalorie = 25;
    const steps = Math.round(calories * avgStepsPerCalorie);
    const durationMin = Math.round(steps / 100); // ~100 steps/min walking pace

    const prompt = `A person consumed ${calories} calories. Give a short, encouraging one-sentence note about how many steps they need to walk to burn this off. Return raw JSON (no markdown): { "note": "..." }`;

    let note = '';
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { temperature: 0.5, maxOutputTokens: 100 },
      });
      const cleaned = (response.text ?? '').replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      note = parsed.note || '';
    } catch {
      // fallback
    }

    return {
      calories,
      steps,
      duration_min: durationMin,
      note: note || `Walk about ${(steps / 1000).toFixed(1)}k steps (~${durationMin} min) to burn this off.`,
    };
  }
}
