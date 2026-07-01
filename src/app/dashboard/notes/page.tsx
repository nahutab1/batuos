'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui';

interface Note {
  id: string; title: string; content: string; tags: string[]; created_at: string;
  ai_summary?: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [summaryLoading, setSummaryLoading] = useState<string | null>(null);
  const [aiTags, setAiTags] = useState<string[]>([]);

  const fetchNotes = useCallback(async () => {
    const res = await fetch('/api/notes');
    if (res.ok) setNotes(await res.json());
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  // AI auto-tag suggestion
  useEffect(() => {
    if (!content || content.length < 20) { setAiTags([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/generate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Suggest 3-5 tags for this note. Return ONLY a JSON array of short strings. No markdown.\n\nContent: ${content.slice(0, 500)}`,
            system: 'You are a tagging engine. Output only valid JSON arrays.',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setAiTags(JSON.parse(data.text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim()));
        }
      } catch {}
    }, 1200);
    return () => clearTimeout(timer);
  }, [content]);

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setIsLoading(true);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content, tags }) });
    setTitle(''); setContent(''); setTagsInput(''); setAiTags([]); setIsLoading(false); fetchNotes();
  };

  const deleteNote = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    fetchNotes();
  };

  const summarize = async (note: Note) => {
    setSummaryLoading(note.id);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Summarize in 2 sentences:\n\nTitle: ${note.title}\nContent: ${note.content.slice(0, 1500)}`,
          system: 'You are a summarization engine. Be concise.',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(prev => prev.map(n => n.id === note.id ? { ...n, ai_summary: data.text?.replace(/```/g, '').trim() } : n));
      }
    } finally { setSummaryLoading(null); }
  };

  const filtered = notes.filter(n =>
    !search || n.title.toLowerCase().includes(search) ||
    n.content.toLowerCase().includes(search) ||
    n.tags?.some(t => t.includes(search))
  );

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Notes</h1>
          <p className="text-xs text-gray-500 mt-0.5">AI auto-tags, summaries & search</p>
        </div>
      </div>

      <div className="glass rounded-xl px-4 py-3.5">
        <div className="section-badge mb-3">New Note</div>
        <form onSubmit={addNote} className="space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title..." required
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-gray-700 focus:border-indigo-500/50 focus:outline-none" />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write here... AI suggests tags automatically" required
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-gray-700 focus:border-indigo-500/50 focus:outline-none min-h-[100px]" />
          <div className="flex items-center gap-2 flex-wrap">
            <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Tags (comma separated)"
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-gray-700 focus:border-indigo-500/50 focus:outline-none" />
            {aiTags.length > 0 && !tagsInput && (
              <div className="flex items-center gap-1 flex-wrap">
                {aiTags.map(t => (
                  <button key={t} type="button" onClick={() => setTagsInput(t)}
                    className="rounded-md bg-indigo-500/10 px-2 py-1 text-[9px] text-indigo-400 hover:bg-indigo-500/20 transition-colors">
                    ✨ {t}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={!title || !content}>Save</Button>
          </div>
        </form>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search notes..."
        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-gray-700 focus:border-indigo-500/50 focus:outline-none" />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? <p className="col-span-full py-8 text-center text-xs text-gray-600">No notes.</p> : filtered.map(note => (
          <div key={note.id} className="glass rounded-xl p-4 hover:bg-white/[0.035] transition-all group">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-white truncate">{note.title}</h3>
              <button onClick={() => deleteNote(note.id)} className="shrink-0 text-gray-700 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all text-[10px]">✕</button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 line-clamp-4 leading-relaxed">{note.content}</p>
            {note.ai_summary && (
              <div className="mt-2 rounded-lg bg-indigo-500/5 px-2.5 py-1.5">
                <p className="text-[9px] text-gray-700 uppercase">AI Summary</p>
                <p className="text-[11px] text-indigo-300/80 mt-0.5">{note.ai_summary}</p>
              </div>
            )}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04]">
              <div className="flex items-center gap-1.5 flex-wrap">
                {note.tags?.map((t, i) => <span key={i} className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">#{t}</span>)}
                <span className="text-[9px] text-gray-700">{new Date(note.created_at).toLocaleDateString()}</span>
              </div>
              {!note.ai_summary && (
                <button onClick={() => summarize(note)} disabled={summaryLoading === note.id}
                  className="text-[9px] text-indigo-400 hover:text-indigo-300 disabled:opacity-30">✨ Summarize</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
