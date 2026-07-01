export interface DiscoveredAsset {
  id?: string;
  name: string;
  symbol: string;
  asset_type: 'crypto' | 'stock' | 'commodity' | 'etf';
  current_price: number;
  price_change_24h: number;
  price_change_7d: number;
  market_cap: number | null;
  reason_for_growth: string;
  risk_factors: string;
  ai_confidence: number; // 0-100
  source: string;
  source_url: string;
  discovered_at: string;
  category_tags: string[];
  social_buzz: 'low' | 'medium' | 'high' | 'very_high';
}

export interface InvestmentAnalysis {
  asset_symbol: string;
  asset_name: string;
  summary: string;
  growth_potential: 'low' | 'medium' | 'high' | 'very_high';
  risk_level: 'low' | 'medium' | 'high' | 'very_high';
  catalyst: string;
  timing: string;
  why_undiscovered: string;
  similar_past_cases: string;
  created_at: string;
}
