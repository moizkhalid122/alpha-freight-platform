-- Alpha Freight Copilot Features (run in Supabase SQL editor)
-- Extends ai-chat-history.sql with feedback, handoff, and analytics

create table if not exists public.ai_chat_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  message_id text,
  feedback text not null check (feedback in ('up', 'down')),
  assistant_type text not null default 'general',
  query text,
  reply_title text,
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_feedback_user_idx on public.ai_chat_feedback (user_id, created_at desc);
create index if not exists ai_chat_feedback_type_idx on public.ai_chat_feedback (assistant_type, feedback);

alter table public.ai_chat_feedback enable row level security;

drop policy if exists "Users insert own feedback" on public.ai_chat_feedback;
create policy "Users insert own feedback"
  on public.ai_chat_feedback for insert to authenticated
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Users read own feedback" on public.ai_chat_feedback;
create policy "Users read own feedback"
  on public.ai_chat_feedback for select to authenticated
  using (auth.uid() = user_id);

grant insert, select on public.ai_chat_feedback to authenticated;

create table if not exists public.ai_handoff_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  message text,
  assistant_type text not null default 'general',
  status text not null default 'pending' check (status in ('pending', 'contacted', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists ai_handoff_user_idx on public.ai_handoff_requests (user_id, created_at desc);

alter table public.ai_handoff_requests enable row level security;

drop policy if exists "Users manage own handoffs" on public.ai_handoff_requests;
create policy "Users manage own handoffs"
  on public.ai_handoff_requests for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant insert, select on public.ai_handoff_requests to authenticated;
