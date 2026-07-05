-- Run in Supabase SQL editor for Alpha Freight AI chat history (Phase 4).

create table if not exists public.ai_chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  assistant_type text not null default 'carrier',
  title text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_conversations_user_updated_idx
  on public.ai_chat_conversations (user_id, assistant_type, updated_at desc);

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_chat_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_messages_conversation_idx
  on public.ai_chat_messages (conversation_id, created_at asc);

alter table public.ai_chat_conversations enable row level security;
alter table public.ai_chat_messages enable row level security;

drop policy if exists "Users manage own ai conversations" on public.ai_chat_conversations;
create policy "Users manage own ai conversations"
  on public.ai_chat_conversations
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own ai messages" on public.ai_chat_messages;
create policy "Users manage own ai messages"
  on public.ai_chat_messages
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.ai_chat_conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.ai_chat_conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.ai_chat_conversations to authenticated;
grant select, insert, update, delete on public.ai_chat_messages to authenticated;
