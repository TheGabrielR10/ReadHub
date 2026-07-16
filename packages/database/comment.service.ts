// Service para operaciones sobre comentarios.
// Recibe el cliente de Supabase por inyección (browser o server) para poder
// usarse tanto desde hooks de cliente como desde Server Components.

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@readhub/types/database";
import type { CommentWithAuthor } from "@readhub/types/comment";

type Client = SupabaseClient<Database>;

interface CommentRow {
  id: string;
  article_id: string;
  user_id: string;
  comment: string;
  created_at: string;
}

// El esquema no expone un nombre de usuario; get_user_email() (SECURITY DEFINER,
// ver migración 20260706005100) resuelve el email para mostrarlo como autor.
async function resolveAuthorEmails(
  client: Client,
  userIds: string[]
): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(userIds));
  const entries = await Promise.all(
    uniqueIds.map(async (userId) => {
      const { data } = await client.rpc("get_user_email", { user_id: userId });
      return [userId, data ?? ""] as const;
    })
  );
  return new Map(entries);
}

function toCommentWithAuthor(
  row: CommentRow,
  emailMap: Map<string, string>
): CommentWithAuthor {
  return {
    id: row.id,
    articleId: row.article_id,
    comment: row.comment,
    createdAt: row.created_at,
    author: {
      id: row.user_id,
      email: emailMap.get(row.user_id) ?? "",
    },
  };
}

export const commentService = {
  getComments: async (
    client: Client,
    articleId: string
  ): Promise<CommentWithAuthor[]> => {
    const { data, error } = await client
      .from("comments")
      .select("id, article_id, user_id, comment, created_at")
      .eq("article_id", articleId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    if (!data) return [];

    const emailMap = await resolveAuthorEmails(
      client,
      data.map((row) => row.user_id)
    );

    return data.map((row) => toCommentWithAuthor(row, emailMap));
  },

  createComment: async (
    client: Client,
    articleId: string,
    userId: string,
    comment: string
  ): Promise<CommentWithAuthor> => {
    const { data, error } = await client
      .from("comments")
      .insert({ article_id: articleId, user_id: userId, comment })
      .select("id, article_id, user_id, comment, created_at")
      .single();

    if (error) throw error;

    const emailMap = await resolveAuthorEmails(client, [userId]);
    return toCommentWithAuthor(data, emailMap);
  },

  updateComment: async (
    client: Client,
    commentId: string,
    comment: string
  ): Promise<void> => {
    const { error } = await client
      .from("comments")
      .update({ comment })
      .eq("id", commentId);

    if (error) throw error;
  },

  deleteComment: async (client: Client, commentId: string): Promise<void> => {
    const { error } = await client.from("comments").delete().eq("id", commentId);
    if (error) throw error;
  },
};
