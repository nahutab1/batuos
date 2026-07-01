import { ReactNode } from 'react';
import { Sidebar } from './sidebar';

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="min-h-screen transition-all duration-300 md:ml-56">
        <div className="mx-auto max-w-7xl px-3 py-3 pt-16 md:px-6 md:py-5 md:pt-5">
          {children}
        </div>
      </main>
    </div>
  );
}
