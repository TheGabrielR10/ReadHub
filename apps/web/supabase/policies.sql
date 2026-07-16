-- =============================================================================
-- ReadHub — Políticas RLS (referencia consolidada).
--
-- Espejo de lectura de las migraciones en supabase/migrations/. La fuente de
-- verdad ejecutable son las migraciones; este archivo documenta todas las
-- políticas en un único lugar para facilitar su consulta y auditoría.
--
-- Todas las tablas tienen RLS habilitado desde supabase/schema.sql. Sin una
-- política que lo permita explícitamente, el acceso queda denegado.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Función auxiliar: is_admin()
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- profiles — cada usuario únicamente puede ver y modificar su propio perfil.
-- Sin política de INSERT: la fila se crea solo vía trigger on_auth_user_created.
-- -----------------------------------------------------------------------------
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- articles
-- SELECT: todos pueden leer artículos públicos; el autor ve también los suyos.
-- INSERT: solo autenticados, como autores de sí mismos.
-- UPDATE / DELETE: solo el autor.
-- -----------------------------------------------------------------------------
create policy "articles_select_public_or_own"
  on public.articles
  for select
  to public
  using (is_public = true or auth.uid() = author_id);

create policy "articles_insert_authenticated"
  on public.articles
  for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "articles_update_own"
  on public.articles
  for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "articles_delete_own"
  on public.articles
  for delete
  to authenticated
  using (auth.uid() = author_id);

-- -----------------------------------------------------------------------------
-- comments
-- SELECT: leer todos.
-- INSERT: crear autenticado, como autor de sí mismo.
-- UPDATE: editar solo autor.
-- DELETE: eliminar autor o admin.
-- -----------------------------------------------------------------------------
create policy "comments_select_all"
  on public.comments
  for select
  to public
  using (true);

create policy "comments_insert_authenticated"
  on public.comments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "comments_update_own"
  on public.comments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "comments_delete_own_or_admin"
  on public.comments
  for delete
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- -----------------------------------------------------------------------------
-- likes
-- SELECT: lectura pública (necesaria para mostrar el conteo de "me gusta").
-- INSERT: solo autenticado, como propietario de sí mismo.
-- DELETE: solo propietario.
-- La unicidad (un like por usuario/artículo) la garantiza el UNIQUE del esquema.
-- -----------------------------------------------------------------------------
create policy "likes_select_all"
  on public.likes
  for select
  to public
  using (true);

create policy "likes_insert_authenticated"
  on public.likes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "likes_delete_own"
  on public.likes
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- views
-- SELECT: solo administradores o el autor del artículo.
-- INSERT: usuarios autenticados, como propietarios de sí mismos.
-- -----------------------------------------------------------------------------
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

create policy "views_insert_authenticated"
  on public.views
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- favorites — SELECT, INSERT y DELETE: solo el propietario.
-- -----------------------------------------------------------------------------
create policy "favorites_select_own"
  on public.favorites
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "favorites_insert_own"
  on public.favorites
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "favorites_delete_own"
  on public.favorites
  for delete
  to authenticated
  using (auth.uid() = user_id);
