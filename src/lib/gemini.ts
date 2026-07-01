import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODEL = 'gemini-2.5-flash';

// ── Simple in-memory rate-limit cache ──
let lastCallTime = 0;
const MIN_INTERVAL_MS = 2000; // 2s between calls — safe for free tier

async function rateLimitedCall(prompt: string, systemInstruction: string): Promise<string> {
  const now = Date.now();
  const wait = MIN_INTERVAL_MS - (now - lastCallTime);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastCallTime = Date.now();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.2,
    },
  });

  return response.text ?? '';
}

export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  const instruction = systemInstruction || 'You are BatuOS, a personal productivity AI assistant.';

  try {
    return await rateLimitedCall(prompt, instruction);
  } catch (error: any) {
    const msg = error?.message || '';
    const isQuota = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate');

    if (isQuota) {
      console.error('Gemini quota exhausted — using fallback response');
    } else {
      console.error('Gemini API error:', error);
    }

    return '';
  }
}

export async function prioritizeTasks(
  tasks: Array<{ id: string; title: string; description?: string; due_date?: string }>
): Promise<Array<{ id: string; priority: number; reasoning: string }>> {
  if (tasks.length === 0) return [];

  const prompt = `Evaluate the following list of tasks and assign a priority score to each from 0 to 100 (where 100 is the most urgent).
Consider due dates (closer = higher priority) and semantic urgency implied by the title/description.

Tasks:
${JSON.stringify(tasks, null, 2)}

Return ONLY a raw, valid JSON array containing objects with keys "id", "priority" (number), and "reasoning" (short string). Do NOT wrap in markdown \`\`\`json blocks.`;

  const result = await generateText(prompt, 'You are an analytical task prioritization engine. Output only strict JSON.');

  try {
    const cleaned = result.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("AI Prioritization parsing failed:", result);
    return tasks.map((t) => ({ id: t.id, priority: 50, reasoning: 'AI failed to parse' }));
  }
}

export async function parseNaturalLanguageTask(
  text: string
): Promise<{ title: string; description: string; due_date?: string; priority?: number }> {
  const today = new Date().toISOString();
  const prompt = `Parse the following natural language text into a structured task.
Current date/time (UTC): ${today}

Rules:
1. Extract a concise "title" (max 60 chars).
2. Put extra details into "description".
3. If a relative time is mentioned (e.g., "tomorrow", "next week", "in 2 days"), convert it to an absolute ISO 8601 date string for "due_date".
4. If no time is mentioned, "due_date" should be null.

Input text: "${text}"

Return ONLY a raw, valid JSON object with keys "title" (string), "description" (string), and "due_date" (string or null). Do NOT wrap in markdown \`\`\`json blocks.`;

  const result = await generateText(prompt, 'You are a strict data extraction AI. Output only valid JSON.');

  try {
    const cleaned = result.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      title: parsed.title || text,
      description: parsed.description || '',
      due_date: parsed.due_date || undefined,
      priority: parsed.priority
    };
  } catch (e) {
    console.error("AI Task Parsing failed:", result);
    return { title: text, description: '' };
  }
}

export { ai };
