-- =============================================================================
-- ReadHub — Validación de políticas RLS.
--
-- Cómo ejecutarlo:
--   psql "<connection-string>" -f supabase/validate_rls.sql
--   (o pegar el contenido completo en el SQL Editor de Supabase y ejecutar).
--
-- Requiere conectarse con un rol que pueda usar SET ROLE (el rol por defecto
-- en el SQL Editor de Supabase y en las cadenas de conexión del dashboard
-- cumple esto). No requiere que exista ningún dato previo: crea sus propios
-- usuarios/artículos de prueba (prefijo 'aaaaaaaa-'/'bbbbbbbb-'/'cccccccc-')
-- y los elimina automáticamente al final mediante ROLLBACK, sin dejar rastro
-- ni interferir con datos reales o con supabase/seed.sql.
--
-- Cada prueba simula una sesión (SET ROLE + request.jwt.claim.sub, tal como
-- describe la documentación oficial de Supabase para probar RLS) y compara
-- el resultado obtenido contra el resultado esperado según supabase/policies.sql.
-- Escenarios cubiertos en las 6 tablas: usuario autenticado, usuario no
-- autenticado, autor del recurso, usuario sin permisos y administrador.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Utilidades de prueba (viven en pg_temp: desaparecen solas al cerrar la sesión).
-- -----------------------------------------------------------------------------
create temporary table test_results (
  name text,
  passed boolean
);

create function pg_temp.assert_true(test_name text, condition boolean)
returns void
language plpgsql
as $$
begin
  insert into test_results values (test_name, condition);
  if condition then
    raise notice 'PASS — %', test_name;
  else
    raise warning 'FAIL — % (resultado no coincide con lo esperado)', test_name;
  end if;
end;
$$;

-- Ejecuta una consulta como un usuario simulado y devuelve el número de filas.
create function pg_temp.rows_as(p_role text, p_user_id uuid, p_sql text)
returns int
language plpgsql
as $$
declare
  n int;
begin
  execute format('set role %I', p_role);
  perform set_config('request.jwt.claim.sub', coalesce(p_user_id::text, ''), true);
  execute p_sql into n;
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
  return n;
end;
$$;

-- Intenta ejecutar una sentencia como un usuario simulado; retorna 'allowed' o 'blocked'.
create function pg_temp.attempt_as(p_role text, p_user_id uuid, p_sql text)
returns text
language plpgsql
as $$
begin
  execute format('set role %I', p_role);
  perform set_config('request.jwt.claim.sub', coalesce(p_user_id::text, ''), true);
  begin
    execute p_sql;
    reset role;
    perform set_config('request.jwt.claim.sub', '', true);
    return 'allowed';
  exception when others then
    reset role;
    perform set_config('request.jwt.claim.sub', '', true);
    return 'blocked';
  end;
end;
$$;

-- -----------------------------------------------------------------------------
-- Datos de prueba (insertados como propietario de la tabla, bypasa RLS).
-- -----------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'rls-test-admin@readhub.test', crypt('Password123!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"birth_date":"1990-01-01","phone":"3000000001","role":"admin"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
   'rls-test-author@readhub.test', crypt('Password123!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"birth_date":"1990-01-01","phone":"3000000002","role":"writer"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-4000-8000-000000000003', 'authenticated', 'authenticated',
   'rls-test-other@readhub.test', crypt('Password123!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"birth_date":"1990-01-01","phone":"3000000003","role":"reader"}',
   now(), now(), '', '', '', '');

-- auth.users dispara on_auth_user_created, que ya crea los profiles.
do $$
begin
  perform pg_temp.assert_true(
    'setup: el trigger on_auth_user_created creó los 3 profiles de prueba',
    (select count(*) from public.profiles where id in (
      'aaaaaaaa-0000-4000-8000-000000000001',
      'aaaaaaaa-0000-4000-8000-000000000002',
      'aaaaaaaa-0000-4000-8000-000000000003'
    )) = 3
  );
end $$;

insert into public.articles (id, author_id, title, document_path, image_path, is_public) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002', 'Artículo público de prueba', '/doc-pub.pdf', '/img-pub.jpg', true),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000002', 'Artículo privado de prueba', '/doc-priv.pdf', '/img-priv.jpg', false);

-- =====================================================================
-- PROFILES — cada usuario ve/edita únicamente su propio perfil.
-- =====================================================================
select pg_temp.assert_true(
  'profiles [autor del recurso]: el usuario ve solo su propio perfil (1 fila)',
  pg_temp.rows_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000002', 'select count(*) from public.profiles') = 1
);

select pg_temp.assert_true(
  'profiles [usuario no autenticado]: anon no ve ningún perfil (0 filas)',
  pg_temp.rows_as('anon', null, 'select count(*) from public.profiles') = 0
);

do $$
begin
  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000002', true);
  set role authenticated;
  update public.profiles set phone = '999' where id = 'aaaaaaaa-0000-4000-8000-000000000003';
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
end $$;
select pg_temp.assert_true(
  'profiles [usuario sin permisos]: no se puede editar el perfil de otro usuario',
  (select phone from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000003') = '3000000003'
);

-- =====================================================================
-- ARTICLES
-- =====================================================================
select pg_temp.assert_true(
  'articles [usuario no autenticado]: anon solo ve el artículo público (1 fila)',
  pg_temp.rows_as('anon', null,
    $q$select count(*) from public.articles where id in ('bbbbbbbb-0000-4000-8000-000000000001','bbbbbbbb-0000-4000-8000-000000000002')$q$
  ) = 1
);

select pg_temp.assert_true(
  'articles [autor del recurso]: el autor ve también su artículo privado (2 filas)',
  pg_temp.rows_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000002',
    $q$select count(*) from public.articles where id in ('bbbbbbbb-0000-4000-8000-000000000001','bbbbbbbb-0000-4000-8000-000000000002')$q$
  ) = 2
);

select pg_temp.assert_true(
  'articles [usuario sin permisos]: un usuario ajeno no ve el artículo privado (1 fila)',
  pg_temp.rows_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000003',
    $q$select count(*) from public.articles where id in ('bbbbbbbb-0000-4000-8000-000000000001','bbbbbbbb-0000-4000-8000-000000000002')$q$
  ) = 1
);

