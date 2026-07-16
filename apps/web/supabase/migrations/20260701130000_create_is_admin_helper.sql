-- Determina si el usuario autenticado tiene rol admin.
-- SECURITY DEFINER evita la recursión de RLS al consultar profiles desde
-- políticas definidas en otras tablas (comments, views).
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
