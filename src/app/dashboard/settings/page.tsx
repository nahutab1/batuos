'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';

interface EnvVar {
  key: string;
  value: string;
  category: string;
  masked: boolean;
}

export default function SettingsPage() {
  const [grouped, setGrouped] = useState<Record<string, EnvVar[]>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setGrouped(data.grouped || {});
        // Init edits from current values
        const initial: Record<string, string> = {};
        for (const vars of Object.values(data.grouped || {}) as EnvVar[][]) {
          for (const v of vars) {
            initial[v.key] = v.value;
          }
        }
        setEdits(initial);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setEdits(prev => ({ ...prev, [key]: value }));
  };

  // Yeni bir env eklemek için
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const addNew = () => {
    if (!newKey.trim()) return;
    const key = newKey.trim().toUpperCase().replace(/\s+/g, '_');
    handleChange(key, newValue);
    // Kategori belirle
    let cat = 'Other';
    if (key.includes('SUPABASE')) cat = 'Supabase';
    else if (key.includes('GEMINI')) cat = 'Gemini AI';
    else if (key.includes('TELEGRAM')) cat = 'Telegram';
    else if (key.includes('NIGHTLY')) cat = 'Nightly Summary';
    else if (key.includes('PRODUCTHUNT')) cat = 'Product Hunt';
    else if (key.includes('GITHUB')) cat = 'GitHub';
    else if (key.includes('OPENAI')) cat = 'OpenAI';
    else if (key.includes('ANTHROPIC')) cat = 'Anthropic';
    else if (key.includes('VERCEL')) cat = 'Vercel';

    setGrouped(prev => ({
      ...prev,
      [cat]: [...(prev[cat] || []), { key, value: newValue, category: cat, masked: key.includes('KEY') || key.includes('TOKEN') || key.includes('SECRET') } as EnvVar],
    }));
    setNewKey('');
    setNewValue('');
  };

  const deleteKey = (key: string) => {
    const newEdits = { ...edits };
    delete newEdits[key];
    setEdits(newEdits);
    setGrouped(prev => {
      const next = { ...prev };
      for (const cat of Object.keys(next)) {
        next[cat] = next[cat].filter(v => v.key !== key);
        if (next[cat].length === 0) delete next[cat];
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const envs = Object.entries(edits).map(([key, value]) => ({ key, value }));
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envs }),
      });
      const data = await res.json();
      if (res.ok) setMessage({ text: data.message || '✅ Saved!', ok: true });
      else setMessage({ text: `❌ ${data.error}`, ok: false });
    } catch {
      setMessage({ text: '❌ Failed to save', ok: false });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
    </div>
  );

  const catOrder = ['Supabase', 'Gemini AI', 'Telegram', 'Nightly Summary', 'Product Hunt', 'GitHub', 'OpenAI', 'Anthropic', 'Vercel', 'Other'];
  const sortedCats = Object.keys(grouped).sort((a, b) => {
    const ia = catOrder.indexOf(a); const ib = catOrder.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage all environment variables and API keys</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="rounded-lg px-3 py-1.5 text-[10px] font-medium text-gray-600 hover:bg-white/[0.04] hover:text-gray-400 transition-all"
          >
            {showAll ? '🔒 Hide Values' : '👁 Show Values'}
          </button>
        </div>
      </div>

      {/* Kategoriler */}
      <div className="space-y-3">
        {sortedCats.map(cat => (
          <div key={cat} className="glass rounded-xl px-4 py-3.5 glass-hover">
            <div className="section-badge mb-3">{cat}</div>
            <div className="space-y-2.5">
              {grouped[cat].map(env => (
                <div key={env.key} className="group">
                  <label className="mb-0.5 block text-[10px] font-medium tracking-wide text-gray-600 uppercase flex items-center gap-2">
                    {env.key}
                    {env.masked && <span className="text-[8px] text-gray-700 font-mono">🔑</span>}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showAll ? 'text' : (env.masked ? 'password' : 'text')}
                      value={edits[env.key] ?? ''}
                      onChange={e => handleChange(env.key, e.target.value)}
                      placeholder={env.masked ? 'Enter API key...' : 'Enter value...'}
                      className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-gray-700 transition-colors hover:border-white/20 focus:border-indigo-500/50 focus:outline-none font-mono"
                    />
                    <button
                      onClick={() => deleteKey(env.key)}
                      className="shrink-0 rounded-md p-1.5 text-gray-700 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all text-[10px]"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Yeni ekle */}
      <div className="glass rounded-xl px-4 py-3.5 glass-hover">
        <div className="section-badge mb-3">Add New Variable</div>
        <div className="flex items-center gap-2">
          <input
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            placeholder="KEY_NAME"
            className="flex-1 max-w-xs rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-gray-700 font-mono focus:border-indigo-500/50 focus:outline-none"
          />
          <span className="text-gray-700 text-[10px]">=</span>
          <input
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            placeholder="value"
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-gray-700 font-mono focus:border-indigo-500/50 focus:outline-none"
          />
          <Button variant="secondary" size="sm" onClick={addNew} disabled={!newKey.trim()}>
            Add
          </Button>
        </div>
      </div>

      {/* Mesaj */}
      {message && (
        <div className={`rounded-xl px-4 py-2.5 text-xs ${
          message.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
        } animate-fade-in`}>
          {message.text}
        </div>
      )}

      {/* Save */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-gray-700">
          Writes to <span className="font-mono text-gray-600">.env.local</span>
        </p>
        <Button variant="gradient" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save All'}
        </Button>
      </div>
    </div>
  );
}
