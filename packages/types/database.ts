export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          birth_date: string;
          phone: string;
          role: "reader" | "writer" | "admin";
          created_at: string;
        };
        Insert: {
          id: string;
          birth_date: string;
          phone: string;
          role?: "reader" | "writer" | "admin";
          created_at?: string;
        };
        Update: {
          id?: string;
          birth_date?: string;
          phone?: string;
          role?: "reader" | "writer" | "admin";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      articles: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          summary: string | null;
          content: string | null;
          document_path: string | null;
          image_path: string;
          is_public: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          summary?: string | null;
          content?: string | null;
          document_path?: string | null;
          image_path: string;
          is_public?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          title?: string;
          summary?: string | null;
          content?: string | null;
          document_path?: string | null;
          image_path?: string;
          is_public?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      views: {
        Row: {
          id: string;
          article_id: string;
          user_id: string;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          user_id: string;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          article_id?: string;
          user_id?: string;
          viewed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "views_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "views_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      likes: {
        Row: {
          id: string;
          article_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          article_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "likes_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      comments: {
        Row: {
          id: string;
          article_id: string;
          user_id: string;
          comment: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          user_id: string;
          comment: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          article_id?: string;
          user_id?: string;
          comment?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      favorites: {
        Row: {
          id: string;
          article_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          article_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      article_embeddings: {
        // Sesión 4 (RAG). El vector se serializa como texto ("[0.1,0.2,...]")
        // para insertarlo/consultarlo vía PostgREST; por eso embedding es string.
        Row: {
          article_id: string;
          content: string;
          embedding: string;
          updated_at: string;
        };
        Insert: {
          article_id: string;
          content: string;
          embedding: string;
          updated_at?: string;
        };
        Update: {
          article_id?: string;
          content?: string;
          embedding?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "article_embeddings_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: true;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_email: {
        Args: { user_id: string };
        Returns: string;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_article_view_counts: {
        Args: { article_ids: string[] };
        Returns: { article_id: string; count: number }[];
      };
      match_article_embeddings: {
        // query_embedding serializado como "[...]" (mismo motivo que arriba).
        Args: {
          query_embedding: string;
          match_threshold?: number;
          match_count?: number;
        };
        Returns: {
          article_id: string;
          title: string;
          summary: string | null;
          content: string;
          similarity: number;
        }[];
      };
    };
    Enums: {
      user_role: "reader" | "writer" | "admin";
    };
  };
}
