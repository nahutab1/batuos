import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { Telegraf } from 'telegraf';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const expected = process.env.NIGHTLY_SECRET;
    if (expected && authHeader !== `Bearer ${expected}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = createServerClient();
    const today = new Date().toISOString().split('T')[0];

    // Fetch tasks sorted by priority (highest first)
    const { data: tasks, error: tasksErr } = await db
      .from('tasks')
      .select('title, status, priority')
      .order('priority', { ascending: false });

    if (tasksErr) throw tasksErr;

    const doneTasks = tasks.filter((t: any) => t.status === 'done');
    const pendingTasks = tasks.filter((t: any) => t.status !== 'done');

    // Fetch notes + food for context
    const [notesRes, foodRes] = await Promise.all([
      db.from('notes').select('title').gte('created_at', today),
      db.from('food_logs').select('food_name, calories').gte('logged_at', today),
    ]);
    const notes = notesRes.data || [];
    const meals = foodRes.data || [];
    const totalCal = meals.reduce((s: number, m: any) => s + (m.calories || 0), 0);

    // Build task list — priority sorted
    let taskList = '';
    if (pendingTasks.length > 0) {
      taskList = '\n\n📋 *Bekleyen Görevler:*\n';
      pendingTasks.slice(0, 15).forEach((t: any, i: number) => {
        const p = t.priority || 0;
        const emoji = p > 75 ? '🔴' : p > 40 ? '🟡' : '⚪';
        taskList += `${i + 1}. ${emoji} ${t.title} (P${p})\n`;
      });
      if (pendingTasks.length > 15) {
        taskList += `...ve ${pendingTasks.length - 15} görev daha\n`;
      }
    }

    // Build Telegram message
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (chatId) {
      const header = `🌙 *Gün Sonu — ${today}*\n\n`;
      const stats = `✅ ${doneTasks.length} tamamlandı\n⏳ ${pendingTasks.length} bekliyor\n📝 ${notes.length} not\n🍽 ${totalCal} kcal`;
      const message = header + stats + taskList;
      await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }

    return NextResponse.json({
      success: true,
      stats: { done: doneTasks.length, pending: pendingTasks.length, notes: notes.length, calories: totalCal },
    });
  } catch (error) {
    console.error('Nightly summary error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
