-- articles: SELECT — todos pueden leer artículos públicos; el autor además
-- puede ver los suyos aunque aún no sean públicos.
create policy "articles_select_public_or_own"
  on public.articles
  for select
  to public
  using (is_public = true or auth.uid() = author_id);

-- INSERT — solo usuarios autenticados, y únicamente como autores de sí mismos.
create policy "articles_insert_authenticated"
  on public.articles
  for insert
  to authenticated
  with check (auth.uid() = author_id);

-- UPDATE — solo el autor.
create policy "articles_update_own"
  on public.articles
  for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- DELETE — solo el autor.
create policy "articles_delete_own"
  on public.articles
  for delete
  to authenticated
  using (auth.uid() = author_id);
