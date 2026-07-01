import type { BaseEntity } from '@/core/types';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodLog extends BaseEntity {
  meal_type: MealType;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  image_url: string | null;
  notes: string | null;
  logged_at: string;
}

export interface CreateFoodLogDTO {
  meal_type: MealType;
  food_name: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  image_url?: string;
  notes?: string;
  logged_at?: string;
}

export interface DailyNutrition {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meals: FoodLog[];
}

export interface AnalysisResult {
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  estimated: boolean;
}

export interface StepsToBurnResult {
  calories: number;
  steps: number;
  duration_min: number;
  note: string;
}
