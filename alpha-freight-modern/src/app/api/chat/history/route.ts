import { NextRequest, NextResponse } from "next/server";
import { createAuthedSupabaseFromRequest } from "@/lib/admin-api-db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = createAuthedSupabaseFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ conversations: [] });
  }

  const assistantType = request.nextUrl.searchParams.get("assistantType") || "carrier";

  const { data, error } = await supabase
    .from("ai_chat_conversations")
    .select("id, title, updated_at, created_at")
    .eq("user_id", user.id)
    .eq("assistant_type", assistantType)
    .order("updated_at", { ascending: false })
    .limit(40);

  if (error) {
    return NextResponse.json({ conversations: [] });
  }

  return NextResponse.json({
    conversations: (data || []).map((row) => ({
      id: row.id,
      title: row.title || "New chat",
      updatedAt: row.updated_at,
      createdAt: row.created_at,
    })),
  });
}

export async function POST(request: NextRequest) {
  const supabase = createAuthedSupabaseFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  const assistantType = typeof body.assistantType === "string" ? body.assistantType : "carrier";

  if (conversationId) {
    const { data: messages, error } = await supabase
      .from("ai_chat_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(120);

    if (error) {
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({
      messages: (messages || []).map((row) => {
        const content = row.content as Record<string, unknown>;
        if (row.role === "user") {
          return { id: row.id, role: "user", content: String(content.text || ""), createdAt: row.created_at };
        }
        return {
          id: row.id,
          role: "assistant",
          content: String(content.sectionLabel || content.title || ""),
          structuredMessage: content.structured || null,
          createdAt: row.created_at,
        };
      }),
    });
  }

  const { data: conv, error: createError } = await supabase
    .from("ai_chat_conversations")
    .insert({ user_id: user.id, assistant_type: assistantType, title: "New chat" })
    .select("id")
    .single();

  if (createError || !conv) {
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }

  return NextResponse.json({ conversationId: conv.id });
}

export async function DELETE(request: NextRequest) {
  const supabase = createAuthedSupabaseFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversationId = request.nextUrl.searchParams.get("id");
  if (!conversationId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await supabase.from("ai_chat_conversations").delete().eq("id", conversationId).eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
