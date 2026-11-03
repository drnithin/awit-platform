-- Arogya World India Trust Program MIS: the online store for real figures and donor pages.
-- Run once in Supabase: open the project, choose SQL Editor, New query, paste all of this, and press Run.

create table if not exists public.datasets (
  key text primary key,                 -- "mis", "govandi", "hcltech"
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);

alter table public.datasets enable row level security;

-- The dashboards read these figures. They hold program totals and donor indicators only, never names or photos.
drop policy if exists "read published figures" on public.datasets;
create policy "read published figures" on public.datasets for select using (true);

-- Only signed-in team members can add or change figures. Create their accounts under Authentication, Users,
-- and turn off "Allow new users to sign up" under Authentication, Sign In / Providers, so no one else can make an account.
drop policy if exists "team adds figures" on public.datasets;
create policy "team adds figures" on public.datasets for insert to authenticated with check (true);
drop policy if exists "team changes figures" on public.datasets;
create policy "team changes figures" on public.datasets for update to authenticated using (true) with check (true);
