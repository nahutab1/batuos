'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';

interface Asset {
  id: string; symbol: string; name: string; asset_type: string;
  current_price: number; price_change_24h: number;
  price_change_7d: number; price_change_30d: number;
  market_cap: number | null; volume_24h: number | null;
  high_24h: number | null; low_24h: number | null;
  trend: string; risk_level: string; confidence_score: number;
  ai_summary: string | null;
}

interface Analysis {
  summary: string; short_term_outlook: string; long_term_outlook: string;
  key_risks: string[]; catalysts: string[]; technical_notes: string;
  analysis_date: string;
}

const ASSET_ICONS: Record<string, string> = {
  crypto: '🪙', stock: '📈', commodity: '🛢', etf: '📊', index: '📉',
};

export default function FinanceDetailPage() {
  const { id } = useParams();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/finance/${id}`).then(r => r.json()).then(setAsset).catch(() => {});
    fetch(`/api/finance/${id}/analyze`).then(r => r.json()).then(d => {
      if (d?.summary) setAnalysis(d);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/finance/${id}/analyze`, { method: 'POST' });
      if (res.ok) setAnalysis(await res.json());
    } finally { setAnalyzing(false); }
  };

  const formatPrice = (p: number) => {
    if (p >= 1000) return '$' + p.toLocaleString(undefined, { minimumFractionDigits: 2 });
    if (p >= 1) return '$' + p.toFixed(2);
    return '$' + p.toFixed(6);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
    </div>
  );

  if (!asset) return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-sm text-gray-600">Asset not found</p>
      <Link href="/dashboard/finance" className="text-xs text-indigo-400 mt-2 hover:text-indigo-300">← Back</Link>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/finance" className="text-gray-600 hover:text-gray-400 transition-colors text-sm">←</Link>
          <span className="text-lg">{ASSET_ICONS[asset.asset_type] || '📊'}</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{asset.name}</h1>
              <span className="text-xs text-gray-600 font-mono">{asset.symbol}</span>
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                asset.trend === 'bullish' ? 'bg-emerald-500/15 text-emerald-400' :
                asset.trend === 'bearish' ? 'bg-rose-500/15 text-rose-400' : 'bg-gray-500/15 text-gray-400'
              }`}>{asset.trend}</span>
            </div>
            <p className="text-[11px] text-gray-600 capitalize">{asset.asset_type}</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={runAnalysis} disabled={analyzing}>
          {analyzing ? '🔄 Analyzing...' : '🤖 AI Analysis'}
        </Button>
      </div>

      {/* Price */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass rounded-xl px-4 py-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-wide">Price</p>
          <p className="text-2xl font-bold text-white mt-1">{formatPrice(asset.current_price)}</p>
          <p className={`text-xs font-medium mt-0.5 ${asset.price_change_24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {asset.price_change_24h >= 0 ? '▲' : '▼'} {Math.abs(asset.price_change_24h).toFixed(2)}% today
          </p>
        </div>
        <div className="glass rounded-xl px-4 py-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-wide">7 Days</p>
          <p className={`text-lg font-bold mt-1 ${asset.price_change_7d >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {asset.price_change_7d >= 0 ? '+' : ''}{asset.price_change_7d.toFixed(2)}%
          </p>
        </div>
        <div className="glass rounded-xl px-4 py-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-wide">30 Days</p>
          <p className={`text-lg font-bold mt-1 ${asset.price_change_30d >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {asset.price_change_30d >= 0 ? '+' : ''}{asset.price_change_30d.toFixed(2)}%
          </p>
        </div>
        <div className="glass rounded-xl px-4 py-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-wide">Risk Level</p>
          <p className={`text-lg font-bold mt-1 ${
            asset.risk_level === 'low' ? 'text-emerald-400' :
            asset.risk_level === 'medium' ? 'text-amber-400' :
            'text-rose-400'
          }`}>{asset.risk_level.replace('_', ' ')}</p>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="glass rounded-xl px-4 py-3.5">
        <div className="section-badge mb-2">AI Analysis</div>
        {analysis ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-300 leading-relaxed">{analysis.summary}</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-700 uppercase tracking-wide mb-1">Short-term Outlook</p>
                <p className="text-xs text-gray-400">{analysis.short_term_outlook}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-700 uppercase tracking-wide mb-1">Long-term Outlook</p>
                <p className="text-xs text-gray-400">{analysis.long_term_outlook}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-700 uppercase tracking-wide mb-1">📈 Catalysts</p>
                <ul className="space-y-1">
                  {(analysis.catalysts || []).map((c, i) => (
                    <li key={i} className="text-xs text-emerald-400/80">+ {c}</li>
                  ))}
                  {(!analysis.catalysts || analysis.catalysts.length === 0) && (
                    <li className="text-xs text-gray-600">None identified</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="text-[10px] text-gray-700 uppercase tracking-wide mb-1">⚠️ Risks</p>
                <ul className="space-y-1">
                  {(analysis.key_risks || []).map((r, i) => (
                    <li key={i} className="text-xs text-rose-400/80">! {r}</li>
                  ))}
                  {(!analysis.key_risks || analysis.key_risks.length === 0) && (
                    <li className="text-xs text-gray-600">None identified</li>
                  )}
                </ul>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-gray-700 uppercase tracking-wide mb-1">📉 Technical Notes</p>
              <p className="text-xs text-gray-400">{analysis.technical_notes}</p>
            </div>

            <p className="text-[9px] text-gray-700">
              Analysis generated: {new Date(analysis.analysis_date).toLocaleString()}
            </p>
            <p className="text-[9px] text-gray-800 italic">⚠️ This is not investment advice. Data-driven analysis only.</p>
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-xs text-gray-600 mb-3">No AI analysis yet.</p>
            <Button variant="gradient" size="sm" onClick={runAnalysis} disabled={analyzing}>
              {analyzing ? 'Generating...' : '🤖 Generate AI Analysis'}
            </Button>
          </div>
        )}
      </div>

      {/* Price chart placeholder */}
      <div className="glass rounded-xl px-4 py-3.5">
        <div className="section-badge mb-2">Price Chart</div>
        <div className="h-48 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-gray-600">Chart placeholder</p>
            <p className="text-[10px] text-gray-700 mt-1">Powered by TradingView (coming soon)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
