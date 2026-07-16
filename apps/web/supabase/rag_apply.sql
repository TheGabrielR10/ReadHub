-- =============================================================================
-- Sesión 4 (RAG) — Script consolidado para aplicar la infraestructura vectorial.
--
-- Cópialo y pégalo COMPLETO en el SQL Editor de Supabase (o aplícalo con la CLI).
-- Es el mismo contenido que las 3 migraciones nuevas de supabase/migrations/:
--   20260715120000_enable_pgvector.sql
--   20260715120001_create_article_embeddings.sql
--   20260715120002_create_match_articles_function.sql
-- Es idempotente en lo esencial (extensión/función con IF NOT EXISTS / OR REPLACE).
-- =============================================================================

-- 1) Extensión pgvector -------------------------------------------------------
create extension if not exists vector with schema extensions;

-- 2) Almacenamiento de embeddings (tabla 1:1 con articles) --------------------
create table if not exists public.article_embeddings (
  article_id uuid primary key references public.articles (id) on delete cascade,
  content text not null,
  embedding vector(384) not null,
  updated_at timestamptz not null default now()
);

create index if not exists article_embeddings_embedding_idx
  on public.article_embeddings
  using hnsw (embedding vector_cosine_ops);

alter table public.article_embeddings enable row level security;

drop policy if exists "article_embeddings_select_visible" on public.article_embeddings;
create policy "article_embeddings_select_visible"
  on public.article_embeddings
  for select
  using (
    exists (
      select 1
      from public.articles a
      where a.id = article_id
        and (a.is_public or a.author_id = (select auth.uid()))
    )
  );

-- 3) Función de búsqueda por similitud ----------------------------------------
create or replace function public.match_article_embeddings(
  query_embedding vector(384),
  match_threshold float default 0.0,
  match_count int default 5
)
returns table (
  article_id uuid,
  title text,
  summary text,
  content text,
  similarity float
)
language sql
stable
as $$
  select
    e.article_id,
    a.title,
    a.summary,
    e.content,
    1 - (e.embedding <=> query_embedding) as similarity
  from public.article_embeddings e
  join public.articles a on a.id = e.article_id
  where 1 - (e.embedding <=> query_embedding) >= match_threshold
  order by e.embedding <=> query_embedding
  limit match_count;
$$;

revoke execute on function public.match_article_embeddings(vector, float, int) from public;
grant execute on function public.match_article_embeddings(vector, float, int) to authenticated, anon;
