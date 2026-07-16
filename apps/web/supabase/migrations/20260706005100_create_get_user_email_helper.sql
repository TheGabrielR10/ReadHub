-- Expone únicamente el email de auth.users (necesario para mostrar "Autor" en
-- los artículos, per Flujo 4/8.2). El esquema no tiene un campo de nombre de
-- usuario y no se debe alterar la tabla profiles para agregarlo. Mismo patrón
-- de seguridad que is_admin(): SECURITY DEFINER acotado a un único campo,
-- sin exponer el resto de auth.users.
create or replace function public.get_user_email(user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email from auth.users where id = user_id;
$$;

revoke execute on function public.get_user_email(uuid) from public;
grant execute on function public.get_user_email(uuid) to authenticated, anon;
