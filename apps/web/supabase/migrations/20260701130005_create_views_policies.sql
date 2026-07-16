-- views: SELECT — solo administradores o el autor del artículo.
create policy "views_select_admin_or_author"
  on public.views
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.articles
      where articles.id = views.article_id
        and articles.author_id = auth.uid()
    )
  );

-- INSERT — usuarios autenticados, únicamente como propietarios de sí mismos.
create policy "views_insert_authenticated"
  on public.views
  for insert
  to authenticated
  with check (auth.uid() = user_id);
