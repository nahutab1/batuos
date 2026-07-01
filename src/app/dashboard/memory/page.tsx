"use client";

import { useEffect, useState } from "react";
import { Card, Button, Input } from "@/components/ui";
import { Header } from "@/components/layout";

interface Memory {
  id: string; fact: string; context?: string; source: string; created_at: string;
}

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [fact, setFact] = useState("");
  const [context, setContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchMemories = async () => {
    const res = await fetch("/api/memory");
    if (res.ok) setMemories(await res.json());
  };

  const addMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fact) return;
    setIsLoading(true);
    await fetch("/api/memory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fact, context, source: 'manual' }) });
    setFact(""); setContext(""); setIsLoading(false); fetchMemories();
  };

  const deleteMemory = async (id: string) => {
    await fetch(`/api/memory/${id}`, { method: "DELETE" });
    fetchMemories();
  };

  useEffect(() => { fetchMemories(); }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <Header title="Memory" subtitle="Your long-term knowledge store" />

      <Card className="!p-4">
        <form onSubmit={addMemory} className="space-y-3">
          <Input label="New Fact" value={fact} onChange={(e) => setFact(e.target.value)} placeholder="E.g., Client prefers async communication..." required disabled={isLoading} />
          <Input label="Context" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Related to project X..." disabled={isLoading} />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isLoading || !fact}>{isLoading ? "Saving..." : "Save to Memory"}</Button>
          </div>
        </form>
      </Card>

      <div className="list-enter space-y-2">
        {memories.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No memories stored yet.</p>
        ) : (
          memories.map((m) => (
            <div key={m.id} className="group flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all hover:border-white/[0.1] hover:bg-white/[0.05]">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200">{m.fact}</p>
                {m.context && <p className="mt-1 text-sm text-gray-500">{m.context}</p>}
                <div className="mt-3 flex items-center gap-3">
                  <span className="rounded-lg bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-300">{m.source}</span>
                  <span className="text-[11px] text-gray-600">{new Date(m.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <button onClick={() => deleteMemory(m.id)} className="shrink-0 rounded-lg p-1.5 text-gray-600 opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100">✕</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