select pg_temp.assert_true(
  'articles [usuario autenticado]: puede crear su propio artículo',
  pg_temp.attempt_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000003',
    $q$insert into public.articles (author_id, title, document_path, image_path) values ('aaaaaaaa-0000-4000-8000-000000000003', 'Propio', '/d.pdf', '/i.jpg')$q$
  ) = 'allowed'
);

select pg_temp.assert_true(
  'articles [usuario sin permisos]: no puede crear un artículo suplantando a otro autor',
  pg_temp.attempt_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000003',
    $q$insert into public.articles (author_id, title, document_path, image_path) values ('aaaaaaaa-0000-4000-8000-000000000002', 'Suplantado', '/d.pdf', '/i.jpg')$q$
  ) = 'blocked'
);

do $$
begin
  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000003', true);
  set role authenticated;
  update public.articles set title = 'Hackeado' where id = 'bbbbbbbb-0000-4000-8000-000000000001';
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
end $$;
select pg_temp.assert_true(
  'articles [usuario sin permisos]: no puede editar el artículo de otro autor',
  (select title from public.articles where id = 'bbbbbbbb-0000-4000-8000-000000000001') <> 'Hackeado'
);

do $$
begin
  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000002', true);
  set role authenticated;
  update public.articles set title = 'Editado por su autor' where id = 'bbbbbbbb-0000-4000-8000-000000000001';
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
end $$;
select pg_temp.assert_true(
  'articles [autor del recurso]: el autor puede editar su propio artículo',
  (select title from public.articles where id = 'bbbbbbbb-0000-4000-8000-000000000001') = 'Editado por su autor'
);

do $$
begin
  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000003', true);
  set role authenticated;
  delete from public.articles where id = 'bbbbbbbb-0000-4000-8000-000000000001';
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
end $$;
select pg_temp.assert_true(
  'articles [usuario sin permisos]: no puede borrar el artículo de otro autor',
  (select count(*) from public.articles where id = 'bbbbbbbb-0000-4000-8000-000000000001') = 1
);

-- =====================================================================
-- COMMENTS
-- =====================================================================
select pg_temp.assert_true(
  'comments [usuario autenticado]: puede comentar un artículo público',
  pg_temp.attempt_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000003',
    $q$insert into public.comments (id, article_id, user_id, comment) values ('cccccccc-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000003', 'Comentario de prueba')$q$
  ) = 'allowed'
);

select pg_temp.assert_true(
  'comments [usuario no autenticado]: anon puede leer los comentarios (política "leer todos")',
  pg_temp.rows_as('anon', null,
    $q$select count(*) from public.comments where id = 'cccccccc-0000-4000-8000-000000000001'$q$
  ) = 1
);

select pg_temp.assert_true(
  'comments [usuario sin permisos]: no puede comentar suplantando a otro usuario',
  pg_temp.attempt_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000003',
    $q$insert into public.comments (article_id, user_id, comment) values ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002', 'Suplantado')$q$
  ) = 'blocked'
);

do $$
begin
  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000002', true);
  set role authenticated;
  delete from public.comments where id = 'cccccccc-0000-4000-8000-000000000001';
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
end $$;
select pg_temp.assert_true(
  'comments [usuario sin permisos]: un usuario sin permisos no puede borrar el comentario de otro',
  (select count(*) from public.comments where id = 'cccccccc-0000-4000-8000-000000000001') = 1
);

