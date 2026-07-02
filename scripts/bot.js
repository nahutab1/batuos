/**
 * BatuOS Telegram Bot — polling mode
 *
 * Çalıştır: node scripts/bot.js
 * (next start ile aynı anda çalışır)
 *
 * Ses kaydı → AI analiz → otomatik kategorilendirme (task/note/goal/memory/food)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env.local') });
const { Telegraf } = require('telegraf');
const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
);

function getChatId(ctx) {
  return ctx.chat?.id?.toString();
}

const BASE_URL = process.env.BATUOS_URL || 'http://localhost:3000';

// ── Start ──
bot.start((ctx) => {
  ctx.reply('👋 BatuOS\'a hoş geldin!\n\n🎤 Ses kaydı gönder → AI analiz etsin\n📷 Yemek fotoğrafı → kalori hesaplasın\n✏️ /task /note /goal ile hızlı ekle');
});

bot.help((ctx) => {
  ctx.reply('/task [metin] - Görev ekle\n/note [metin] - Not ekle\n/goal [metin] - Hedef ekle\n\n🎤 Ses kaydı → otomatik sınıflandırma\n📷 Yemek fotoğrafı → kalori analizi');
});

// ── Ses kaydı handler ──
bot.on('voice', async (ctx) => {
  const voice = ctx.message.voice;
  if (!voice) return;

  ctx.reply('🎤 Ses kaydı alındı, çözümleniyor...');

  try {
    const fileLink = await ctx.telegram.getFileLink(voice.file_id);
    const response = await fetch(fileLink.href);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    const prompt = `You are BatuOS, a personal AI assistant. Analyze this voice recording.

Classify into EXACTLY ONE category:
- "task" — something to DO (call, buy, finish, fix, complete)
- "note" — something to KNOW (idea, thought, information)
- "goal" — something to ACHIEVE (want to, aim to, target)
- "memory" — something ABOUT YOU (I like, I am, my favorite)
- "food" — about eating, nutrition, meals

Return ONLY raw JSON:
{"category": "task|note|goal|memory|food", "title": "short title", "content": "full content"}

Be accurate. A task is DO. A note is KNOW. A goal is ACHIEVE. Memory is ABOUT YOU.`;

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

    switch (category) {
      case 'task': {
        const { error } = await db.from('tasks').insert({ title, description: content, status: 'todo' });
        if (error) throw error;
        fetch(BASE_URL + '/api/ai/reprioritize', { method: 'POST' }).catch(() => {});
        ctx.reply(`✅ *Task eklendi:* ${title}`, { parse_mode: 'Markdown' });
        break;
      }
      case 'note': {
        await db.from('notes').insert({ title: title.substring(0, 60), content, tags: ['voice'] });
        ctx.reply(`📝 *Not kaydedildi:* ${title}`, { parse_mode: 'Markdown' });
        break;
      }
      case 'goal': {
        await db.from('goals').insert({ title, status: 'active' });
        ctx.reply(`🎯 *Hedef eklendi:* ${title}`, { parse_mode: 'Markdown' });
        break;
      }
      case 'food': {
        await db.from('food_logs').insert({ meal_type: 'snack', food_name: title, calories: 0, notes: content });
        ctx.reply(`🍽 *Yemek kaydedildi:* ${title}`, { parse_mode: 'Markdown' });
        break;
      }
      default: {
        await db.from('memories').insert({ fact: content, source: 'telegram_voice' });
        ctx.reply(`🧠 *Hafızaya kaydedildi:* ${title}`, { parse_mode: 'Markdown' });
      }
    }
  } catch (err) {
    console.error('Voice error:', err.message);
    ctx.reply('❌ Ses analiz edilemedi. Kısa ve net konuşmaya çalış.');
  }
});

// ── Yemek fotoğrafı ──
bot.on('photo', async (ctx) => {
  const photos = ctx.message.photo;
  if (!photos || photos.length === 0) return;

  ctx.reply('🔍 Yemek analiz ediliyor...');

  try {
    const largest = photos[photos.length - 1];
    const fileLink = await ctx.telegram.getFileLink(largest.file_id);
    const response = await fetch(fileLink.href);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    const prompt = `Analyze this food photo. Return raw JSON: {"food_name": "...", "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number}`;

    const geminiRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: base64 } }],
      config: { temperature: 0.15, maxOutputTokens: 300 },
    });

    const cleaned = (geminiRes.text ?? '').replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const cal = Number(parsed.calories) || 0;
    const steps = Math.round(cal * 25);
    const minutes = Math.round(steps / 100);

    await db.from('food_logs').insert({
      meal_type: 'snack', food_name: String(parsed.food_name || 'Unknown'),
      calories: cal, protein_g: Number(parsed.protein_g) || 0,
      carbs_g: Number(parsed.carbs_g) || 0, fat_g: Number(parsed.fat_g) || 0,
    });

    ctx.reply(
      `🍽 *${parsed.food_name}*\nKalori: ${cal}\n${parsed.protein_g || 0}g protein • ${parsed.carbs_g || 0}g karbonhidrat • ${parsed.fat_g || 0}g yağ\n\n🚶 Yakmak için: ~${(steps / 1000).toFixed(1)}k adım (${minutes} dk)`,
      { parse_mode: 'Markdown' }
    );
  } catch {
    ctx.reply('❌ Fotoğraf analiz edilemedi.');
  }
});

// ── Text handler ──
bot.command('task', async (ctx) => {
  const text = ctx.message.text.replace('/task', '').trim();
  if (!text) { ctx.reply('Task detaylarını yaz.'); return; }
  ctx.reply('🤖 İşleniyor...');
  try {
    const res = await fetch(BASE_URL + '/api/tasks/ai', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const data = await res.json();
    ctx.reply(`✅ Task eklendi: ${data.title}`);
    fetch(BASE_URL + '/api/ai/reprioritize', { method: 'POST' }).catch(() => {});
  } catch (e) {
    ctx.reply('❌ Hata: ' + e.message);
  }
});

bot.command('note', async (ctx) => {
  const text = ctx.message.text.replace('/note', '').trim();
  if (!text) { ctx.reply('Not içeriğini yaz.'); return; }
  await db.from('notes').insert({ title: text.split(' ').slice(0, 4).join(' ') + '...', content: text, tags: ['telegram'] });
  ctx.reply('📝 Not kaydedildi.');
});

bot.command('goal', async (ctx) => {
  const text = ctx.message.text.replace('/goal', '').trim();
  if (!text) { ctx.reply('Hedef adını yaz.'); return; }
  await db.from('goals').insert({ title: text, status: 'active' });
  ctx.reply('🎯 Hedef eklendi.');
});

bot.on('text', async (ctx) => {
  const raw = ctx.message.text.trim().toLowerCase();
  if (raw.startsWith('task:') || raw.startsWith('/task')) return;
  if (raw.startsWith('note:') || raw.startsWith('/note')) return;
  if (raw.startsWith('goal:') || raw.startsWith('/goal')) return;
  // Varsayılan: memory
  await db.from('memories').insert({ fact: ctx.message.text, source: 'telegram' });
  ctx.reply('🧠 Hafızaya kaydedildi.');
});

// ── Start polling ──
bot.telegram.deleteWebhook().then(() => {
  return bot.launch();
}).then(() => {
  console.log('🤖 BatuOS Bot polling başladı!');

  // ── Gece 23:55'te nightly summary gönder ──
  const scheduleNightly = () => {
    const now = new Date();
    const target = new Date(now);
    target.setHours(23, 55, 0, 0); // 23:55
    if (now > target) target.setDate(target.getDate() + 1); // yarına ata
    const msUntilTarget = target.getTime() - now.getTime();

    console.log(`⏰ Gece özeti: ${Math.round(msUntilTarget / 60000)} dk sonra (${target.toLocaleString()})`);

    setTimeout(async () => {
      console.log('🌙 Gece özeti gönderiliyor...');
      try {
        const SECRET = process.env.NIGHTLY_SECRET || 'batuos-nightly-secret-2026';
        const BASE = process.env.BATUOS_URL || 'http://localhost:3000';
        const res = await fetch(`${BASE}/api/nightly-summary`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${SECRET}`, 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (res.ok) console.log(`✅ Gece özeti gönderildi: ${data.stats?.done || 0} done, ${data.stats?.pending || 0} pending`);
        else console.error('❌ Gece özeti hatası:', data.error);
      } catch (e) {
        console.error('❌ Gece özeti başarısız:', e.message);
      }
      // Her gün tekrar et
      scheduleNightly();
    }, msUntilTarget);
  };

  scheduleNightly();
}).catch(err => {
  console.error('Bot başlatılamadı:', err.message);
});

// Unhandled rejection/exception → bot'u öldürme
process.on('unhandledRejection', (err) => console.error('Unhandled:', err?.message));
process.on('uncaughtException', (err) => console.error('Uncaught:', err?.message));

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
