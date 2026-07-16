-- handle_new_user solo debe ejecutarse desde el trigger on_auth_user_created,
-- nunca vía RPC pública.
revoke execute on function public.handle_new_user() from public;

-- is_admin() solo se usa internamente en políticas "to authenticated"
-- (comments_delete_own_or_admin, views_select_admin_or_author); anon no lo necesita.
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
