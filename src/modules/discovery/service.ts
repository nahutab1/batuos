import { StartupRepository } from './repository';
import type { StartupIdea, CreateStartupIdeaDTO, UpdateStartupIdeaDTO, DiscoveryDiscussion, ChatMessage, DiscoveredIdea } from './types';
import { ServiceResult } from '@/core/types';
import { createToken, container } from '@/core';
import { createServerClient } from '@/lib/supabase';
import { generateText } from '@/lib/gemini';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const STARTUP_SERVICE = createToken<StartupService>('STARTUP_SERVICE');

/** File-based fallback when Supabase tables don't exist */
const DATA_DIR = path.join(process.cwd(), '.data');
const IDEAS_FILE = path.join(DATA_DIR, 'startup_ideas.json');
const DISC_FILE = path.join(DATA_DIR, 'discovery_discussions.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file: string): any[] {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {}
  return [];
}

function writeJson(file: string, data: any[]) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ── Helpers ──

function uuid() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

export class StartupService {
  constructor(private repository = new StartupRepository()) {}

  private async usingSupabase(): Promise<boolean> {
    try {
      const db = createServerClient();
      const { error } = await db.from('startup_ideas').select('id').limit(1);
      return !error; // false if table doesn't exist
    } catch {
      return false;
    }
  }

  // ── CRUD ──

  async getAll(page = 1, pageSize = 50, source?: string): Promise<ServiceResult<{ data: StartupIdea[]; count: number }>> {
    try {
      if (await this.usingSupabase()) {
        const result = await this.repository.getAll(page, pageSize, source);
        return { data: result, error: null };
      }
      // File fallback
      const all = readJson(IDEAS_FILE) as StartupIdea[];
      const filtered = source ? all.filter(i => i.source === source) : all;
      const sorted = filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const start = (page - 1) * pageSize;
      return { data: { data: sorted.slice(start, start + pageSize), count: sorted.length }, error: null };
    } catch (error) {
      return { data: { data: [], count: 0 }, error: (error as Error).message };
    }
  }

  async getById(id: string): Promise<ServiceResult<StartupIdea>> {
    try {
      if (await this.usingSupabase()) return await this.repository.getById(id);
      const all = readJson(IDEAS_FILE) as StartupIdea[];
      const found = all.find(i => i.id === id);
      return found ? { data: found, error: null } : { data: null, error: 'Not found' };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  }

  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      if (await this.usingSupabase()) return await this.repository.delete(id);
      const all = readJson(IDEAS_FILE).filter((i: any) => i.id !== id);
      writeJson(IDEAS_FILE, all);
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  }

  // ── Discovery Agent ──

  async runDiscovery(): Promise<ServiceResult<{ added: number; skipped: number }>> {
    try {
      let added = 0;
      let skipped = 0;

      const results = await Promise.allSettled([
        this.fetchHN().then(ideas => ({ source: 'Hacker News', ideas })),
        this.fetchGitHubTrending().then(ideas => ({ source: 'GitHub Trending', ideas })),
        this.fetchProductHunt().then(ideas => ({ source: 'Product Hunt', ideas })),
      ]);

      for (const result of results) {
        if (result.status === 'rejected') {
          console.error('[Discovery] Fetcher failed:', result.reason);
          continue;
        }
        const { ideas } = result.value;
        for (const idea of ideas) {
          try {
            if (await this.usingSupabase()) {
              const existing = await this.repository.getByHash(idea.duplicate_hash);
              if (existing) { skipped++; continue; }
              const saveResult = await this.repository.create({ ...idea });
              if (!saveResult.error) added++;
            } else {
              const all = readJson(IDEAS_FILE) as StartupIdea[];
              if (all.some(i => i.duplicate_hash === idea.duplicate_hash)) { skipped++; continue; }
              all.unshift({
                id: uuid(),
                ...idea,
                metadata: {},
                engagement_score: 0,
                created_at: now(),
                updated_at: now(),
              } as StartupIdea);
              writeJson(IDEAS_FILE, all);
              added++;
            }
          } catch (e) {
            console.error('[Discovery] Save failed:', e);
          }
        }
      }

      return { data: { added, skipped }, error: null };
    } catch (error) {
      return { data: { added: 0, skipped: 0 }, error: (error as Error).message };
    }
  }