do $$
begin
  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', true);
  set role authenticated;
  delete from public.comments where id = 'cccccccc-0000-4000-8000-000000000001';
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
end $$;
select pg_temp.assert_true(
  'comments [administrador]: un admin puede borrar el comentario de cualquier usuario',
  (select count(*) from public.comments where id = 'cccccccc-0000-4000-8000-000000000001') = 0
);

-- =====================================================================
-- LIKES
-- =====================================================================
select pg_temp.assert_true(
  'likes [usuario autenticado]: puede dar "me gusta" a un artículo',
  pg_temp.attempt_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000003',
    $q$insert into public.likes (article_id, user_id) values ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000003')$q$
  ) = 'allowed'
);

select pg_temp.assert_true(
  'likes [usuario no autenticado]: anon puede leer el conteo de likes',
  pg_temp.rows_as('anon', null,
    $q$select count(*) from public.likes where article_id = 'bbbbbbbb-0000-4000-8000-000000000001' and user_id = 'aaaaaaaa-0000-4000-8000-000000000003'$q$
  ) = 1
);

select pg_temp.assert_true(
  'likes [usuario sin permisos]: no puede dar "me gusta" suplantando a otro usuario',
  pg_temp.attempt_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000002',
    $q$insert into public.likes (article_id, user_id) values ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000003')$q$
  ) = 'blocked'
);

select pg_temp.assert_true(
  'likes [restricción UNIQUE]: un segundo "me gusta" del mismo usuario sobre el mismo artículo es rechazado',
  pg_temp.attempt_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000003',
    $q$insert into public.likes (article_id, user_id) values ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000003')$q$
  ) = 'blocked'
);

do $$
begin
  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000003', true);
  set role authenticated;
  delete from public.likes where article_id = 'bbbbbbbb-0000-4000-8000-000000000001' and user_id = 'aaaaaaaa-0000-4000-8000-000000000003';
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
end $$;
select pg_temp.assert_true(
  'likes [propietario]: el propietario puede quitar su propio "me gusta"',
  (select count(*) from public.likes where article_id = 'bbbbbbbb-0000-4000-8000-000000000001' and user_id = 'aaaaaaaa-0000-4000-8000-000000000003') = 0
);

-- =====================================================================
-- VIEWS
-- =====================================================================
select pg_temp.assert_true(
  'views [usuario autenticado]: puede registrar su propia visualización',
  pg_temp.attempt_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000003',
    $q$insert into public.views (article_id, user_id) values ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000003')$q$
  ) = 'allowed'
);

select pg_temp.assert_true(
  'views [usuario sin permisos]: no puede registrar una visualización suplantando a otro usuario',
  pg_temp.attempt_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000003',
    $q$insert into public.views (article_id, user_id) values ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002')$q$
  ) = 'blocked'
);

select pg_temp.assert_true(
  'views [usuario sin permisos]: un usuario que no es autor ni admin no ve las visualizaciones',
  pg_temp.rows_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000003', 'select count(*) from public.views') = 0
);

select pg_temp.assert_true(
  'views [autor del recurso]: el autor del artículo sí ve sus visualizaciones',
  pg_temp.rows_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000002', 'select count(*) from public.views') = 1
);

select pg_temp.assert_true(
  'views [administrador]: un admin ve las visualizaciones de cualquier artículo',
  pg_temp.rows_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001', 'select count(*) from public.views') = 1
);

-- =====================================================================
-- FAVORITES
-- =====================================================================
select pg_temp.assert_true(
  'favorites [propietario]: puede guardar y ver su propio favorito',
  pg_temp.attempt_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000003',
    $q$insert into public.favorites (article_id, user_id) values ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000003')$q$
  ) = 'allowed'
);

select pg_temp.assert_true(
  'favorites [usuario sin permisos]: no ve los favoritos de otro usuario',
  pg_temp.rows_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000002', 'select count(*) from public.favorites') = 0
);

select pg_temp.assert_true(
  'favorites [usuario sin permisos]: no puede guardar un favorito suplantando a otro usuario',
  pg_temp.attempt_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000002',
    $q$insert into public.favorites (article_id, user_id) values ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000003')$q$
  ) = 'blocked'
);

-- -----------------------------------------------------------------------------
-- Resumen
-- -----------------------------------------------------------------------------
do $$
declare
  v_total int;
  v_passed int;
begin
  select count(*), count(*) filter (where passed) into v_total, v_passed from test_results;
  raise notice '=================================================================';
  raise notice 'RESULTADO: % / % pruebas superadas', v_passed, v_total;
  if v_passed < v_total then
    raise warning '% prueba(s) fallida(s) — revisar los mensajes FAIL anteriores', v_total - v_passed;
  else
    raise notice 'Todas las políticas RLS se comportan según lo especificado.';
  end if;
  raise notice '=================================================================';
end $$;

-- Deshace todos los datos de prueba (usuarios, profiles, articles, etc.).
-- El resultado de las pruebas ya quedó impreso arriba; la base queda intacta.
rollback;
