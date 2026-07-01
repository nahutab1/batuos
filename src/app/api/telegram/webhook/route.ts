import { Telegraf, Context } from 'telegraf';
import { GoogleGenAI } from '@google/genai';
import { parseNaturalLanguageTask } from '@/lib/gemini';
import { createServerClient } from '@/lib/supabase';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.start((ctx) => {
  ctx.reply('👋 Welcome to BatuOS!\n\nSend me a message to save it to Memory.\n\nCommands:\n/task [text] - Add an AI parsed task\n/note [text] - Add a quick note\n/goal [text] - Add a new goal');
});

bot.help((ctx) => {
  ctx.reply('BatuOS Bot Help:\n\n- Prefix with "task:" or "/task" to add a task.\n- Prefix with "note:" or "/note" to add a note.\n- Prefix with "goal:" or "/goal" to add a goal.\n- Send a food photo to analyze calories.\n- Everything else goes to your Memory stream.');
});

// ── Voice message handler ──
bot.on('voice', async (ctx) => {
  const voice = ctx.message.voice;
  if (!voice) return;

  ctx.reply('🎤 Ses kaydı alındı, çözümleniyor...');

  try {
    // Get voice file from Telegram
    const fileLink = await ctx.telegram.getFileLink(voice.file_id);
    const response = await fetch(fileLink.href);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Gemini'ye gönder — sesi analiz et ve türünü belirle
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const prompt = `You are BatuOS, a personal AI assistant. Analyze this voice recording transcript.

Classify the message into ONE of these categories:
- "task" — if it's something to do, a reminder, an action item, a to-do (e.g. "call the client", "buy milk", "finish the report")
- "note" — if it's an idea, a thought to save, information to remember (e.g. "I think AI will transform education", "meeting notes")
- "goal" — if it's an objective, a target, something to achieve (e.g. "I want to lose 10kg", "learn TypeScript this month")
- "memory" — if it's a personal fact, a memory, something about yourself (e.g. "I love reading", "my favorite color is blue")
- "food" — if it's about what you ate, nutrition, diet, calories (e.g. "I had chicken salad for lunch")

Return ONLY a raw JSON object (no markdown):
{
  "category": "task|note|goal|memory|food",
  "title": "short title (max 60 chars)",
  "content": "full content or description",
  "reasoning": "why you chose this category"
}

CRITICAL: Be accurate. A task is something to DO. A note is something to KNOW. A goal is something to ACHIEVE. A memory is something about YOU. Food is about EATING.`;

    const geminiRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { text: prompt },
        { inlineData: { mimeType: voice.mime_type || 'audio/ogg', data: base64 } },
      ],
      config: { temperature: 0.1, maxOutputTokens: 300 },
    });

    const text = geminiRes.text ?? '';
    const cleaned = text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const category = parsed.category || 'memory';
    const title = parsed.title || 'Ses kaydı';
    const content = parsed.content || title;

    const db = createServerClient();

    switch (category) {
      case 'task': {
        const { error } = await db.from('tasks').insert({ title, description: content, status: 'todo' });
        if (error) throw error;
        // Auto-reprioritize
        fetch('http://localhost:3000/api/ai/reprioritize', { method: 'POST' }).catch(() => {});
        ctx.reply(`✅ *Task eklendi:* ${title}`, { parse_mode: 'Markdown' });
        break;
      }
      case 'note': {
        const { error } = await db.from('notes').insert({ title: title.substring(0, 60), content, tags: ['voice'] });
        if (error) throw error;
        ctx.reply(`📝 *Not kaydedildi:* ${title}`, { parse_mode: 'Markdown' });
        break;
      }
      case 'goal': {
        const { error } = await db.from('goals').insert({ title, status: 'active' });
        if (error) throw error;
        ctx.reply(`🎯 *Hedef eklendi:* ${title}`, { parse_mode: 'Markdown' });
        break;
      }
      case 'food': {
        const { error } = await db.from('food_logs').insert({
          meal_type: 'snack', food_name: title, calories: 0, notes: content, logged_at: new Date().toISOString(),
        });
        if (error) throw error;
        ctx.reply(`🍽 *Yemek kaydedildi:* ${title}`, { parse_mode: 'Markdown' });
        break;
      }
      default: {
        const { error } = await db.from('memories').insert({ fact: content, source: 'telegram_voice' });
        if (error) throw error;
        ctx.reply(`🧠 *Hafızaya kaydedildi:* ${title}`, { parse_mode: 'Markdown' });
      }
    }
  } catch (err) {
    console.error('Voice analysis error:', err);
    ctx.reply('❌ Ses analiz edilemedi. Lütfen tekrar dene.');
  }
});

