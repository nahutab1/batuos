'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, Button, Input } from '@/components/ui';

/* ─── Types ─── */

interface StartupIdea {
  id: string;
  name: string;
  description: string | null;
  source: string;
  source_urls: string[];
  problem_solved: string | null;
  target_audience: string | null;
  business_model: string | null;
  why_noteworthy: string | null;
  first_seen_at: string | null;
  age_label: string | null;
  engagement_score: number;
  created_at: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const SOURCE_FAVICONS: Record<string, string> = {
  'Product Hunt': '🔮',
  'Hacker News': '📰',
  'GitHub Trending': '⭐',
  'Indie Hackers': '💬',
  'BetaList': '📋',
  'Y Combinator': '🎓',
  'TechCrunch': '📡',
  'Reddit': '🗣',
  'AI Blogs': '🤖',
  'X': '🐦',
};

const AGE_COLORS: Record<string, string> = {
  brand_new: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  very_new: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  new: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  trending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  established: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
};

const AGE_LABELS: Record<string, string> = {
  brand_new: 'Brand New',
  very_new: 'Very New',
  new: 'New',
  trending: 'Trending',
  established: 'Established',
};

const BUSINESS_COLORS: Record<string, string> = {
  'SaaS': 'bg-blue-500/10 text-blue-400',
  'AI Tool': 'bg-purple-500/10 text-purple-400',
  'Marketplace': 'bg-amber-500/10 text-amber-400',
  'DevTool': 'bg-cyan-500/10 text-cyan-400',
  'Social': 'bg-pink-500/10 text-pink-400',
  'Content': 'bg-emerald-500/10 text-emerald-400',
  'E-commerce': 'bg-rose-500/10 text-rose-400',
  'Hardware': 'bg-orange-500/10 text-orange-400',
};

export default function DiscoveryPage() {
  const [ideas, setIdeas] = useState<StartupIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>({});

  // ── Fetch ideas ──
  const fetchIdeas = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (sourceFilter) params.set('source', sourceFilter);
      const res = await fetch(`/api/discovery?${params}`);
      if (res.ok) {
        const data = await res.json();
        setIdeas(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [sourceFilter]);

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/discovery?sources=true');
      if (res.ok) {
        const data = await res.json();
        setSources(data.map((s: { name: string }) => s.name));
      }
    } catch {}
  };

  useEffect(() => {
    fetchSources();
    fetchIdeas();
  }, [fetchIdeas]);

  // ── Run discovery ──
  const runDiscovery = async () => {
    setDiscovering(true);
    setDiscoveryResult(null);
    try {
      const res = await fetch('/api/discovery', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setDiscoveryResult(`✨ ${data.data.added} new ideas found, ${data.data.skipped} duplicates skipped`);
        await fetchIdeas();
      } else {
        setDiscoveryResult(`❌ Error: ${data.error}`);
      }
    } catch {
      setDiscoveryResult('❌ Failed to run discovery');
    } finally {
      setDiscovering(false);
      setTimeout(() => setDiscoveryResult(null), 5000);
    }
  };

  // ── Discussion ──
  const openDiscussion = (idea: StartupIdea) => {
    setExpandedId(expandedId === idea.id ? null : idea.id);
    if (!chatHistory[idea.id]) {
      setChatHistory(prev => ({ ...prev, [idea.id]: [] }));
    }
  };

