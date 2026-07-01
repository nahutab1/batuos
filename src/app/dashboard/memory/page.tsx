'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui';

interface Memory {
  id: string; fact: string; context?: string; source: string; created_at: string;
}

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [fact, setFact] = useState('');
  const [factContext, setFactContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);

  const fetchMemories = useCallback(async () => {
    const res = await fetch('/api/memory');
    if (res.ok) setMemories(await res.json());
  }, []);

  useEffect(() => { fetchMemories(); }, [fetchMemories]);

  const addMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fact) return;
    setIsLoading(true);
    await fetch('/api/memory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fact, context: factContext, source: 'manual' }) });
    setFact(''); setFactContext(''); setIsLoading(false); fetchMemories();
  };

  const deleteMemory = async (id: string) => {
    await fetch(`/api/memory/${id}`, { method: 'DELETE' });
    fetchMemories();
  };

  const askMemory = async () => {
    if (!query.trim()) return;
    setQueryLoading(true);
    setQueryResult(null);
    try {
      const [memRes, notesRes] = await Promise.all([fetch('/api/memory'), fetch('/api/notes')]);
      const allMemories: Memory[] = memRes.ok ? await memRes.json() : [];
      const allNotes: any[] = notesRes.ok ? await notesRes.json() : [];

      const contextText = [
        '=== MEMORIES ===',
        ...allMemories.map(m => `- ${m.fact}${m.context ? ' (' + m.context + ')' : ''}`),
        '=== NOTES ===',
        ...allNotes.map(n => `- ${n.title}: ${(n.content || '').slice(0, 200)}`),
      ].join('\n');

      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Batu's knowledge base:\n\n${contextText}\n\nQuestion: ${query}\n\nAnswer based ONLY on the above. If not found, say "Bilmiyorum."`,
          system: "You are Batu's second brain. Answer concisely from stored knowledge.",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setQueryResult(data.text?.replace(/```/g, '').trim() || 'Cevap yok.');
      }
    } catch { setQueryResult('❌ Hata.'); }
    finally { setQueryLoading(false); }
  };

  const filtered = memories.filter(m =>
    !search || m.fact.toLowerCase().includes(search) || (m.context || '').toLowerCase().includes(search)
  );

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Memory</h1>
          <p className="text-xs text-gray-500 mt-0.5">Second brain — AI ile sorgula</p>
        </div>
      </div>

      {/* AI Query */}
      <div className="glass rounded-xl px-4 py-3.5">
        <div className="section-badge mb-2">🧠 AI Sorgula</div>
        <div className="flex items-center gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askMemory()}
            placeholder='"Ali ile ilgili ne biliyorum?" "proje teslim tarihi?"'
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-gray-700 focus:border-indigo-500/50 focus:outline-none" />
          <Button variant="gradient" size="sm" onClick={askMemory} disabled={queryLoading || !query.trim()}>
            {queryLoading ? '🔍' : 'Sor'}
          </Button>
        </div>
        {queryResult && (
          <div className="mt-3 rounded-lg bg-indigo-500/5 px-3 py-2.5">
            <p className="text-xs text-indigo-300/90 leading-relaxed">{queryResult}</p>
          </div>
        )}
      </div>

      {/* Add */}
      <div className="glass rounded-xl px-4 py-3.5">
        <div className="section-badge mb-2">Yeni Bilgi</div>
        <form onSubmit={addMemory} className="flex items-center gap-2">
          <input value={fact} onChange={e => setFact(e.target.value)} placeholder="Mesela: Ali async iletisim tercih ediyor..." required
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-gray-700 focus:border-indigo-500/50 focus:outline-none" />
          <input value={factContext} onChange={e => setFactContext(e.target.value)} placeholder="Baglam (opsiyonel)"
            className="flex-1 max-w-[180px] rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-gray-700 focus:border-indigo-500/50 focus:outline-none" />
          <Button type="submit" size="sm" disabled={!fact}>Kaydet</Button>
        </form>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Hafizada ara..."
        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-gray-700 focus:border-indigo-500/50 focus:outline-none" />

      <div className="space-y-2">
        {filtered.length === 0 ? <p className="py-8 text-center text-xs text-gray-600">Hafiza bos.</p> : filtered.map(m => (
          <div key={m.id} className="glass rounded-xl px-4 py-3 flex items-start justify-between group hover:bg-white/[0.035] transition-all">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200">{m.fact}</p>
              {m.context && <p className="text-xs text-gray-500 mt-1">{m.context}</p>}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[9px] text-gray-700 bg-white/[0.03] px-1.5 py-0.5 rounded">{m.source}</span>
                <span className="text-[9px] text-gray-700">{new Date(m.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <button onClick={() => deleteMemory(m.id)} className="shrink-0 text-gray-700 opacity-0 group-hover:opacity-100 hover:text-rose-400 text-[10px] ml-2">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
