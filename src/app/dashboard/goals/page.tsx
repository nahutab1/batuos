"use client";

import { useEffect, useState } from "react";
import { Card, Button, Input } from "@/components/ui";
import { Header } from "@/components/layout";

interface Goal {
  id: string; title: string; description?: string; target_date?: string; progress: number; status: string; created_at: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchGoals = async () => {
    const res = await fetch("/api/goals");
    if (res.ok) setGoals(await res.json());
  };

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setIsLoading(true);
    await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, target_date: targetDate ? new Date(targetDate).toISOString() : null }) });
    setTitle(""); setDescription(""); setTargetDate(""); setIsLoading(false); fetchGoals();
  };

  const deleteGoal = async (id: string) => {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    fetchGoals();
  };

  const updateProgress = async (id: string, current: number, change: number) => {
    const p = Math.max(0, Math.min(100, current + change));
    await fetch(`/api/goals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ progress: p }) });
    fetchGoals();
  };

  useEffect(() => { fetchGoals(); }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <Header title="Goals" subtitle="Track your objectives and progress" />

      <Card className="!p-4">
        <form onSubmit={addGoal} className="space-y-3">
          <Input label="Goal Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="E.g., Launch startup MVP..." required disabled={isLoading} />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Focus on core features..." disabled={isLoading} />
          <Input label="Target Date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} disabled={isLoading} />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isLoading || !title}>{isLoading ? "Saving..." : "Create Goal"}</Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 list-enter">
        {goals.length === 0 ? (
          <p className="col-span-2 py-8 text-center text-sm text-gray-500">No goals defined yet.</p>
        ) : (
          goals.map((g) => (
            <div key={g.id} className="group flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 transition-all hover:border-white/[0.1]">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-white">{g.title}</h4>
                <button onClick={() => deleteGoal(g.id)} className="shrink-0 rounded-lg p-1 text-gray-600 opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100">✕</button>
              </div>
              {g.description && <p className="mt-1 text-sm text-gray-500">{g.description}</p>}

              <div className="mt-4 flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Progress</span>
                  <span className="font-semibold text-amber-400">{g.progress}%</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-white/5">
                  <div className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500" style={{ width: `${g.progress}%` }} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/[0.04] pt-3">
                <span className="text-xs text-gray-500">{g.target_date ? `Target: ${new Date(g.target_date).toLocaleDateString()}` : 'No target date'}</span>
                <div className="flex gap-1">
                  <button onClick={() => updateProgress(g.id, g.progress, -10)} disabled={g.progress <= 0} className="rounded-lg bg-white/5 px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-white/10 disabled:opacity-30">-10%</button>
                  <button onClick={() => updateProgress(g.id, g.progress, 10)} disabled={g.progress >= 100} className="rounded-lg bg-amber-500/10 px-2 py-1 text-xs text-amber-300 transition-colors hover:bg-amber-500/20 disabled:opacity-30">+10%</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
