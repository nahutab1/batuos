import type {
  FinancialAsset, AssetType, PricePoint, NewsItem, FinancialAnalysis,
  CreateFinancialAnalysisDTO, TrendDirection, RiskLevel,
} from './types';
import { generateText } from '@/lib/gemini';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), '.data');
const ASSETS_FILE = path.join(DATA_DIR, 'financial_assets.json');
const HISTORY_FILE = path.join(DATA_DIR, 'price_history.json');
const ANALYSIS_FILE = path.join(DATA_DIR, 'financial_analyses.json');

function read<T>(file: string): T[] {
  try { if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch {}
  return [];
}
function write<T>(file: string, data: T[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

const WATCHLIST: { symbol: string; name: string; type: AssetType }[] = [
  // Kripto
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
  { symbol: 'SOL', name: 'Solana', type: 'crypto' },
  { symbol: 'XRP', name: 'Ripple', type: 'crypto' },
  // Hisseler
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
  // Emtialar
  { symbol: 'XAU', name: 'Gold', type: 'commodity' },
  { symbol: 'XAG', name: 'Silver', type: 'commodity' },
  { symbol: 'XPT', name: 'Platinum', type: 'commodity' },
  { symbol: 'CL', name: 'Crude Oil', type: 'commodity' },
  { symbol: 'NG', name: 'Natural Gas', type: 'commodity' },
  // Endeksler
  { symbol: 'SPY', name: 'S&P 500 ETF', type: 'etf' },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', type: 'etf' },
  { symbol: 'VIX', name: 'CBOE Volatility Index', type: 'index' },
];

const SOURCE_FAVICONS: Record<string, string> = {
  'CoinGecko': '🪙', 'Yahoo Finance': '📊', 'Investing.com': '📈',
  'CoinMarketCap': '💎', 'Reuters': '📰', 'Bloomberg': '📡',
  'MarketWatch': '👁', 'TradingView': '📉',
};

export class FinanceService {
  // ── Asset Prices (CoinGecko) ──
  private async fetchCryptoPrices(): Promise<Partial<FinancialAsset>[]> {
    try {
      const ids = ['bitcoin', 'ethereum', 'solana', 'ripple'];
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) return [];
      const data = await res.json();
      const map: Record<string, string> = { bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', ripple: 'XRP' };
      return Object.entries(data).map(([id, vals]: any) => ({
        symbol: map[id],
        current_price: vals.usd,
        price_change_24h: vals.usd_24h_change || 0,
        volume_24h: vals.usd_24h_vol,
        market_cap: vals.usd_market_cap,
      }));
    } catch { return []; }
  }

  // ── Stock & ETF Prices (Yahoo Finance) ──
  private async fetchYahooPrices(symbols: string[]): Promise<Partial<FinancialAsset>[]> {
    const results: Partial<FinancialAsset>[] = [];

    for (const symbol of symbols) {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`,
          { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000) }
        );
        if (!res.ok) continue;
        const data = await res.json();
        const result = data?.chart?.result?.[0];
        if (!result) continue;
        const meta = result.meta;
        const quotes = result.indicators?.quote?.[0];
        const closes = quotes?.close?.filter((c: number | null) => c !== null) || [];
        if (closes.length < 2) continue;

        const current = closes[closes.length - 1];
        const prevClose = closes[closes.length - 2] || current;
        const changePct = prevClose ? ((current - prevClose) / prevClose) * 100 : 0;

        // 7d change: compare with close 5 entries ago (trading days)
        const weekAgo = closes[0] || current;
        const change7d = weekAgo ? ((current - weekAgo) / weekAgo) * 100 : 0;

        results.push({
          symbol,
          current_price: current,
          price_change_24h: changePct,
          price_change_7d: change7d,
          volume_24h: quotes?.volume?.[quotes.volume.length - 1] || null,
          market_cap: null,
        });
      } catch { continue; }
    }
    return results;
  }

  private async fetchStockPrices(): Promise<Partial<FinancialAsset>[]> {
    return this.fetchYahooPrices(['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'SPY', 'QQQ']);
  }

  // ── Commodity Prices (Yahoo Finance ETF proxies → real commodity display) ──
  private async fetchCommodityPrices(): Promise<Partial<FinancialAsset>[]> {
    // ETF proxy mapping: real symbol → yahoo ticker
    const proxyMap: Record<string, string> = {
      XAU: 'GLD', XAG: 'SLV', XPT: 'PPLT',
      CL: 'USO', NG: 'UNG',
    };
    const results = await this.fetchYahooPrices(Object.values(proxyMap));
    // Map back to real symbols
    const reverseMap = Object.fromEntries(Object.entries(proxyMap).map(([k, v]) => [v, k]));
    return results.map(r => {
      const sym = r.symbol || '';
      return { ...r, symbol: reverseMap[sym] || sym };
    });
  }

  // ── Main refresh ──
  async refreshPrices(): Promise<{ updated: number; errors: number }> {
    let updated = 0, errors = 0;

    const [cryptoPrices, stockPrices, commodityPrices] = await Promise.all([
      this.fetchCryptoPrices().catch(() => { errors++; return []; }),
      this.fetchStockPrices().catch(() => { errors++; return []; }),
      this.fetchCommodityPrices().catch(() => { errors++; return []; }),
    ]);

    const allPrices = [...cryptoPrices, ...stockPrices, ...commodityPrices];
    const assets = read<FinancialAsset>(ASSETS_FILE);

    for (const price of allPrices) {
      const existing = assets.find(a => a.symbol === price.symbol);
      if (existing) {
        existing.current_price = price.current_price ?? existing.current_price;
        existing.price_change_24h = price.price_change_24h ?? existing.price_change_24h;
        existing.price_change_7d = price.price_change_7d ?? existing.price_change_7d;
        existing.volume_24h = price.volume_24h ?? existing.volume_24h;
        existing.market_cap = price.market_cap ?? existing.market_cap;
        // Trend heuristic
        const chg = existing.price_change_24h;
        existing.trend = chg > 3 ? 'bullish' : chg < -3 ? 'bearish' : 'neutral';
        existing.last_updated = new Date().toISOString();
        updated++;
      }
    }

    write(ASSETS_FILE, assets);
    return { updated, errors };
  }

  // ── Get all assets ──
  async getAll(): Promise<{ data: FinancialAsset[]; count: number; hidden_gems: any[] }> {
    let assets = read<FinancialAsset>(ASSETS_FILE);
    // First run: seed from watchlist
    if (assets.length === 0) {
      assets = WATCHLIST.map(w => ({
        id: crypto.randomUUID(),
        symbol: w.symbol,
        name: w.name,
        asset_type: w.type,
        current_price: 0,
        currency: 'USD',
        price_change_24h: 0,
        price_change_7d: 0,
        price_change_30d: 0,
        market_cap: null,
        volume_24h: null,
        high_24h: null,
        low_24h: null,
        trend: 'neutral' as TrendDirection,
        risk_level: w.type === 'crypto' ? 'very_high' as RiskLevel : 'medium' as RiskLevel,
        confidence_score: 0,
        ai_summary: null,
        is_hidden_gem: false,
        hidden_gem_confidence: 0,
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      write(ASSETS_FILE, assets);
    }
    // Load hidden gems as separate list
    let gems: any[] = [];
    try {
      const gemsFile = path.join(DATA_DIR, 'investment_discoveries.json');
      if (fs.existsSync(gemsFile)) gems = JSON.parse(fs.readFileSync(gemsFile, 'utf-8'));
    } catch {}

    return { data: assets, count: assets.length, hidden_gems: gems };
  }

  async getById(id: string): Promise<FinancialAsset | null> {
    return read<FinancialAsset>(ASSETS_FILE).find(a => a.id === id) || null;
  }

  // ── AI Analysis ──
  async generateAnalysis(assetId: string): Promise<FinancialAnalysis | null> {
    const asset = await this.getById(assetId);
    if (!asset) return null;

    // Check if we already have a recent analysis (last 6 hours)
    const analyses = read<FinancialAnalysis>(ANALYSIS_FILE);
    const existing = analyses.find(a => a.asset_id === assetId);
    if (existing) {
      const age = Date.now() - new Date(existing.analysis_date).getTime();
      if (age < 6 * 3600 * 1000) return existing; // cache hit
    }

    const prompt = `You are a financial analysis AI. Analyze this asset with data-driven insights only. Never give investment advice.

Asset: ${asset.name} (${asset.symbol})
Type: ${asset.asset_type}
Current Price: $${asset.current_price}
24h Change: ${asset.price_change_24h.toFixed(2)}%
7d Change: ${asset.price_change_7d.toFixed(2)}%

Return ONLY a raw JSON object (no markdown):
{
  "summary": "2-3 sentence overview",
  "short_term_outlook": "outlook for next days/weeks",
  "long_term_outlook": "outlook for months/years",
  "key_risks": ["risk 1", "risk 2"],
  "catalysts": ["positive factor 1", "positive factor 2"],
  "technical_notes": "brief technical analysis"
}`;

    let result = '';
    try {
      result = await generateText(prompt, 'You are a strict financial data analysis AI. Output only valid JSON. Never give investment advice.');
    } catch { if (existing) return existing; return null; }

    try {
      const cleaned = result.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const analysis: FinancialAnalysis = {
        id: crypto.randomUUID(),
        asset_id: assetId,
        summary: parsed.summary || 'No analysis available.',
        short_term_outlook: parsed.short_term_outlook || '',
        long_term_outlook: parsed.long_term_outlook || '',
        key_risks: parsed.key_risks || [],
        catalysts: parsed.catalysts || [],
        technical_notes: parsed.technical_notes || '',
        analysis_date: new Date().toISOString(),
        model_used: 'gemini-2.5-flash',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const all = read<FinancialAnalysis>(ANALYSIS_FILE);
      const idx = all.findIndex(a => a.asset_id === assetId);
      if (idx >= 0) all[idx] = analysis;
      else all.push(analysis);
      write(ANALYSIS_FILE, all);

      return analysis;
    } catch {
      if (existing) return existing;
      return null;
    }
  }

  async getAnalysis(assetId: string): Promise<FinancialAnalysis | null> {
    return read<FinancialAnalysis>(ANALYSIS_FILE).find(a => a.asset_id === assetId) || null;
  }

  // ── News ──
  async getNews(assetId: string): Promise<NewsItem[]> {
    return read<NewsItem>('financial_news.json').filter(n => n.asset_id === assetId).slice(0, 20);
  }
}
