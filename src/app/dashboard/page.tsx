'use client';

import { useState } from 'react';
import Link from 'next/link';

/* ─── Static data ─── */

const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const modules = [
  { name: 'Tasks', icon: '☐', href: '/dashboard/tasks', color: 'from-indigo-500 to-violet-600', count: '7', label: 'pending' },
  { name: 'Notes', icon: '◈', href: '/dashboard/notes', color: 'from-emerald-500 to-teal-600', count: '5', label: 'recent' },
  { name: 'Memory', icon: '◇', href: '/dashboard/memory', color: 'from-purple-500 to-pink-600', count: '8', label: 'facts' },
  { name: 'Goals', icon: '○', href: '/dashboard/goals', color: 'from-amber-500 to-orange-600', count: '3', label: 'active' },
  { name: 'Calendar', icon: '◎', href: '/dashboard/calendar', color: 'from-cyan-500 to-blue-600', count: '2', label: 'upcoming' },
  { name: 'Nutrition', icon: '⟡', href: '/dashboard/nutrition', color: 'from-rose-500 to-pink-600', count: '—', label: 'track' },
  { name: 'Discovery', icon: '◈', href: '/dashboard/discovery', color: 'from-indigo-500 to-purple-600', count: '—', label: 'scan' },
  { name: 'Finance', icon: '¤', href: '/dashboard/finance', color: 'from-emerald-500 to-teal-600', count: '18', label: 'assets' },
  { name: 'Hidden Gems', icon: '◈', href: '/dashboard/investments', color: 'from-rose-500 to-pink-600', count: '—', label: 'AI scan' },
  { name: 'CRM', icon: '⊞', href: '#', color: 'from-gray-600 to-gray-700', count: '—', label: 'soon' },
];

const blockers = [
  { title: 'Term sheet review', owner: 'Ali', stuck: 3, hot: true },
  { title: 'Essay draft — ai productivity', owner: 'You', stuck: 5, hot: true },
  { title: 'Finance module design', owner: 'You', stuck: 2, hot: false },
  { title: 'Atlas reference check', owner: 'Ali', stuck: 7, hot: false },
];

const goalsInit = [
  { name: 'Daily coding', category: 'Build', total: 5 },
  { name: 'Read / learn', category: 'Mind', total: 1 },
  { name: 'Exercise', category: 'Body', total: 4 },
  { name: 'Ship something', category: 'Output', total: 3 },
];

/** Build week-aligned dates for the mini calendar */
function getWeekDates(): number[] {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monOffset = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + monOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d.getDate();
  });
}

