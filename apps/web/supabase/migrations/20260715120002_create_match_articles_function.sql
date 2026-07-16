-- Sesión 4 (RAG) — Infraestructura vectorial, fase 3: función de búsqueda.
--
-- Encapsula la lógica de similitud vectorial para que los Services la reutilicen
-- (Prompt 6). Recibe el embedding de la consulta, calcula la similitud coseno,
-- devuelve el Top-K ordenado por relevancia y filtrado por un umbral mínimo.
--
-- SECURITY INVOKER (por defecto): la función se ejecuta con los permisos del
-- llamante, por lo que la RLS de "article_embeddings" y de "articles" se aplica
-- a quien consulta. El JOIN a "articles" garantiza que la recuperación solo
-- devuelva artículos que el usuario puede ver (respeta la seguridad existente).
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
