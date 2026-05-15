# Business CMD Dashboard

A personal business command dashboard that can be hosted as a static site on GitHub Pages and uses Supabase as the backend.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- GitHub Pages hosting
- Supabase Auth
- Supabase Postgres database through REST API

No Vercel. No Prisma runtime. No custom server.

## Supabase Setup

1. Create a Supabase project.
2. In Supabase, open **SQL Editor**.
3. Paste and run the SQL from:

   ```text
   supabase/schema.sql
   ```

4. In Supabase, go to **Project Settings** -> **API**.
5. Copy:

   ```text
   Project URL
   anon public key
   ```

6. Create `.env` from `.env.example`:

   ```bash
   cp .env.example .env
   ```

7. Put those values in `.env`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   NEXT_PUBLIC_BASE_PATH=""
   ```

8. Run locally:

   ```bash
   npm install
   npm run dev
   ```

When you sign up in the app, click **Create starter workspace** to add the default businesses and tasks.

## GitHub Pages Setup

1. Create a GitHub repository.
2. Push this project to GitHub.
3. In the repo, go to **Settings** -> **Secrets and variables** -> **Actions** -> **Variables**.
4. Add these repository variables:

   ```text
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

`NEXT_PUBLIC_BASE_PATH` is optional locally. GitHub Actions automatically uses the repository name for the live GitHub Pages path.

5. Go to **Settings** -> **Pages**.
6. Set source to **GitHub Actions**.
7. Push to `main`. GitHub Actions builds the static site and deploys it.

## Features

- Supabase signup/login
- User-scoped businesses, tasks, brain dump items, and habits
- Business dashboard with progress and priority task
- Today Mode capped at 5 important tasks
- Brain Dump capture and convert
- All Tasks and Completed Tasks views
- Habit Tracker with editable habits, daily check-ins, and 7-day progress
- Social Media task category included
- Responsive dark command-center UI

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run verify
```
