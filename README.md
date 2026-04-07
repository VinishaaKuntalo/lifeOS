# LifeOS

Production-ready personal operating system built with Next.js 14, TypeScript, Tailwind CSS, Supabase, React Query, Zustand, Recharts, TipTap, and dnd-kit.

## Features

- Auth: email/password, Google OAuth, SSR-safe sessions, profile bootstrap
- Dashboard: aggregated cross-domain metrics and charts
- Habits: CRUD, streaks, heatmap, timezone-safe daily logging
- Tasks: GTD buckets, projects, subtasks, drag-and-drop, keyboard quick capture
- Goals: SMART goals, milestones, linked habits/tasks, progress rollups
- Journal: TipTap editor, mood tagging, search, streaks, word counts
- Health: metrics logging, 7/30/90-day charts, BMI
- Finance: transactions, budgets, recurring flags, CSV import
- Insights: abstract weekly digest provider
- Settings: profile settings, data export, account deletion path
- PWA: installable manifest, service worker, offline fallback

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`

## Required Environment Variables

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Local Setup

1. Use Node 20+.
2. Install dependencies with `npm install`.
3. Create `.env.local` from `.env.example`.
4. Apply the baseline schema in [supabase/migrations/20260406221500_initial_schema.sql](/Users/vinishaareddy/Desktop/lifeOS/supabase/migrations/20260406221500_initial_schema.sql) to your Supabase project.
5. In Supabase Auth, enable Email and Google providers.
6. Set the site URL to your app domain and add `/auth/callback` as a redirect URL.
7. Run `npm run dev`.

## Architecture

- `src/app`: App Router entry points, route groups, route handlers, offline page
- `src/features`: Feature modules with isolated `components`, `services`, `hooks`, `schemas`, and `types`
- `src/components`: Shared UI, layout, and PWA registration components
- `src/lib`: Environment, logging, utilities, Supabase clients, and shared constants
- `src/providers`: React Query, theme, and app-level client providers
- `supabase/migrations`: SQL schema, triggers, indexes, and RLS policies

## Deploy To Vercel

1. Create a Supabase project and run the baseline migration.
2. In Vercel, import this repository as a Next.js project.
3. Add the same environment variables from `.env.local` to Vercel.
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel production URL.
5. In Supabase Auth, add your Vercel production URL and callback URL.
6. Deploy.

## Notes

- Account deletion currently requires `SUPABASE_SERVICE_ROLE_KEY` to be present.
- The service worker provides a basic offline shell and offline fallback page.
- Before production cutover, run `npm audit` and review the reported vulnerabilities in your exact deployment environment.