  /** List available sources */
  getSources(): { name: string; url: string }[] {
    return [
      { name: 'Hacker News', url: 'https://news.ycombinator.com/' },
      { name: 'GitHub Trending', url: 'https://github.com/trending' },
      { name: 'Product Hunt', url: 'https://www.producthunt.com/' },
    ];
  }

  // ── HN API ──

  private async fetchHN(): Promise<DiscoveredIdea[]> {
    try {
      const idsRes = await fetch('https://hacker-news.firebaseio.com/v0/newstories.json');
      const ids: number[] = await idsRes.json();
      const items = await Promise.all(
        ids.slice(0, 20).map(async (id) => {
          const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          return res.json();
        })
      );
      return items
        .filter((item: any) => item?.title && item?.url && item?.type === 'story')
        .slice(0, 8)
        .map((item: any) => ({
          name: item.title.substring(0, 120),
          description: item.title,
          source: 'Hacker News',
          source_urls: [item.url],
          problem_solved: '',
          target_audience: '',
          business_model: 'Other',
          why_noteworthy: `HN score: ${item.score || 0}`,
          age_label: 'new' as const,
          duplicate_hash: crypto.createHash('md5').update(item.title).digest('hex'),
          first_seen_at: new Date((item.time || 0) * 1000).toISOString(),
        }));
    } catch (e) {
      console.error('[Discovery] HN fetch failed:', e);
      return [];
    }
  }

  // ── GitHub API ──

