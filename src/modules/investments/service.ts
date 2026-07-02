import type { DiscoveredAsset, InvestmentAnalysis } from './types';
import { generateText } from '@/lib/gemini';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE = path.join(DATA_DIR, 'investment_discoveries.json');
const ANALYSIS_FILE = path.join(DATA_DIR, 'investment_analyses.json');

function read<T>(f: string): T[] { try { if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf-8')); } catch {} return []; }
function write<T>(f: string, d: T[]) { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(f, JSON.stringify(d, null, 2)); }

export class InvestmentDiscoveryService {
  // ── Run discovery: Gemini scans the web for hidden gems ──
  async runDiscovery(): Promise<{ added: number }> {
    const prompt = `You are an investment discovery AI. Your job is to find UNDISCOVERED, EARLY-STAGE investment opportunities that are about to break out.

Scan your knowledge for:

1. SMALL-CAP CRYPTO ($5M-$200M market cap) — new L1/L2, DeFi, AI+blockchain projects with growing dev activity
2. MICRO-CAP STOCKS ($50M-$1B) — companies in AI, biotech, clean energy, space, robotics with upcoming catalysts
3. NICHE COMMODITIES — metals/minerals in short supply for tech/manufacturing
4. EMERGING MARKET ETF sub-sectors — before they become mainstream

For each find, return a JSON object with:
- name: string
- symbol: string
- asset_type: "crypto" | "stock" | "commodity" | "etf"
- current_price_estimate: number (approximate current price)
- reason_for_growth: string (2-3 sentences why this could rise)
- risk_factors: string (main risks)
- ai_confidence: number (0-100)
- source: string (where you know this from)
- category_tags: string[] (e.g. ["AI", "DeFi", "Clean Energy", "Biotech"])
- social_buzz: "low" | "medium" | "high" | "very_high"

CRITICAL:
- Only return assets that actually exist. Do NOT make up fake projects.
- Focus on things that are NOT yet mainstream.
- Return 5-10 assets.
- Return ONLY a raw JSON array. No markdown.

Example assets from 2025-2026 that were once undiscovered: TAO, FET, RNDR, KASPA, INJ, ACHR, RKLB, IONQ. Find the NEXT wave.`;

    let result = '';
    try {
      result = await generateText(prompt, 'You are a strict investment research AI. Only output valid JSON arrays of real, existing assets.');
    } catch {
      return { added: 0 };
    }

    try {
      const cleaned = result.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) return { added: 0 };

      const existing = read<DiscoveredAsset>(FILE);
      let added = 0;

      for (const item of parsed) {
        const hash = crypto.createHash('md5').update((item.symbol || item.name) + item.name).digest('hex');
        if (existing.some(e => e.symbol === item.symbol)) continue;

        const asset: DiscoveredAsset = {
          id: crypto.randomUUID(),
          name: item.name || 'Unknown',
          symbol: (item.symbol || '???').toUpperCase(),
          asset_type: item.asset_type || 'crypto',
          current_price: item.current_price_estimate || 0,
          price_change_24h: 0,
          price_change_7d: 0,
          market_cap: null,
          reason_for_growth: item.reason_for_growth || '',
          risk_factors: item.risk_factors || '',
          ai_confidence: Math.min(100, Math.max(0, item.ai_confidence || 50)),
          source: item.source || 'AI Analysis',
          source_url: '',
          discovered_at: new Date().toISOString(),
          category_tags: item.category_tags || [],
          social_buzz: item.social_buzz || 'low',
        };

        existing.push(asset);
        added++;
      }

      write(FILE, existing);
      return { added };

    } catch (e) {
      console.error('[InvestmentDiscovery] Parse failed:', e);
      return { added: 0 };
    }
  }

  // ── Get all discovered assets ──
  async getAll(): Promise<DiscoveredAsset[]> {
    return read<DiscoveredAsset>(FILE);
  }

  // ── AI Deep Dive on one asset (cached 24h) ──
  async analyzeAsset(symbol: string): Promise<InvestmentAnalysis | null> {
    const assets = read<DiscoveredAsset>(FILE);
    const asset = assets.find(a => a.symbol === symbol);
    if (!asset) return null;

    // Check cache first
    const analyses = read<InvestmentAnalysis>(ANALYSIS_FILE);
    const cached = analyses.find(a => a.asset_symbol === symbol);
    if (cached) {
      const age = Date.now() - new Date(cached.created_at).getTime();
      if (age < 24 * 3600 * 1000) return cached; // 24h cache
    }

    const prompt = `You are an investment research AI. Analyze this undiscovered asset:

Name: ${asset.name} (${asset.symbol})
Type: ${asset.asset_type}
Reason for growth: ${asset.reason_for_growth}
Risk factors: ${asset.risk_factors}
AI confidence: ${asset.ai_confidence}/100
Social buzz: ${asset.social_buzz}
Tags: ${asset.category_tags.join(', ')}

Return ONLY a raw JSON object (no markdown):
{
  "summary": "2-3 sentence investment thesis",
  "growth_potential": "low|medium|high|very_high",
  "risk_level": "low|medium|high|very_high",
  "catalyst": "what specific event could trigger the rally",
  "timing": "when is the potential breakout expected",
  "why_undiscovered": "why hasn't the market noticed yet",
  "similar_past_cases": "similar assets that had the same pattern"
}

Be data-driven, not hype-driven. Never give investment advice — only analysis.`;

    try {
      const result = await generateText(prompt, 'You are a strict investment research AI. Output only valid JSON. No advice.');
      if (!result) return cached || null;

      const cleaned = result.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const analysis: InvestmentAnalysis = {
        asset_symbol: symbol,
        asset_name: asset.name,
        summary: parsed.summary || '',
        growth_potential: parsed.growth_potential || 'medium',
        risk_level: parsed.risk_level || 'high',
        catalyst: parsed.catalyst || '',
        timing: parsed.timing || '',
        why_undiscovered: parsed.why_undiscovered || '',
        similar_past_cases: parsed.similar_past_cases || '',
        created_at: new Date().toISOString(),
      };

      // Save to cache
      const all = read<InvestmentAnalysis>(ANALYSIS_FILE);
      const idx = all.findIndex(a => a.asset_symbol === symbol);
      if (idx >= 0) all[idx] = analysis;
      else all.push(analysis);
      write(ANALYSIS_FILE, all);

      return analysis;
    } catch {
      return cached || null;
    }
  }
}
