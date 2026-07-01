"use client";

import { useEffect, useState } from "react";
import { Card, Button, Input } from "@/components/ui";
import { Header } from "@/components/layout";

interface Event {
  id: string; title: string; description?: string; start_time: string; end_time: string; is_all_day?: boolean; created_at: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchEvents = async () => {
    const res = await fetch("/api/calendar");
    if (res.ok) setEvents(await res.json());
  };

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) return;
    setIsLoading(true);
    await fetch("/api/calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, start_time: new Date(startTime).toISOString(), end_time: new Date(endTime).toISOString() }) });
    setTitle(""); setDescription(""); setStartTime(""); setEndTime(""); setIsLoading(false); fetchEvents();
  };

  const deleteEvent = async (id: string) => {
    await fetch(`/api/calendar/${id}`, { method: "DELETE" });
    fetchEvents();
  };

  useEffect(() => { fetchEvents(); }, []);

  const fmt = (d: string) => new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="animate-fade-in space-y-6">
      <Header title="Calendar" subtitle="Manage your schedule and events" />

      <Card className="!p-4">
        <form onSubmit={addEvent} className="space-y-3">
          <Input label="Event Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Doctor appointment..." required disabled={isLoading} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required disabled={isLoading} />
            <Input label="End" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required disabled={isLoading} />
          </div>
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Location, details..." disabled={isLoading} />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isLoading || !title || !startTime || !endTime}>{isLoading ? "Saving..." : "Add Event"}</Button>
          </div>
        </form>
      </Card>

      <div className="list-enter space-y-2">
        {events.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No events scheduled.</p>
        ) : (
          events.map((e) => (
            <div key={e.id} className="group flex items-start gap-4 rounded-2xl border-l-[3px] border-l-cyan-500/50 border border-white/[0.06] bg-white/[0.03] p-4 transition-all hover:border-white/[0.1]">
              <div className="flex-1">
                <h4 className="font-semibold text-white">{e.title}</h4>
                <p className="mt-1 text-sm font-medium text-cyan-400">{fmt(e.start_time)} — {fmt(e.end_time)}</p>
                {e.description && <p className="mt-2 text-sm text-gray-500">{e.description}</p>}
              </div>
              <button onClick={() => deleteEvent(e.id)} className="shrink-0 rounded-lg p-1.5 text-gray-600 opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100">✕</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
