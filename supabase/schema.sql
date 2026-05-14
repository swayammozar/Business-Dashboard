create extension if not exists "pgcrypto";

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  color text not null default '#38bdf8',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'TODO' check (status in ('TODO', 'DOING', 'DONE', 'BLOCKED')),
  priority text not null default 'MEDIUM' check (priority in ('LOW', 'MEDIUM', 'HIGH')),
  category text not null default 'OTHER' check (category in ('SOCIAL_MEDIA', 'CONTENT_REELS', 'WEBSITE', 'ADS', 'LEGAL_GST', 'ORDERS', 'IDEAS', 'CALLS', 'OTHER')),
  due_date timestamptz,
  is_today boolean not null default false,
  skipped_today boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.brain_dumps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  text text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists businesses_user_id_idx on public.businesses(user_id);
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_business_id_idx on public.tasks(business_id);
create index if not exists tasks_status_priority_due_date_idx on public.tasks(status, priority, due_date);
create index if not exists brain_dumps_user_id_idx on public.brain_dumps(user_id);
create index if not exists brain_dumps_business_id_idx on public.brain_dumps(business_id);

alter table public.businesses enable row level security;
alter table public.tasks enable row level security;
alter table public.brain_dumps enable row level security;

drop policy if exists "Users can manage own businesses" on public.businesses;
create policy "Users can manage own businesses"
on public.businesses
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own tasks" on public.tasks;
create policy "Users can manage own tasks"
on public.tasks
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own brain dumps" on public.brain_dumps;
create policy "Users can manage own brain dumps"
on public.brain_dumps
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists brain_dumps_set_updated_at on public.brain_dumps;
create trigger brain_dumps_set_updated_at
before update on public.brain_dumps
for each row execute function public.set_updated_at();
