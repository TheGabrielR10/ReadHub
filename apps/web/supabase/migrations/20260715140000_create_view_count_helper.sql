-- Conteo de visualizaciones visible para todos, sin exponer las filas.
--
-- La política RLS de "views" (SELECT: solo admin o autor) oculta las filas a los
-- demás usuarios, por lo que el contador embebido devolvía 0 para artículos
-- ajenos. Esta función SECURITY DEFINER expone ÚNICAMENTE el número agregado de
-- vistas por artículo (no quién vio ni cuándo), preservando la privacidad del
-- diseño original pero mostrando un contador correcto en el listado y el detalle.
-- Mismo patrón acotado que get_user_email() / is_admin().
create or replace function public.get_article_view_counts(article_ids uuid[])
returns table (article_id uuid, count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select v.article_id, count(*)::bigint
  from public.views v
  where v.article_id = any(article_ids)
  group by v.article_id;
$$;

revoke execute on function public.get_article_view_counts(uuid[]) from public;
grant execute on function public.get_article_view_counts(uuid[]) to authenticated, anon;
