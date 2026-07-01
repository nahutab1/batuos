'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

interface Asset {
  id: string; symbol: string; name: string; asset_type: string;
  current_price: number; price_change_24h: number;
  price_change_7d: number; price_change_30d: number;
  market_cap: number | null; trend: string; risk_level: string;
}

interface HiddenGem {
  id: string; name: string; symbol: string; asset_type: string;
  current_price: number; reason_for_growth: string; risk_factors: string;
  ai_confidence: number; social_buzz: string; category_tags: string[];
}

const ASSET_ICONS: Record<string, string> = { crypto: '🪙', stock: '📈', commodity: '🛢', etf: '📊', index: '📉' };

export default function FinancePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [gems, setGems] = useState<HiddenGem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/finance');
      if (res.ok) {
        const data = await res.json();
        setAssets(data.data || []);
        setGems(data.hidden_gems || []);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAssets(); }, []);

  const refresh = async () => {
    setRefreshing(true);
    await fetch('/api/finance', { method: 'POST' });
    await fetchAssets();
    setRefreshing(false);
  };

  const filtered = filter ? assets.filter(a => a.asset_type === filter) : assets;
  const types = [...new Set(assets.map(a => a.asset_type))];

  const formatPrice = (p: number) => p >= 1 ? '$' + p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '$' + p.toFixed(6);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">Financial Markets</h1>
          <p className="text-xs text-gray-500 mt-0.5">AI-powered market intelligence + hidden gem discovery</p>
        </div>
        <Button variant="gradient" size="sm" onClick={refresh} disabled={refreshing}>
          {refreshing ? '↻ Refreshing...' : '↻ Refresh'}
        </Button>
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={() => setFilter(null)} className={`rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-colors ${!filter ? 'bg-indigo-500/15 text-indigo-400' : 'text-gray-500 hover:bg-white/[0.04]'}`}>All</button>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(filter === t ? null : t)} className={`rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-colors ${filter === t ? 'bg-indigo-500/15 text-indigo-400' : 'text-gray-500 hover:bg-white/[0.04]'}`}>
            {ASSET_ICONS[t] || '📊'} {t}
          </button>
        ))}
      </div>

      {/* ── SECTION 1: Market Assets ── */}
      <div>
        <div className="section-badge mb-2">Markets</div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.length === 0 && <p className="text-xs text-gray-600 col-span-full py-8 text-center">No data. Click Refresh.</p>}
          {filtered.map(a => (
            <Link key={a.id} href={`/dashboard/finance/${a.id}`} className="glass rounded-xl p-4 hover:bg-white/[0.035] transition-all duration-200 group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{ASSET_ICONS[a.asset_type] || '📊'}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{a.symbol}</p>
                    <p className="text-[10px] text-gray-600">{a.name}</p>
                  </div>
                </div>
                <span className="text-[10px] text-gray-700 uppercase">{a.asset_type}</span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-lg font-bold text-white">{formatPrice(a.current_price)}</p>
                  <p className={`text-xs font-medium ${a.price_change_24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {a.price_change_24h >= 0 ? '▲' : '▼'} {Math.abs(a.price_change_24h).toFixed(2)}%
                  </p>
                </div>
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${a.trend === 'bullish' ? 'bg-emerald-500/15 text-emerald-400' : a.trend === 'bearish' ? 'bg-rose-500/15 text-rose-400' : 'bg-gray-500/15 text-gray-400'}`}>{a.trend}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-700">
                <span>7d: <span className={a.price_change_7d >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{a.price_change_7d >= 0 ? '+' : ''}{a.price_change_7d.toFixed(1)}%</span></span>
                <span>30d: <span className={a.price_change_30d >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{a.price_change_30d >= 0 ? '+' : ''}{a.price_change_30d.toFixed(1)}%</span></span>
                <span className="ml-auto text-indigo-400 opacity-0 group-hover:opacity-100 text-[9px]">Detail →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── SECTION 2: Hidden Gems ── */}
      {gems.length > 0 && (
        <div>
          <div className="section-badge mb-2 flex items-center gap-2">
            <span>💎 Hidden Gems</span>
            <span className="text-[9px] text-gray-700 font-normal">AI-discovered undervalued assets</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {gems.map(g => (
              <div key={g.id} className="glass rounded-xl p-4 border-l-2 border-l-amber-500/30 hover:bg-white/[0.035] transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{ASSET_ICONS[g.asset_type] || '💎'}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-white">{g.symbol}</p>
                        <span className="rounded-md bg-amber-500/15 text-amber-400 px-1.5 py-0.5 text-[8px] font-bold">💎 {g.ai_confidence}%</span>
                      </div>
                      <p className="text-[10px] text-gray-600">{g.name}</p>
                    </div>
                  </div>
                  <span className={`rounded-md px-1.5 py-0.5 text-[8px] font-medium ${
                    g.social_buzz === 'very_high' ? 'bg-rose-500/15 text-rose-400' :
                    g.social_buzz === 'high' ? 'bg-amber-500/15 text-amber-400' :
                    'bg-gray-500/15 text-gray-400'
                  }`}>{g.social_buzz.replace('_', ' ')}</span>
                </div>
                <div className="mt-2.5">
                  <p className="text-[9px] text-gray-700 uppercase tracking-wide">📈 Thesis</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{g.reason_for_growth}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {(g.category_tags || []).slice(0, 4).map(t => (
                    <span key={t} className="text-[9px] text-gray-700 bg-white/[0.03] px-1.5 py-0.5 rounded">{t}</span>
                  ))}
                </div>
                <Link href={`/dashboard/investments`} className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 hover:text-amber-300 transition-colors">
                  💎 View all hidden gems →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
