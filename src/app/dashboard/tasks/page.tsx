"use client";

import { useEffect, useState } from "react";
import { Card, Button, Input } from "@/components/ui";
import { Header } from "@/components/layout";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isReprioritizing, setIsReprioritizing] = useState(false);

  const fetchTasks = async () => {
    const res = await fetch("/api/tasks");
    if (res.ok) {
       const body = await res.json();
       const list = body.data || body;
       setTasks((Array.isArray(list) ? list : []).sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0)));
    }
  };

  const addTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title) return;
    await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
    setTitle("");
    fetchTasks();
  };

  const addAiTask = async () => {
    if (!title) return;
    setIsAiLoading(true);
    try {
      await fetch("/api/tasks/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: title }) });
      setTitle("");
      fetchTasks();
    } finally { setIsAiLoading(false); }
  };

  const reprioritize = async () => {
    setIsReprioritizing(true);
    try {
      await fetch("/api/ai/reprioritize", { method: "POST" });
      await fetchTasks();
    } finally { setIsReprioritizing(false); }
  };

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    fetchTasks();
  };

  const toggleTask = async (id: string) => {
    await fetch(`/api/tasks?id=${id}`, { method: "PATCH" });
    fetchTasks();
  };

  useEffect(() => { fetchTasks(); }, []);

  const priorityColor = (p: number) => {
    if (p > 75) return 'from-rose-500 to-pink-600 bg-rose-500/10 text-rose-300 border-rose-500/20';
    if (p > 40) return 'from-amber-500 to-orange-600 bg-amber-500/10 text-amber-300 border-amber-500/20';
    return 'from-gray-500 to-gray-600 bg-white/5 text-gray-400 border-white/10';
  };

  return (
    <div className="animate-fade-in space-y-6">
      <Header
        title="Tasks"
        subtitle="AI-prioritized task management"
        action={
          <Button
            variant="gradient"
            size="sm"
            onClick={reprioritize}
            disabled={isReprioritizing || tasks.length === 0}
          >
            {isReprioritizing ? "Prioritizing..." : "AI Reprioritize"}
          </Button>
        }
      />

      {/* Add form */}
      <Card className="!p-4">
        <form onSubmit={addTask} className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              label="New Task"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Call the client tomorrow..."
              disabled={isAiLoading}
            />
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={addAiTask} disabled={isAiLoading || !title}>
            {isAiLoading ? "Parsing..." : "AI Parse"}
          </Button>
          <Button type="submit" size="sm" disabled={isAiLoading || !title}>
            Add
          </Button>
        </form>
      </Card>

      {/* Task list */}
      <div className="list-enter space-y-2">
        {tasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No tasks yet. Create one above.</p>
        ) : (
          tasks.map((t) => (
            <div
              key={t.id}
              className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 ${
                t.status === 'done'
                  ? 'border-white/[0.03] bg-white/[0.02] opacity-50'
                  : 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.1] hover:bg-white/[0.05]'
              }`}
            >
              <button
                onClick={() => toggleTask(t.id)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                  t.status === 'done'
                    ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
                    : 'border-white/20 hover:border-indigo-400/50'
                }`}
              >
                {t.status === 'done' && <span className="text-[10px]">✓</span>}
              </button>

              <span className={`flex-1 text-sm ${
                t.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-200'
              }`}>
                {t.title}
              </span>

              <div className="flex items-center gap-2">
                {t.due_date && (
                  <span className="rounded-lg bg-white/5 px-2 py-1 text-[11px] text-gray-400">
                    {new Date(t.due_date).toLocaleDateString()}
                  </span>
                )}
                {t.priority !== undefined && (
                  <span className={`rounded-lg border bg-gradient-to-r px-2.5 py-1 text-[11px] font-semibold ${priorityColor(t.priority)}`}>
                    P{t.priority}
                  </span>
                )}
                <button
                  onClick={() => deleteTask(t.id)}
                  className="ml-1 rounded-lg p-1.5 text-gray-600 opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