export default function DashboardPage() {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const weekDates = getWeekDates();
  const todayDate = now.getDate();

  const [focus, setFocus] = useState('');
  const [capture, setCapture] = useState('');
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggleCheck = (name: string) => {
    setChecked((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="space-y-0.5 animate-fade-in">

      {/* ── 01 // OPERATOR ── */}
      <div className="flex items-center justify-between px-0.5 py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-600/20 text-xs font-bold text-indigo-300 ring-1 ring-white/10">
            B
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Batu</p>
            <p className="text-[11px] text-gray-600">Operator • Istanbul</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="streak-badge">0 DAYS</div>
          <div className="flex items-center gap-1.5">
            <span className="status-dot status-dot-online animate-pulse-dot" />
            <span className="text-[10px] font-medium text-green-500/80">ONLINE</span>
          </div>
        </div>
      </div>

      {/* ── 02 // SESSION ── */}
      <section className="glass rounded-xl px-4 py-3.5 glass-hover">
        <div className="section-badge mb-2">Session</div>
        <p className="text-lg font-semibold text-white">
          Good afternoon, Batu.
        </p>
        <p className="text-[11px] text-gray-600 tracking-wide">
          {dayName}, {dateStr}
        </p>

        <div className="mt-3 flex items-center gap-3">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider shrink-0">Today I will</span>
          <input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Set today's one thing..."
            className="flex-1 bg-transparent border-b border-white/5 py-1 text-sm text-white placeholder:text-gray-600 focus:border-indigo-500/40 focus:outline-none transition-colors"
          />
          <button className="rounded-lg bg-indigo-500/10 px-3 py-1.5 text-[11px] font-medium text-indigo-400 hover:bg-indigo-500/20 transition-colors">
            Capture
          </button>
        </div>
      </section>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-1">

        {/* ── LEFT COLUMN (2/3) ── */}
        <div className="lg:col-span-2 space-y-3">

          {/* 03 // HABITS */}
          <section className="glass rounded-xl px-4 py-3.5 glass-hover">
            <div className="flex items-center justify-between mb-2">
              <div className="section-badge">Habits</div>
              <span className="text-[10px] text-gray-600">
                DAILY SCORE <span className="text-amber-400 font-bold">
                  {goalsInit.filter(g => checked[g.name]).length}</span>
                <span className="text-gray-700"> • RESETS 00:00</span>
              </span>
            </div>
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-full"
                  style={{ background: i < 2 ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.05)' }}
                />
              ))}
            </div>
            <p className="text-[10px] text-gray-600 mb-3">
              Start with one. <span className="text-gray-700 italic">— consistency compounds</span>
            </p>
            <div className="space-y-2">
              {goalsInit.map((g) => {
                const done = checked[g.name] ? 1 : 0;
                return (
                  <div key={g.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-4 w-4 rounded border flex items-center justify-center cursor-pointer transition-all duration-150 ${
                          checked[g.name]
                            ? 'bg-indigo-500 border-indigo-500'
                            : 'border-white/10 bg-white/[0.03] hover:border-indigo-500/40'
                        }`}
                        onClick={() => toggleCheck(g.name)}
                      >
                        {checked[g.name] && <span className="text-[8px] text-white font-bold">✓</span>}
                      </div>
                      <span className={`text-xs transition-colors ${checked[g.name] ? 'text-gray-600 line-through' : 'text-gray-400 group-hover:text-gray-300'}`}>
                        {g.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-700">{g.category}</span>
                      <span className="text-[10px] font-medium text-gray-500">{done}/{g.total}</span>
                      <div className="w-12 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                          style={{ width: `${(done / g.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 04 // CALENDAR */}
          <section className="glass rounded-xl px-4 py-3.5 glass-hover">
            <div className="flex items-center justify-between mb-2">
              <div className="section-badge">Calendar</div>
              <span className="text-[10px] text-gray-700">JUNE 2026</span>
            </div>
            <div className="grid grid-cols-7 gap-0.5 mb-3">
              {weekDays.map((d) => (
                <div key={d} className="text-center text-[9px] font-medium text-gray-700 py-1">{d}</div>
              ))}
              {weekDates.map((d, i) => (
                <div
                  key={i}
                  className={`text-center text-xs py-1.5 rounded-md transition-colors ${
                    d === todayDate
                      ? 'bg-indigo-500/15 text-indigo-300 font-bold'
                      : 'text-gray-500 hover:bg-white/[0.03]'
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-400/60" />
                <span className="text-[11px] text-gray-400">Design review • 14:00</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-400/60" />
                <span className="text-[11px] text-gray-400">Sync w/ Ali • 16:00</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400/60" />
                <span className="text-[11px] text-gray-400">Ship task parser v2</span>
              </div>
            </div>
          </section>

          {/* 05 // KEY BLOCKERS */}
          <section className="glass rounded-xl px-4 py-3.5 glass-hover">
            <div className="flex items-center justify-between mb-2">
              <div className="section-badge">Key Blockers</div>
              <span className="text-xs font-medium text-gray-600">{blockers.length} active</span>
            </div>
            <div className="space-y-1.5">
              {blockers.map((b) => (
                <div key={b.title} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`status-dot ${b.hot ? 'status-dot-hot' : 'status-dot-warm'} shrink-0`} />
                    <span className="text-xs text-gray-400 truncate">{b.title}</span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 ml-2">
                    <span className="text-[10px] text-gray-700">OWNER {b.owner}</span>
                    <span className="text-[10px] text-gray-600">STUCK {b.stuck}d</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* ── RIGHT COLUMN (1/3) ── */}
        <div className="space-y-3">

          {/* 06 // MODULES — compact card list */}
          <section className="glass rounded-xl px-4 py-3.5 glass-hover">
            <div className="flex items-center justify-between mb-2">
              <div className="section-badge">Modules</div>
              <span className="text-[10px] text-gray-700">{modules.filter(m => m.label !== 'soon').length} active</span>
            </div>
            <div className="space-y-0.5">
              {modules.map((mod) => {
                const isSoon = mod.label === 'soon';
                return isSoon ? (
                  <div key={mod.name} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-gray-700 cursor-not-allowed select-none">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br ${mod.color} text-[9px] text-white font-bold`}>
                      {mod.icon}
                    </div>
                    <span className="flex-1">{mod.name}</span>
                    <span className="text-[10px] font-medium text-gray-800">{mod.count}</span>
                    <span className="text-[9px] text-gray-800">{mod.label}</span>
                  </div>
                ) : (
                  <Link key={mod.name} href={mod.href} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-gray-400 hover:bg-white/[0.02] hover:text-gray-200 cursor-pointer transition-all duration-200">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br ${mod.color} text-[9px] text-white font-bold`}>
                      {mod.icon}
                    </div>
                    <span className="flex-1">{mod.name}</span>
                    <span className="text-[10px] font-medium text-gray-600">{mod.count}</span>
                    <span className="text-[9px] text-gray-700">{mod.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Quick stats */}
          <section className="glass rounded-xl px-4 py-3.5 glass-hover">
            <div className="section-badge mb-2">Overview</div>
            <div className="space-y-2">
              {[
                { label: 'Focus streak', value: '0 days', color: 'text-amber-400' },
                { label: 'Tasks completed', value: '12 this week', color: 'text-indigo-400' },
                { label: 'Ideas discovered', value: '8 new', color: 'text-emerald-400' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-600">{s.label}</span>
                  <span className={`text-xs font-semibold ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>

      {/* ── TICKER ── */}
      <div className="glass rounded-xl px-4 py-2.5 mt-1 flex items-center justify-between">
        <div className="ticker">
          <span>BTC <span className="text-gray-400">$64,120</span></span>
          <span>NDX <span className="text-gray-400">18,240</span></span>
          <span>XAU <span className="text-gray-400">$2,384</span></span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-700">
          <span>{dayName.toUpperCase()} {todayDate}, 2026</span>
          <span className="text-gray-800">|</span>
          <span className="text-gray-600">
            {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            <span className="text-gray-800"> LOCAL</span>
          </span>
        </div>
      </div>

      {/* ── CAPTURE BAR ── */}
      <div className="glass rounded-xl px-4 py-3 mt-1 flex items-center gap-3">
        <span className="text-[10px] font-medium text-gray-700 uppercase tracking-wider shrink-0">Capture</span>
        <input
          value={capture}
          onChange={(e) => setCapture(e.target.value)}
          placeholder="Task, note, memory or goal..."
          className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-700 focus:outline-none"
        />
        <div className="flex items-center gap-2">
          {['task:', 'note:', 'goal:'].map((prefix) => (
            <span key={prefix} className="text-[10px] text-gray-700 font-mono hover:text-gray-500 cursor-pointer transition-colors">
              {prefix}
            </span>
          ))}
        </div>
        <button className="rounded-lg bg-indigo-500/10 px-3 py-1.5 text-[11px] font-medium text-indigo-400 hover:bg-indigo-500/20 transition-colors">
          Send
        </button>
      </div>

    </div>
  );
}
