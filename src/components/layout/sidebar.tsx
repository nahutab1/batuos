'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navModules = [
  { label: 'Dashboard', href: '/dashboard', icon: '◉' },
  { label: 'Tasks', href: '/dashboard/tasks', icon: '☐' },
  { label: 'Notes', href: '/dashboard/notes', icon: '◈' },
  { label: 'Memory', href: '/dashboard/memory', icon: '◇' },
  { label: 'Goals', href: '/dashboard/goals', icon: '○' },
  { label: 'Calendar', href: '/dashboard/calendar', icon: '◎' },
  { label: 'Nutrition', href: '/dashboard/nutrition', icon: '⟡' },
  { label: 'Discovery', href: '/dashboard/discovery', icon: '◈' },
  { label: 'Finance', href: '/dashboard/finance', icon: '¤' },
  { label: 'Hidden Gems', href: '/dashboard/investments', icon: '◈' },
  { label: 'Settings', href: '/dashboard/settings', icon: '✦' },
];

const navFuture = [
  { label: 'CRM', href: '#', icon: '⊞', soon: true },
  { label: 'Review', href: '#', icon: '↻', soon: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 flex h-9 w-9 items-center justify-center rounded-xl glass text-white md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-full transition-all duration-300 ease-out ${
          collapsed ? 'w-[60px]' : 'w-56'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col border-r border-white/[0.03] bg-[#07070d]/95 backdrop-blur-2xl">
          {/* Logo row */}
          <div className="flex h-14 items-center gap-2.5 border-b border-white/[0.03] px-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
              B
            </div>
            {!collapsed && (
              <span className="text-[13px] font-semibold tracking-wide text-white/90">BatuOS</span>
            )}
            <button
              className="ml-auto hidden rounded-md p-1 text-gray-600 transition-colors hover:bg-white/5 hover:text-gray-300 md:block"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? '▸' : '◂'}
            </button>
          </div>

          {/* Section: Modules */}
          {!collapsed && (
            <div className="section-badge px-4 pt-5 pb-1.5">Modules</div>
          )}
          <nav className="space-y-0.5 px-2 py-2">
            {navModules.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-indigo-500/8 to-violet-500/8 text-white'
                      : 'text-gray-500 hover:bg-white/[0.03] hover:text-gray-300'
                  }`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center text-[11px] ${
                    active ? 'text-indigo-400' : 'text-gray-600'
                  }`}>
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.label}</span>}
                  {active && !collapsed && (
                    <span className="ml-auto h-1 w-1 rounded-full bg-indigo-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Section: Coming Soon */}
          {!collapsed && (
            <div className="section-badge px-4 pt-3 pb-1.5">Coming Soon</div>
          )}
          <nav className="space-y-0.5 px-2 pb-2">
            {navFuture.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium ${
                  collapsed ? 'justify-center' : ''
                } text-gray-600 cursor-not-allowed select-none`}
                title={`${item.label} — coming soon`}
              >
                <span className="flex h-5 w-5 items-center justify-center text-[11px] text-gray-700">
                  {item.icon}
                </span>
                {!collapsed && (
                  <>
                    <span>{item.label}</span>
                    <span className="ml-auto text-[9px] tracking-wider text-gray-700 uppercase">Soon</span>
                  </>
                )}
              </div>
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom version */}
          {!collapsed && (
            <div className="border-t border-white/[0.03] px-3.5 py-3">
              <p className="text-[10px] text-gray-700">BatuOS // v0.1</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
