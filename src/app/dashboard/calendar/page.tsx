'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui';

interface CalendarEvent {
  id: string; title: string; description?: string;
  start_time: string; end_time: string; is_all_day?: boolean;
  source?: string; created_at: string;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [aiAgenda, setAiAgenda] = useState<string | null>(null);
  const [agendaLoading, setAgendaLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    const [evRes, taskRes] = await Promise.all([fetch('/api/calendar'), fetch('/api/tasks')]);
    if (evRes.ok) setEvents(await evRes.json());
    if (taskRes.ok) {
      const data = await taskRes.json();
      setTasks((data.data || data || []).filter((t: any) => t.status !== 'done' && t.due_date));
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) return;
    setIsSaving(true);
    await fetch('/api/calendar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, description, source: 'manual',
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      }),
    });
    setTitle(''); setDescription(''); setStartTime(''); setEndTime('');
    setIsSaving(false); fetchEvents();
  };

  const deleteEvent = async (id: string) => {
    await fetch(`/api/calendar/${id}`, { method: 'DELETE' });
    fetchEvents();
  };

  // Takvim matematiği
  const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  const today = new Date();

  const gridDays: (number | null)[] = [];
  // Boşluklar (Pazartesi başlangıç)
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < startOffset; i++) gridDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) gridDays.push(i);
  while (gridDays.length % 7 !== 0) gridDays.push(null);

  const dayEvents = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEv = events.filter(e => e.start_time?.startsWith(dateStr));
    const dayTask = tasks.filter((t: any) => t.due_date?.startsWith(dateStr));
    return { events: dayEv, tasks: dayTask, total: dayEv.length + dayTask.length };
  };

  // AI Agenda
  const generateAgenda = async () => {
    setAgendaLoading(true);
    setAiAgenda(null);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayEv = events.filter(e => e.start_time?.startsWith(todayStr));
      const dueTasks = tasks.filter((t: any) => {
        if (!t.due_date) return false;
        const diff = Math.ceil((new Date(t.due_date).getTime() - Date.now()) / 86400000);
        return diff <= 3 && diff >= 0;
      });

      const prompt = `Today's agenda (${todayStr}):\n\nEvents:${todayEv.length === 0 ? ' None' : todayEv.map(e => `\n- ${e.title} at ${new Date(e.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)}\n\nDue soon:${dueTasks.length === 0 ? ' None' : dueTasks.map((t: any) => `\n- ${t.title} (due: ${t.due_date?.slice(0, 10)})`)}\n\nCreate a brief, encouraging agenda for Batu. Max 3 sentences. Turkish.`;

      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, system: 'You are a friendly assistant creating daily agendas.' }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiAgenda(data.text?.replace(/```/g, '').trim());
      }
    } catch {}
    finally { setAgendaLoading(false); }
  };

  const selectedInfo = selectedDay ? dayEvents(selectedDay) : null;

  const fmtTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Calendar</h1>
          <p className="text-xs text-gray-500 mt-0.5">Schedule with task integration & AI agenda</p>
        </div>
        <Button variant="gradient" size="sm" onClick={generateAgenda} disabled={agendaLoading}>
          {agendaLoading ? '...' : '🤖 Today\'s Agenda'}
        </Button>
      </div>

      {aiAgenda && (
        <div className="glass rounded-xl px-4 py-3">
          <div className="section-badge mb-1">AI Agenda</div>
          <p className="text-xs text-indigo-300/80 leading-relaxed">{aiAgenda}</p>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="glass rounded-xl px-4 py-3.5">
        {/* Month header */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); }}
            className="text-gray-600 hover:text-gray-400 text-sm">←</button>
          <span className="text-sm font-semibold text-white">{MONTHS[currentMonth]} {currentYear}</span>
          <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); }}
            className="text-gray-600 hover:text-gray-400 text-sm">→</button>
        </div>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {WEEKDAYS.map(d => <div key={d} className="text-center text-[9px] font-medium text-gray-700 py-1">{d}</div>)}
        </div>
        {/* Days */}
        <div className="grid grid-cols-7 gap-0.5">
          {gridDays.map((day, i) => {
            if (day === null) return <div key={`e${i}`} />;
            const info = dayEvents(day);
            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const isSelected = day === selectedDay;
            return (
              <button key={day} onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`text-center py-1.5 rounded-md transition-all text-xs relative ${
                  isSelected ? 'bg-indigo-500/20 text-indigo-300 font-bold ring-1 ring-indigo-500/30' :
                  isToday ? 'bg-indigo-500/10 text-indigo-300 font-semibold' :
                  'text-gray-500 hover:bg-white/[0.03]'
                }`}>
                {day}
                {info.total > 0 && <span className="block mx-auto mt-0.5 w-1 h-1 rounded-full bg-indigo-400/60" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      {selectedInfo && (selectedInfo.events.length > 0 || selectedInfo.tasks.length > 0) && (
        <div className="glass rounded-xl px-4 py-3">
          <div className="section-badge mb-2">
            {currentYear}-{String(currentMonth + 1).padStart(2, '0')}-{String(selectedDay).padStart(2, '0')}
          </div>
          <div className="space-y-1.5">
            {selectedInfo.events.map(e => (
              <div key={e.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-cyan-400/60" />
                  <span className="text-xs text-gray-300">{e.title}</span>
                  <span className="text-[10px] text-gray-600">{fmtTime(e.start_time)}</span>
                </div>
                <button onClick={() => deleteEvent(e.id)} className="text-gray-700 opacity-0 group-hover:opacity-100 hover:text-rose-400 text-[10px]">✕</button>
              </div>
            ))}
            {selectedInfo.tasks.map((t: any) => (
              <div key={t.id} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400/60" />
                <span className="text-xs text-gray-400">📋 {t.title}</span>
                <span className="text-[9px] text-gray-700">P{t.priority || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add event */}
      <div className="glass rounded-xl px-4 py-3.5">
        <div className="section-badge mb-2">New Event</div>
        <form onSubmit={addEvent} className="space-y-2">
          <div className="flex items-center gap-2">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title..." required
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-gray-700 focus:border-indigo-500/50 focus:outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} required
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-indigo-500/50 focus:outline-none" />
            <span className="text-gray-700 text-[10px]">→</span>
            <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} required
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-indigo-500/50 focus:outline-none" />
          </div>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-gray-700 focus:border-indigo-500/50 focus:outline-none" />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={!title || !startTime || !endTime}>Add</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
