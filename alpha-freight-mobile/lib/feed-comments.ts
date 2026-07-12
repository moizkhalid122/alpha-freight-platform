import { supabase } from "@/lib/supabase";

export type FeedComment = {
  id: string;
  distributionId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  parentCommentId?: string;
  content: string;
  likesCount: number;
  dislikesCount: number;
  createdAt: string;
  time: string;
  replies: FeedComment[];
};

type FeedCommentRow = {
  id: string;
  distribution_id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string | null;
  parent_comment_id?: string | null;
  content: string;
  likes_count?: number | null;
  dislikes_count?: number | null;
  created_at: string;
};

const isMissingTableError = (message: string) =>
  /feed_post_comments|schema cache|relation.*does not exist|could not find the table/i.test(message);

export function formatCommentTime(createdAt: string) {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  if (!Number.isFinite(ageMs) || ageMs < 0) return "Just now";
  if (ageMs < 60_000) return "Just now";
  if (ageMs < 3_600_000) return `${Math.max(1, Math.floor(ageMs / 60_000))}m`;
  if (ageMs < 86_400_000) return `${Math.max(1, Math.floor(ageMs / 3_600_000))}h`;
  return `${Math.max(1, Math.floor(ageMs / 86_400_000))}d`;
}

function mapCommentRow(row: FeedCommentRow): FeedComment {
  return {
    id: row.id,
    distributionId: row.distribution_id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorAvatar: row.author_avatar || undefined,
    parentCommentId: row.parent_comment_id || undefined,
    content: row.content,
    likesCount: row.likes_count || 0,
    dislikesCount: row.dislikes_count || 0,
    createdAt: row.created_at,
    time: formatCommentTime(row.created_at),
    replies: [],
  };
}

export function buildCommentTree(rows: FeedComment[]): FeedComment[] {
  const byId = new Map(rows.map((row) => [row.id, { ...row, replies: [] as FeedComment[] }]));
  const roots: FeedComment[] = [];

  byId.forEach((comment) => {
    if (comment.parentCommentId && byId.has(comment.parentCommentId)) {
      byId.get(comment.parentCommentId)!.replies.push(comment);
    } else if (!comment.parentCommentId) {
      roots.push(comment);
    }
  });

  return roots;
}

export async function fetchFeedComments(distributionId: string) {
  if (!distributionId.trim()) {
    return { comments: [] as FeedComment[], error: "Missing post id" };
  }

  try {
    const { data, error } = await supabase
      .from("feed_post_comments")
      .select("*")
      .eq("distribution_id", distributionId.trim())
      .order("created_at", { ascending: true });

    if (error) {
      if (isMissingTableError(error.message)) {
        return { comments: [] as FeedComment[], error: null };
      }
      return { comments: [] as FeedComment[], error: error.message };
    }

    const flat = ((data || []) as FeedCommentRow[]).map(mapCommentRow);
    return { comments: buildCommentTree(flat), error: null };
  } catch (error) {
    return {
      comments: [] as FeedComment[],
      error: error instanceof Error ? error.message : "Unable to load comments",
    };
  }
}

export function countFeedComments(comments: FeedComment[]): number {
  return comments.reduce((total, comment) => total + 1 + countFeedComments(comment.replies), 0);
}

export type SubmitFeedCommentInput = {
  distributionId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  parentCommentId?: string;
};

export async function submitFeedComment(input: SubmitFeedCommentInput) {
  const content = input.content.trim();
  if (!content) {
    return { comment: null as FeedComment | null, error: "Comment cannot be empty" };
  }

  try {
    const { data, error } = await supabase
      .from("feed_post_comments")
      .insert([
        {
          distribution_id: input.distributionId.trim(),
          author_id: input.authorId.trim(),
          author_name: input.authorName.trim(),
          author_avatar: input.authorAvatar || null,
          parent_comment_id: input.parentCommentId || null,
          content,
        },
      ])
      .select("*")
      .single();

    if (error) {
      if (isMissingTableError(error.message)) {
        return { comment: null, error: "Comments are not enabled yet. Run feed-comments.sql in Supabase." };
      }
      return { comment: null, error: error.message };
    }

    await supabase.rpc("adjust_feed_post_comments_count", {
      p_distribution_id: input.distributionId.trim(),
      p_delta: 1,
    });

    return { comment: mapCommentRow(data as FeedCommentRow), error: null };
  } catch (error) {
    return {
      comment: null,
      error: error instanceof Error ? error.message : "Unable to post comment",
    };
  }
}

export async function fetchCommenterProfile(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, company_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  const name = data?.company_name?.trim() || data?.full_name?.trim() || "Member";
  return {
    name,
    avatar: data?.avatar_url || undefined,
  };
}
