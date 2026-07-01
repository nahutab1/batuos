import type { BaseEntity } from '@/core/types';

export type AssetType = 'stock' | 'crypto' | 'commodity' | 'etf' | 'index' | 'currency';
export type TrendDirection = 'bullish' | 'neutral' | 'bearish';
export type RiskLevel = 'low' | 'medium' | 'high' | 'very_high';
export type TimeFrame = '1D' | '1W' | '1M' | '6M' | '1Y' | 'ALL';

export interface FinancialAsset extends BaseEntity {
  symbol: string;
  name: string;
  asset_type: AssetType;
  current_price: number;
  currency: string;
  price_change_24h: number;
  price_change_7d: number;
  price_change_30d: number;
  market_cap: number | null;
  volume_24h: number | null;
  high_24h: number | null;
  low_24h: number | null;
  trend: TrendDirection;
  risk_level: RiskLevel;
  confidence_score: number;
  ai_summary: string | null;
  is_hidden_gem: boolean;
  hidden_gem_confidence: number;
  last_updated: string;
}

export interface PricePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsItem extends BaseEntity {
  asset_id: string | null;
  title: string;
  source: string;
  source_url: string;
  summary: string | null;
  sentiment: 'positive' | 'negative' | 'neutral';
  published_at: string;
}

export interface FinancialAnalysis extends BaseEntity {
  asset_id: string;
  summary: string;
  short_term_outlook: string;
  long_term_outlook: string;
  key_risks: string[];
  catalysts: string[];
  technical_notes: string;
  analysis_date: string;
  model_used: string;
}

export interface CreateFinancialAnalysisDTO {
  asset_id: string;
  summary: string;
  short_term_outlook: string;
  long_term_outlook: string;
  key_risks: string[];
  catalysts: string[];
  technical_notes: string;
}

export interface AssetDetail {
  asset: FinancialAsset;
  priceHistory: PricePoint[];
  news: NewsItem[];
  analysis: FinancialAnalysis | null;
}
