# BatuOS

A modular personal operating system built with Next.js 15, TypeScript, TailwindCSS, Supabase, Gemini AI, and Telegram integration.

## Architecture

```
src/
├── core/           # DI container, interfaces, base types, event bus
├── modules/        # Isolated feature modules
│   ├── tasks/      # AI-prioritized task management
│   ├── notes/      # Note-taking
│   ├── memory/     # Long-term fact storage
│   ├── goals/      # Objective tracking
│   └── calendar/   # Event management
├── plugins/        # Extension points for external integrations
├── components/     # Shared React components
│   ├── ui/         # Generic UI elements (Button, Card, Input, Modal)
│   ├── layout/     # Layout wrappers (Sidebar, Header, Shell)
│   └── modules/    # Module-specific UI widgets
├── lib/            # Utility functions, DB client, API wrappers
└── app/
    ├── api/        # Next.js API routes per module
    │   ├── tasks/
    │   ├── notes/
    │   ├── memory/
    │   ├── goals/
    │   ├── calendar/
    │   ├── telegram/
    │   └── ai/
    └── dashboard/  # Dashboard page
```

## Core Concepts

### Dependency Injection

All modules register services with a central DI container (`/core/di.ts`). UI and API routes resolve services by token, never by direct import of concrete implementations.

### Module Isolation

Every module is self-contained with its own:
- **types.ts** — TypeScript interfaces
- **service.ts** — Business logic
- **repository.ts** — Data access layer
- **index.ts** — Public API (barrel export)

Modules communicate through interfaces resolved via DI or the event bus. Adding a module never requires modifying core code.

### Event Bus

A lightweight pub/sub system (`/core/event-bus.ts`) enables loose inter-module communication.

## Modules

| Module   | Purpose                        |
|----------|--------------------------------|
| Tasks    | AI-prioritized task management |
| Notes    | Rich text notes                |
| Memory   | Long-term knowledge store      |
| Goals    | High-level objective tracking  |
| Calendar | Time-based event management    |

## Tech Stack

- **Next.js 15** — App Router, Server Components, API Routes
- **TypeScript** — Strict mode
- **TailwindCSS 4** — Utility-first styling
- **Supabase** — Postgres DB + Auth + Realtime
- **Gemini API** — AI task prioritization, NLP task creation
- **Telegraf** — Telegram Bot SDK for message capture

## Setup

1. `cp .env.example .env.local` — fill in your keys
2. Run `schema.sql` in Supabase SQL editor
3. `npm install`
4. `npm run dev`

## Adding a New Module

1. Create folder `src/modules/<name>/`
2. Add `types.ts`, `service.ts`, `repository.ts`, `index.ts`
3. Register service in `src/core/module-registry.ts`
4. Add API route at `src/app/api/<name>/route.ts`
5. Add UI widget in `src/components/modules/`

No core code changes needed.
