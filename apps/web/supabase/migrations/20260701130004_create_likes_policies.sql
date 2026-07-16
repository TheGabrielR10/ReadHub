-- likes: SELECT — lectura pública. No está restringida en la especificación
-- y es necesaria para mostrar el conteo de "me gusta" de cada artículo.
create policy "likes_select_all"
  on public.likes
  for select
  to public
  using (true);

-- INSERT — solo autenticado, únicamente como propietario de sí mismo.
create policy "likes_insert_authenticated"
  on public.likes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- DELETE — solo propietario.
create policy "likes_delete_own"
  on public.likes
  for delete
  to authenticated
  using (auth.uid() = user_id);
