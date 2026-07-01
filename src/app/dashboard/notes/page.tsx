"use client";

import { useEffect, useState } from "react";
import { Card, Button, Input } from "@/components/ui";
import { Header } from "@/components/layout";

interface Note {
  id: string; title: string; content: string; tags: string[]; created_at: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotes = async () => {
    const res = await fetch("/api/notes");
    if (res.ok) setNotes(await res.json());
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setIsLoading(true);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content, tags }) });
    setTitle(""); setContent(""); setTagsInput(""); setIsLoading(false); fetchNotes();
  };

  const deleteNote = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    fetchNotes();
  };

  useEffect(() => { fetchNotes(); }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <Header title="Notes" subtitle="Capture ideas, meetings, and long-form text" />

      <Card className="!p-4">
        <form onSubmit={addNote} className="space-y-3">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meeting Notes..." required disabled={isLoading} />
          <div>
            <label className="mb-1.5 block text-xs font-medium tracking-wide text-gray-400 uppercase">Content</label>
            <textarea
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition-all placeholder:text-gray-500 hover:border-white/20 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 min-h-[140px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here..."
              required
              disabled={isLoading}
            />
          </div>
          <Input label="Tags (comma separated)" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="work, meeting, idea..." disabled={isLoading} />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isLoading || !title || !content}>{isLoading ? "Saving..." : "Save Note"}</Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 list-enter">
        {notes.length === 0 ? (
          <p className="col-span-full py-8 text-center text-sm text-gray-500">No notes created yet.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="group flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 transition-all hover:border-white/[0.1]">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-white truncate">{note.title}</h4>
                <button onClick={() => deleteNote(note.id)} className="shrink-0 rounded-lg p-1 text-gray-600 opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100">✕</button>
              </div>
              <div className="mt-2 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-400 line-clamp-6">
                {note.content}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.04] pt-3">
                {note.tags?.map((tag, i) => (
                  <span key={i} className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">#{tag}</span>
                ))}
                <span className="ml-auto text-[11px] text-gray-600">{new Date(note.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
