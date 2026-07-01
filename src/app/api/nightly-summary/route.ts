import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { Telegraf } from 'telegraf';
import { generateText } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    // Auth check — simple bearer token so cron can call it
    const authHeader = req.headers.get('authorization');
    const expected = process.env.NIGHTLY_SECRET;
    if (expected && authHeader !== `Bearer ${expected}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = createServerClient();
    const today = new Date().toISOString().split('T')[0];

    // Fetch today's data
    const [tasksRes, notesRes, foodRes] = await Promise.all([
      db.from('tasks').select('title, status, priority').gte('created_at', today),
      db.from('notes').select('title').gte('created_at', today),
      db.from('food_logs').select('food_name, calories').gte('logged_at', today),
    ]);

    const tasks = tasksRes.data || [];
    const notes = notesRes.data || [];
    const meals = foodRes.data || [];

    const doneTasks = tasks.filter((t: any) => t.status === 'done');
    const pendingTasks = tasks.filter((t: any) => t.status !== 'done');
    const totalCal = meals.reduce((s: number, m: any) => s + (m.calories || 0), 0);

    // Generate nightly summary
    const prompt = `Create a brief, warm nightly summary in Turkish. Today's stats:
- Tasks completed: ${doneTasks.length}
- Tasks pending: ${pendingTasks.length}
- Notes captured: ${notes.length}
- Meals logged: ${meals.length} (${totalCal} kcal total)

Write 2-3 sentences as if you're Batu's personal assistant wrapping up the day. Be encouraging. Use emojis sparingly.`;

    let aiSummary = '';
    try {
      aiSummary = await generateText(prompt, 'You are Batu\'s personal AI assistant. Warm, concise, Turkish.');
    } catch {
      aiSummary = `Gün sonu özeti: ${doneTasks.length} görev tamamlandı, ${pendingTasks.length} görev kaldı. ${meals.length} öğün kaydedildi (${totalCal} kcal).`;
    }

    // Send via Telegram
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (chatId) {
      const message = `🌙 *Gün Sonu Özeti* — ${today}\n\n${aiSummary}\n\n${doneTasks.length > 0 ? `✅ ${doneTasks.length} görev tamamlandı` : ''}${pendingTasks.length > 0 ? `\n⏳ ${pendingTasks.length} görev bekliyor` : ''}${meals.length > 0 ? `\n🍽 ${totalCal} kcal alındı` : '\n🍽 Hiç öğün kaydedilmedi'}`;
      await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }

    return NextResponse.json({ success: true, summary: aiSummary });
  } catch (error) {
    console.error('Nightly summary error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
