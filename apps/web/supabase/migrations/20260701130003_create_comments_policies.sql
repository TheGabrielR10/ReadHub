-- comments: SELECT — leer todos.
create policy "comments_select_all"
  on public.comments
  for select
  to public
  using (true);

-- INSERT — crear autenticado, únicamente como autor de sí mismo.
create policy "comments_insert_authenticated"
  on public.comments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- UPDATE — editar solo autor.
create policy "comments_update_own"
  on public.comments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE — eliminar autor o admin.
create policy "comments_delete_own_or_admin"
  on public.comments
  for delete
  to authenticated
  using (auth.uid() = user_id or public.is_admin());
