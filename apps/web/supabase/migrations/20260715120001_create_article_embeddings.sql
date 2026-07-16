-- Sesión 4 (RAG) — Infraestructura vectorial, fase 2: almacenamiento de embeddings.
--
-- Decisión de diseño (tabla separada 1:1 en vez de columna en "articles"):
--   * No se modifica el esquema de "articles" (restricción del laboratorio).
--   * El vector (384 floats) es una columna pesada; aislarla evita inflar las
--     consultas del listado/detalle, que nunca necesitan el embedding.
--   * article_id como PK garantiza "una única representación vectorial vigente"
--     por artículo (Prompt 5) y el ON DELETE CASCADE evita registros huérfanos.
--   * Preparada para crecer: si en el futuro se trocea el documento en chunks,
--     basta con relajar la unicidad sin rehacer la estructura.
--
-- Modelo de embeddings: Supabase/gte-small (384 dimensiones), generado en
-- servidor con Transformers.js (ver services/embedding.service.ts).
create table public.article_embeddings (
  article_id uuid primary key references public.articles (id) on delete cascade,
  content text not null,               -- texto exacto que se vectorizó (para el contexto del RAG)
  embedding vector(384) not null,      -- tipo de pgvector (resuelto por search_path)
  updated_at timestamptz not null default now()
);

-- Índice vectorial HNSW con distancia coseno.
-- Se elige HNSW sobre IVFFlat porque: (a) ofrece mejor recall/latencia en
-- volúmenes bajos-medios como el de este proyecto, y (b) no requiere datos
-- previos para "entrenar" centroides (IVFFlat sí), por lo que funciona desde
-- el primer embedding. gte-small produce vectores normalizados => coseno.
create index article_embeddings_embedding_idx
  on public.article_embeddings
  using hnsw (embedding vector_cosine_ops);

-- RLS: la tabla queda protegida como el resto del proyecto.
alter table public.article_embeddings enable row level security;

-- SELECT: un embedding es visible si su artículo lo es (público, o del autor).
-- Refleja exactamente la política de visibilidad de "articles". La escritura
-- (INSERT/UPDATE/DELETE) no tiene políticas a propósito: la indexación se hace
-- server-side con la service_role key (que salta RLS), nunca desde el cliente.
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