  private async fetchGitHubTrending(): Promise<DiscoveredIdea[]> {
    try {
      const res = await fetch('https://api.github.com/search/repositories?q=created:>2026-01-01+stars:>50&sort=stars&order=desc&per_page=10', {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'BatuOS-Discovery/1.0' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.items || []).slice(0, 8).map((item: any) => ({
        name: item.full_name,
        description: item.description || item.full_name,
        source: 'GitHub Trending',
        source_urls: [item.html_url],
        problem_solved: '',
        target_audience: 'Developers',
        business_model: 'DevTool' as const,
        why_noteworthy: `${item.stargazers_count} stars, ${item.forks_count} forks`,
        age_label: 'new' as const,
        duplicate_hash: crypto.createHash('md5').update(item.full_name + (item.description || '')).digest('hex'),
        first_seen_at: item.created_at,
      }));
    } catch (e) {
      console.error('[Discovery] GitHub fetch failed:', e);
      return [];
    }
  }

  // ── Product Hunt API ──

  private async fetchProductHunt(): Promise<DiscoveredIdea[]> {
    try {
      const res = await fetch('https://api.producthunt.com/v2/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'BatuOS-Discovery/1.0',
        },
        body: JSON.stringify({
          query: `{ posts(first: 10, order: NEWEST) { nodes { id name tagline url votesCount createdAt description } } }`,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      const posts = data?.data?.posts?.nodes || [];
      return posts.slice(0, 8).map((post: any) => ({
        name: post.name,
        description: post.tagline || post.description || post.name,
        source: 'Product Hunt',
        source_urls: [post.url],
        problem_solved: '',
        target_audience: '',
        business_model: 'Other',
        why_noteworthy: `${post.votesCount || 0} upvotes`,
        age_label: 'new' as const,
        duplicate_hash: crypto.createHash('md5').update(post.name + (post.tagline || '')).digest('hex'),
        first_seen_at: post.createdAt,
      }));
    } catch (e) {
      console.error('[Discovery] PH fetch failed:', e);
      return [];
    }
  }

  // ── Discussion Agent ──

  async startDiscussion(startupId: string, userMessage: string): Promise<ServiceResult<DiscoveryDiscussion>> {
    try {
      let startup: StartupIdea | null = null;
      let disc: DiscoveryDiscussion | null = null;

      if (await this.usingSupabase()) {
        const idea = await this.repository.getById(startupId);
        if (idea.error || !idea.data) return { data: null, error: idea.error || 'Not found' };
        startup = idea.data;

        let d = await this.repository.getDiscussion(startupId);
        if (d.error || !d.data) {
          const created = await this.repository.createDiscussion(startupId);
          if (created.error) return created;
          d = created;
        }
        disc = d.data as DiscoveryDiscussion;
      } else {
        const all = readJson(IDEAS_FILE) as StartupIdea[];
        startup = all.find(i => i.id === startupId) || null;
        if (!startup) return { data: null, error: 'Not found' };

        const discussions = readJson(DISC_FILE);
        disc = discussions.find((d: any) => d.startup_id === startupId) || null;
        if (!disc) {
          disc = { id: uuid(), startup_id: startupId, messages: [], created_at: now(), updated_at: now() };
          discussions.push(disc);
          writeJson(DISC_FILE, discussions);
        }
      }

      if (!disc || !startup) return { data: null, error: 'Failed to initialize discussion' };

      const userMsg: ChatMessage = { role: 'user', content: userMessage, timestamp: now() };
      const newMessages = [...(disc.messages || []), userMsg];

      const aiResponse = await this.generateDiscussionResponse(startup, disc.messages, userMessage);
      const assistantMsg: ChatMessage = { role: 'assistant', content: aiResponse, timestamp: now() };
      const finalMessages = [...newMessages, assistantMsg];

      if (await this.usingSupabase()) {
        return await this.repository.addMessage(startupId, assistantMsg);
      } else {
        const discussions = readJson(DISC_FILE);
        const idx = discussions.findIndex((d: any) => d.startup_id === startupId);
        if (idx >= 0) {
          discussions[idx].messages = finalMessages;
          discussions[idx].updated_at = now();
        } else {
          discussions.push({ id: uuid(), startup_id: startupId, messages: finalMessages, created_at: now(), updated_at: now() });
        }
        writeJson(DISC_FILE, discussions);
        return { data: { id: disc.id, startup_id: startupId, messages: finalMessages, created_at: disc.created_at, updated_at: now() } as DiscoveryDiscussion, error: null };
      }
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  }

  private async generateDiscussionResponse(startup: StartupIdea, history: ChatMessage[], userMessage: string): Promise<string> {
    const context = `
You are analyzing a startup idea. Here are the details:

Name: ${startup.name}
Description: ${startup.description || 'N/A'}
Source: ${startup.source}
Problem Solved: ${startup.problem_solved || 'N/A'}
Target Audience: ${startup.target_audience || 'N/A'}
Business Model: ${startup.business_model || 'N/A'}
Why Noteworthy: ${startup.why_noteworthy || 'N/A'}
First Seen: ${startup.first_seen_at || 'Unknown'}

Your role is NOT to give information — you are a discussion partner. Ask thoughtful questions, challenge assumptions, and help the user think critically about this idea.

Topics you can explore:
- Why could this succeed?
- Biggest risks?
- Would it work in specific markets (e.g. Turkey)?
- Global market potential?
- Competitors?
- How could AI improve it?
- Differentiation strategies?
- How to find first customers?

Keep the conversation natural. Ask the user questions. Don't write essays. Don't repeat the startup info unless asked.`;

    const historyText = history.slice(-10).map((m) => `${m.role === 'user' ? 'User' : 'You'}: ${m.content}`).join('\n');

    const prompt = `Context:\n${context}\n\nConversation so far:\n${historyText}\n\nUser: ${userMessage}\n\nRespond naturally — be thoughtful, ask questions, and push the user to think deeper. Keep it concise (2-4 sentences).`;

    return await generateText(prompt, 'You are a thoughtful, Socratic discussion partner. You ask sharp questions and challenge ideas, but stay friendly and curious. Write in Turkish if the user writes in Turkish, otherwise English.');
  }
}
