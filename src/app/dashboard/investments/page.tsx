'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';

interface DiscoveredAsset {
  id: string; name: string; symbol: string; asset_type: string;
  current_price: number; reason_for_growth: string; risk_factors: string;
  ai_confidence: number; source: string; social_buzz: string;
  category_tags: string[]; discovered_at: string;
}

interface Analysis {
  summary: string; growth_potential: string; risk_level: string;
  catalyst: string; timing: string; why_undiscovered: string;
  similar_past_cases: string;
}

const TYPE_ICONS: Record<string, string> = { crypto: '🪙', stock: '📈', commodity: '🛢', etf: '📊' };
const BUZZ_COLORS: Record<string, string> = {
  very_high: 'bg-rose-500/15 text-rose-400',
  high: 'bg-amber-500/15 text-amber-400',
  medium: 'bg-indigo-500/15 text-indigo-400',
  low: 'bg-gray-500/15 text-gray-400',
};
const GROWTH_COLORS: Record<string, string> = {
  very_high: 'text-emerald-400', high: 'text-indigo-400',
  medium: 'text-amber-400', low: 'text-gray-400',
};

export default function InvestmentsPage() {
  const [assets, setAssets] = useState<DiscoveredAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [msg, setMsg] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchAll = async () => {
    try {
      const res = await fetch('/api/investments');
      if (res.ok) setAssets((await res.json()).data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const scan = async () => {
    setScanning(true); setMsg('');
    try {
      const res = await fetch('/api/investments', { method: 'POST' });
      const d = await res.json();
      setMsg(`🔍 ${d.added} new opportunities found!`);
      await fetchAll();
    } catch { setMsg('❌ Scan failed'); }
    finally { setScanning(false); setTimeout(() => setMsg(''), 5000); }
  };

  const analyze = async (symbol: string) => {
    setSelected(symbol); setAnalyzing(true); setAnalysis(null);
    try {
      const res = await fetch(`/api/investments/discover?symbol=${symbol}`);
      if (res.ok) setAnalysis(await res.json());
    } catch {}
    finally { setAnalyzing(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">Hidden Gems</h1>
          <p className="text-xs text-gray-500 mt-0.5">AI discovers undervalued assets before they go mainstream</p>
        </div>
        <Button variant="gradient" size="sm" onClick={scan} disabled={scanning}>
          {scanning ? '🔍 Scanning...' : '🔍 AI Scan'}
        </Button>
      </div>

      {/* Message */}
      {msg && <div className="glass rounded-xl px-4 py-2 text-xs text-white animate-fade-in">{msg}</div>}

      {/* Empty state */}
      {assets.length === 0 && !loading && (
        <div className="glass rounded-xl py-16 text-center">
          <p className="text-sm text-gray-500 mb-2">No discoveries yet.</p>
          <p className="text-xs text-gray-700">Click <span className="text-indigo-400">AI Scan</span> to find hidden investment opportunities.</p>
        </div>
      )}

      {/* Cards */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {assets.map(a => (
          <div key={a.id} className="glass rounded-xl p-4 hover:bg-white/[0.035] transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{TYPE_ICONS[a.asset_type] || '📊'}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-white">{a.symbol}</p>
                    <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-medium ${BUZZ_COLORS[a.social_buzz] || 'bg-gray-500/15 text-gray-400'}`}>
                      {a.social_buzz.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-600">{a.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-bold ${a.ai_confidence > 70 ? 'text-emerald-400' : a.ai_confidence > 40 ? 'text-amber-400' : 'text-gray-400'}`}>
                  {a.ai_confidence}%
                </span>
              </div>
            </div>

            <div className="mt-2.5 space-y-1.5">
              <div>
                <p className="text-[9px] text-gray-700 uppercase tracking-wide">📈 Thesis</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{a.reason_for_growth}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-700 uppercase tracking-wide">⚠️ Risks</p>
                <p className="text-xs text-rose-400/70 mt-0.5">{a.risk_factors}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04]">
              <div className="flex items-center gap-1.5 flex-wrap">
                {(a.category_tags || []).slice(0, 3).map(t => (
                  <span key={t} className="text-[9px] text-gray-700 bg-white/[0.03] px-1.5 py-0.5 rounded">{t}</span>
                ))}
              </div>
              <button
                onClick={() => analyze(a.symbol)}
                className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                AI Deep Dive →
              </button>
            </div>

            {/* Analysis panel */}
            {selected === a.symbol && analysis && (
              <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-2 animate-fade-in">
                <p className="text-xs text-gray-300 leading-relaxed">{analysis.summary}</p>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${GROWTH_COLORS[analysis.growth_potential]}`}>
                    Growth: {analysis.growth_potential.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">|</span>
                  <span className={`text-xs font-medium ${analysis.risk_level === 'very_high' || analysis.risk_level === 'high' ? 'text-rose-400' : 'text-amber-400'}`}>
                    Risk: {analysis.risk_level.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] text-gray-700 uppercase">🚀 Catalyst</p>
                  <p className="text-xs text-gray-400">{analysis.catalyst}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-700 uppercase">⏰ Timing</p>
                  <p className="text-xs text-gray-400">{analysis.timing}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-700 uppercase">🔍 Why still undiscovered</p>
                  <p className="text-xs text-gray-400">{analysis.why_undiscovered}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-700 uppercase">📚 Similar past cases</p>
                  <p className="text-xs text-gray-400">{analysis.similar_past_cases}</p>
                </div>
                <p className="text-[8px] text-gray-800 italic">⚠️ Not investment advice. Data-driven analysis only.</p>
              </div>
            )}
            {selected === a.symbol && analyzing && (
              <div className="mt-3 pt-3 border-t border-white/[0.04] text-center">
                <span className="text-xs text-gray-600 animate-pulse">Analyzing...</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
