-- Inserta automáticamente el profile correspondiente cuando Supabase Auth crea un usuario.
-- birth_date, phone y role se leen de los metadatos enviados en el registro (auth.signUp).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, birth_date, phone, role)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'birth_date')::date,
    new.raw_user_meta_data ->> 'phone',
    coalesce(new.raw_user_meta_data ->> 'role', 'reader')::public.user_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
