-- Supabase otorga EXECUTE por defecto a anon/authenticated/service_role al crear
-- funciones (ALTER DEFAULT PRIVILEGES), independientemente de PUBLIC. Hay que
-- revocar explícitamente de cada rol.

-- handle_new_user: solo debe ejecutarse desde el trigger on_auth_user_created.
revoke execute on function public.handle_new_user() from anon, authenticated;

-- is_admin: solo se usa internamente en políticas "to authenticated"
-- (comments_delete_own_or_admin, views_select_admin_or_author); anon no lo necesita.
revoke execute on function public.is_admin() from anon;