  const sendMessage = async (ideaId: string) => {
    if (!chatMessage.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: chatMessage, timestamp: new Date().toISOString() };
    setChatHistory(prev => ({
      ...prev,
      [ideaId]: [...(prev[ideaId] || []), userMsg],
    }));
    setChatMessage('');
    setChatLoading(true);

    try {
      const res = await fetch(`/api/discovery/${ideaId}/discuss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
      });
      if (res.ok) {
        const data = await res.json();
        const messages: ChatMessage[] = data.messages || [];
        setChatHistory(prev => ({ ...prev, [ideaId]: messages }));
      }
    } catch (e) {
      setChatHistory(prev => ({
        ...prev,
        [ideaId]: [...(prev[ideaId] || []), { role: 'assistant', content: '❌ Failed to get response.', timestamp: new Date().toISOString() }],
      }));
    } finally {
      setChatLoading(false);
    }
  };

  const filtered = ideas.filter(i => {
    if (search) {
      const q = search.toLowerCase();
      if (!i.name.toLowerCase().includes(q) && !(i.description || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown';
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="animate-fade-in space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Discovery</h1>
          <p className="text-xs text-gray-500 mt-0.5">AI-powered startup idea scanner</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="gradient"
            size="sm"
            onClick={runDiscovery}
            disabled={discovering}
          >
            {discovering ? '🔍 Scanning...' : '🔍 Run Discovery'}
          </Button>
        </div>
      </div>

      {/* Discovery result toast */}
      {discoveryResult && (
        <div className="glass rounded-xl px-4 py-2.5 text-sm text-white animate-fade-in">
          {discoveryResult}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search ideas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs !py-2 !text-xs"
        />
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSourceFilter(null)}
            className={`rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
              sourceFilter === null
                ? 'bg-indigo-500/15 text-indigo-400'
                : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300'
            }`}
          >
            All
          </button>
          {sources.map(s => (
            <button
              key={s}
              onClick={() => setSourceFilter(sourceFilter === s ? null : s)}
              className={`rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
                sourceFilter === s
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300'
              }`}
            >
              {SOURCE_FAVICONS[s] || '🌐'} {s}
            </button>
          ))}
        </div>
      </div>

      {/* Ideas grid */}
      {filtered.length === 0 ? (
        <div className="glass rounded-xl py-16 text-center">
          <p className="text-sm text-gray-600">No ideas found. Run a discovery scan first.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((idea) => {
            const isExpanded = expandedId === idea.id;
            return (
              <div key={idea.id} className="glass rounded-xl overflow-hidden hover:bg-white/[0.035] transition-all duration-200">
                {/* Card header */}
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-white truncate">{idea.name}</h3>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{idea.description || 'No description'}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    <span className="flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-gray-500">
                      {SOURCE_FAVICONS[idea.source] || '🌐'} {idea.source}
                    </span>
                    {idea.business_model && (
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${BUSINESS_COLORS[idea.business_model] || 'bg-white/[0.04] text-gray-500'}`}>
                        {idea.business_model}
                      </span>
                    )}
                    {idea.age_label && (
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${AGE_COLORS[idea.age_label] || 'bg-white/[0.04] text-gray-500'}`}>
                        {AGE_LABELS[idea.age_label] || idea.age_label}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-700 ml-auto">
                      {timeAgo(idea.first_seen_at)}
                    </span>
                  </div>

                  {/* Extra details when expanded */}
                  {isExpanded && (
                    <div className="mt-3 space-y-2 border-t border-white/[0.04] pt-3">
                      {idea.problem_solved && (
                        <div>
                          <p className="text-[9px] text-gray-700 uppercase tracking-wider">Problem</p>
                          <p className="text-xs text-gray-400 mt-0.5">{idea.problem_solved}</p>
                        </div>
                      )}
                      {idea.target_audience && (
                        <div>
                          <p className="text-[9px] text-gray-700 uppercase tracking-wider">Target</p>
                          <p className="text-xs text-gray-400 mt-0.5">{idea.target_audience}</p>
                        </div>
                      )}
                      {idea.why_noteworthy && (
                        <div>
                          <p className="text-[9px] text-gray-700 uppercase tracking-wider">Why Noteworthy</p>
                          <p className="text-xs text-gray-400 mt-0.5">{idea.why_noteworthy}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 px-4 pb-4">
                  <button
                    onClick={() => openDiscussion(idea)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all ${
                      isExpanded
                        ? 'bg-gradient-to-r from-indigo-500/15 to-violet-500/15 text-indigo-400'
                        : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-gray-200'
                    }`}
                  >
                    💬 {isExpanded ? 'Close Chat' : 'AI Discuss'}
                  </button>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : idea.id)}
                    className="rounded-lg px-3 py-1.5 text-[10px] text-gray-600 hover:bg-white/[0.04] hover:text-gray-400 transition-all"
                  >
                    {isExpanded ? 'Less' : 'Details'}
                  </button>
                </div>

                {/* ── Chat section ── */}
                {isExpanded && (
                  <div className="border-t border-white/[0.04]">
                    <div className="h-64 overflow-y-auto px-4 py-3 space-y-2.5">
                      {(chatHistory[idea.id] || []).length === 0 ? (
                        <p className="text-center text-xs text-gray-700 py-6">
                          Start a conversation about <span className="text-gray-400">{idea.name}</span>
                        </p>
                      ) : (
                        (chatHistory[idea.id] || []).map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                              msg.role === 'user'
                                ? 'bg-indigo-500/15 text-indigo-200'
                                : 'bg-white/[0.04] text-gray-300'
                            }`}>
                              {msg.content}
                            </div>
                          </div>
                        ))
                      )}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="rounded-xl bg-white/[0.04] px-3 py-2 text-xs text-gray-500">
                            <span className="animate-pulse">Thinking...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 border-t border-white/[0.04] px-4 py-3">
                      <input
                        value={expandedId === idea.id ? chatMessage : ''}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(idea.id);
                          }
                        }}
                        placeholder="Ask about this idea..."
                        className="flex-1 bg-transparent text-xs text-white placeholder:text-gray-700 focus:outline-none"
                        disabled={chatLoading}
                      />
                      <button
                        onClick={() => sendMessage(idea.id)}
                        disabled={chatLoading || !chatMessage.trim()}
                        className="rounded-lg bg-indigo-500/10 px-3 py-1.5 text-[10px] font-medium text-indigo-400 hover:bg-indigo-500/20 transition-colors disabled:opacity-30"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
