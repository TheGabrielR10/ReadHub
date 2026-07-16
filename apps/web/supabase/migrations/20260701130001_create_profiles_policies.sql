-- profiles: cada usuario únicamente puede ver y modificar su propio perfil.
-- No existe política de INSERT: la fila se crea únicamente mediante el
-- trigger on_auth_user_created (SECURITY DEFINER, no sujeto a RLS).
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
