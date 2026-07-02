'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@/components/ui';

interface FoodLog {
  id: string;
  meal_type: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  image_url: string | null;
  logged_at: string;
}

interface DailySummary {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meals: FoodLog[];
}

export default function NutritionPage() {
  const [daily, setDaily] = useState<DailySummary | null>(null);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showManual, setShowManual] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualCal, setManualCal] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [manualType, setManualType] = useState('snack');

  // AI vision states
  const [showAi, setShowAi] = useState(false);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [aiMime, setAiMime] = useState('image/jpeg');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiMealType, setAiMealType] = useState('snack');

  // Steps
  const [stepInfo, setStepInfo] = useState<any>(null);

  const fetchDaily = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [dailyRes, logsRes] = await Promise.all([
        fetch(`/api/nutrition/daily?date=${today}`),
        fetch('/api/nutrition?limit=50'),
      ]);
      if (dailyRes.ok) setDaily(await dailyRes.json());
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDaily(); }, []);

  const addManual = async () => {
    if (!manualName || !manualCal) return;
    await fetch('/api/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meal_type: manualType,
        food_name: manualName,
        calories: parseInt(manualCal) || 0,
        protein_g: parseFloat(manualProtein) || 0,
        carbs_g: parseFloat(manualCarbs) || 0,
        fat_g: parseFloat(manualFat) || 0,
      }),
    });
    setShowManual(false);
    setManualName(''); setManualCal('');
    setManualProtein(''); setManualCarbs(''); setManualFat('');
    fetchDaily();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiMime(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setAiImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeWithAi = async () => {
    if (!aiImage) return;
    setAiAnalyzing(true);
    setStepInfo(null);
    try {
      const analyzeRes = await fetch('/api/nutrition/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: aiImage, mimeType: aiMime }),
      });
      const result = await analyzeRes.json();

      // Save
      await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal_type: aiMealType,
          food_name: result.food_name,
          calories: result.calories,
          protein_g: result.protein_g,
          carbs_g: result.carbs_g,
          fat_g: result.fat_g,
        }),
      });

      // Get steps
      const stepsRes = await fetch('/api/nutrition/steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calories: result.calories }),
      });
      if (stepsRes.ok) setStepInfo(await stepsRes.json());

      setShowAi(false);
      setAiImage(null);
      fetchDaily();
    } finally {
      setAiAnalyzing(false);
    }
  };

  const deleteLog = async (id: string) => {
    await fetch(`/api/nutrition?id=${id}`, { method: 'DELETE' });
    fetchDaily();
  };

  const totalMacro = (key: string) => {
    if (!daily) return 0;
    return (daily as any)[key] || 0;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Nutrition</h1>
          <p className="text-xs text-gray-500 mt-0.5">Food tracking & AI photo analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="gradient" size="sm" onClick={() => setShowAi(true)}>📷 AI Analyze</Button>
          <Button variant="secondary" size="sm" onClick={() => setShowManual(true)}>+ Manual</Button>
        </div>
      </div>

      {/* Daily summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="glass rounded-xl px-3 py-3 text-center">
          <p className="text-[10px] text-gray-600 tracking-wide uppercase">Calories</p>
          <p className="mt-1 text-lg font-bold text-white">{daily?.total_calories || 0}</p>
          <p className="text-[10px] text-gray-700">kcal</p>
        </div>
        <div className="glass rounded-xl px-3 py-3 text-center">
          <p className="text-[10px] text-gray-600 tracking-wide uppercase">Protein</p>
          <p className="mt-1 text-lg font-bold text-rose-400">{totalMacro('total_protein')}g</p>
        </div>
        <div className="glass rounded-xl px-3 py-3 text-center">
          <p className="text-[10px] text-gray-600 tracking-wide uppercase">Carbs</p>
          <p className="mt-1 text-lg font-bold text-amber-400">{totalMacro('total_carbs')}g</p>
        </div>
        <div className="glass rounded-xl px-3 py-3 text-center">
          <p className="text-[10px] text-gray-600 tracking-wide uppercase">Fat</p>
          <p className="mt-1 text-lg font-bold text-blue-400">{totalMacro('total_fat')}g</p>
        </div>
      </div>

      {/* Meal timeline */}
      <Card className="!p-0">
        <div className="px-4 py-3 border-b border-white/[0.03]">
          <h3 className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Today's Meals</h3>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {(!daily?.meals || daily.meals.length === 0) ? (
            <p className="px-4 py-8 text-center text-xs text-gray-600">
              No meals logged today. Take a photo or add manually.
            </p>
          ) : (
            daily.meals.map((meal) => (
              <div key={meal.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-white/[0.02] transition-colors">
                <div className={`h-2 w-2 rounded-full ${
                  meal.meal_type === 'breakfast' ? 'bg-amber-400' :
                  meal.meal_type === 'lunch' ? 'bg-orange-400' :
                  meal.meal_type === 'dinner' ? 'bg-indigo-400' : 'bg-gray-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{meal.food_name}</p>
                  <p className="text-[10px] text-gray-600 capitalize">{meal.meal_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{meal.calories}</p>
                  <p className="text-[10px] text-gray-600">{meal.protein_g}p • {meal.carbs_g}c • {meal.fat_g}f</p>
                </div>
                <button onClick={() => deleteLog(meal.id)} className="shrink-0 p-1 text-gray-700 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all text-xs">✕</button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* ── Manual Modal ── */}
      {showManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowManual(false)}>
          <div className="glass-strong rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-white mb-4">Add Meal</h3>
            <div className="space-y-3">
              <select value={manualType} onChange={(e) => setManualType(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white">
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
              <Input placeholder="Food name" value={manualName} onChange={(e) => setManualName(e.target.value)} />
              <Input placeholder="Calories" type="number" value={manualCal} onChange={(e) => setManualCal(e.target.value)} />
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Protein (g)" type="number" value={manualProtein} onChange={(e) => setManualProtein(e.target.value)} />
                <Input placeholder="Carbs (g)" type="number" value={manualCarbs} onChange={(e) => setManualCarbs(e.target.value)} />
                <Input placeholder="Fat (g)" type="number" value={manualFat} onChange={(e) => setManualFat(e.target.value)} />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowManual(false)}>Cancel</Button>
                <Button size="sm" onClick={addManual}>Save</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Modal ── */}
      {showAi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAi(false)}>
          <div className="glass-strong rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-white mb-4">📷 Analyze Food Photo</h3>
            <div className="space-y-3">
              <select value={aiMealType} onChange={(e) => setAiMealType(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white">
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
              <label className="block">
                <div className="w-full rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-gray-600 cursor-pointer hover:border-indigo-500/40 transition-colors">
                  {aiImage ? '✅ Photo selected' : 'Tap to upload food photo'}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              </label>
              {aiImage && (
                <div className="flex gap-2">
                  <Button variant="gradient" size="sm" className="flex-1" onClick={analyzeWithAi} disabled={aiAnalyzing}>
                    {aiAnalyzing ? 'Analyzing...' : 'Analyze'}
                  </Button>
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowAi(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Steps info toast ── */}
      {stepInfo && (
        <div className="fixed bottom-6 right-6 z-50 glass-strong rounded-2xl p-4 max-w-xs animate-fade-in">
          <p className="text-xs text-gray-400">Steps to burn {stepInfo.calories} kcal</p>
          <p className="text-lg font-bold text-white mt-1">{(stepInfo.steps / 1000).toFixed(1)}k steps</p>
          <p className="text-[11px] text-gray-500 mt-1">{stepInfo.duration_min} min walking</p>
          <p className="text-[11px] text-gray-600 mt-1 italic">{stepInfo.note}</p>
        </div>
      )}
    </div>
  );
}