// ── Food photo handler ──
bot.on('photo', async (ctx) => {
  const photos = ctx.message.photo;
  if (!photos || photos.length === 0) return;

  ctx.reply('🔍 Analyzing food photo...');

  try {
    // Get the largest photo
    const largest = photos[photos.length - 1];
    const fileLink = await ctx.telegram.getFileLink(largest.file_id);
    const response = await fetch(fileLink.href);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = 'image/jpeg';

    // Call Gemini Vision
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const prompt = `Analyze this food photo. Return a raw JSON object (no markdown) with keys: food_name (string), calories (number), protein_g (number), carbs_g (number), fat_g (number). Give your best estimate.`;

    const geminiRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { text: prompt },
        { inlineData: { mimeType, data: base64 } },
      ],
      config: { temperature: 0.15, maxOutputTokens: 300 },
    });

    const text = geminiRes.text ?? '';
    const cleaned = text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Save to food_logs
    const db = createServerClient();
    const { error } = await db.from('food_logs').insert({
      meal_type: 'snack',
      food_name: String(parsed.food_name || 'Unknown'),
      calories: Number(parsed.calories) || 0,
      protein_g: Number(parsed.protein_g) || 0,
      carbs_g: Number(parsed.carbs_g) || 0,
      fat_g: Number(parsed.fat_g) || 0,
      notes: 'via Telegram',
    });

    if (error) throw error;

    // Calculate steps
    const cal = Number(parsed.calories) || 0;
    const steps = Math.round(cal * 25);
    const minutes = Math.round(steps / 100);

    ctx.reply(
      `🍽 *${parsed.food_name || 'Unknown'}*\nCalories: *${cal}* kcal\n${parsed.protein_g || 0}g protein • ${parsed.carbs_g || 0}g carbs • ${parsed.fat_g || 0}g fat\n\n🚶 Burn this off: ~${(steps / 1000).toFixed(1)}k steps (${minutes} min walk)`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Food photo analysis error:', err);
    ctx.reply('❌ Could not analyze the photo. Please try again.');
  }
});

function extractText(ctx: Context): string | null {
  const message = ctx.message as { text?: string } | undefined;
  if (!message?.text) return null;
  const raw = message.text;

  // Try /command prefix first
  const cmdMatch = raw.match(/^\/(task|note|goal)\s+(.*)/i);
  if (cmdMatch) return cmdMatch[2];

  // Try "task:" / "note:" / "goal:" prefix
  const prefixMatch = raw.match(/^(task|note|goal):\s*(.*)/i);
  if (prefixMatch && prefixMatch[2]) return prefixMatch[2];

  // No prefix, return full text
  return raw;
}

async function handleTaskInput(ctx: Context): Promise<void> {
  const text = extractText(ctx);

  if (!text) {
    ctx.reply('Please provide task details.');
    return;
  }

  ctx.reply('🤖 Parsing task...');
  const db = createServerClient();

  try {
    const parsed = await parseNaturalLanguageTask(text);
    const { error } = await db.from('tasks').insert({
      title: parsed.title,
      description: parsed.description,
      due_date: parsed.due_date || null,
      status: 'todo'
    });
    if (error) throw error;
    ctx.reply(`✅ Task added: ${parsed.title}`);

    // Auto-reprioritize
    try {
      const { prioritizeTasks } = await import('@/lib/gemini');
      const { data: tasks } = await db.from('tasks').select('id,title').eq('status', 'todo');
      if (tasks && tasks.length > 1) {
        const priorities = await prioritizeTasks(tasks);
        for (const p of priorities) {
          await db.from('tasks').update({ priority: p.priority }).eq('id', p.id);
        }
      }
    } catch (reErr) {
      console.error('Auto-reprioritize error:', reErr);
    }
  } catch (err: any) {
    ctx.reply(`❌ Task error: ${err.message}`);
  }
}

async function handleNoteInput(ctx: Context): Promise<void> {
  const text = extractText(ctx);

  if (!text) {
    ctx.reply('Please provide note content.');
    return;
  }

  const db = createServerClient();
  try {
    const title = text.split(' ').slice(0, 4).join(' ') + '...';
    const { error } = await db.from('notes').insert({
      title,
      content: text,
      tags: ['telegram']
    });
    if (error) throw error;
    ctx.reply('📝 Note saved.');
  } catch (err: any) {
    ctx.reply(`❌ Note error: ${err.message}`);
  }
}

async function handleGoalInput(ctx: Context): Promise<void> {
  const text = extractText(ctx);

  if (!text) {
    ctx.reply('Please provide goal title.');
    return;
  }

  const db = createServerClient();
  try {
    const { error } = await db.from('goals').insert({
      title: text,
      status: 'active'
    });
    if (error) throw error;
    ctx.reply('🎯 Goal added.');
  } catch (err: any) {
    ctx.reply(`❌ Goal error: ${err.message}`);
  }
}

bot.command('task', handleTaskInput);
bot.command('note', handleNoteInput);
bot.command('goal', handleGoalInput);

bot.on('text', async (ctx) => {
  const message = ctx.message as { text?: string } | undefined;
  const raw = message?.text?.trim() || '';

  if (raw.toLowerCase().startsWith('task:') || raw.toLowerCase().startsWith('/task')) {
    await handleTaskInput(ctx);
    return;
  }
  if (raw.toLowerCase().startsWith('note:') || raw.toLowerCase().startsWith('/note')) {
    await handleNoteInput(ctx);
    return;
  }
  if (raw.toLowerCase().startsWith('goal:') || raw.toLowerCase().startsWith('/goal')) {
    await handleGoalInput(ctx);
    return;
  }

  // Default: Save to memory
  const db = createServerClient();
  try {
    const { error } = await db.from('memories').insert({
      fact: raw,
      source: 'telegram'
    });
    if (error) throw error;
    ctx.reply('🧠 Saved to Memory.');
  } catch (err: any) {
    ctx.reply(`❌ Failed to save memory: ${err.message}`);
  }
});

export async function POST(req: Request) {
  // Telegram sends secret_token as X-Telegram-Bot-Api-Secret-Token header
  const secretHeader = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secretHeader !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Telegram webhook error:', err);
    return new Response('Error', { status: 500 });
  }
}
