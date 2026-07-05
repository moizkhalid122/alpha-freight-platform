-- Phase 4 v2: allow multiple saved AI chats per user (run after ai-chat-history.sql).

drop index if exists public.ai_chat_conversations_user_assistant_idx;

create index if not exists ai_chat_conversations_user_updated_idx
  on public.ai_chat_conversations (user_id, assistant_type, updated_at desc);
