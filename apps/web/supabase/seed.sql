-- =============================================================================
-- ReadHub — Datos de prueba.
--
-- Pensado para ejecutarse tras las migraciones sobre un proyecto Supabase
-- (p. ej. `supabase db reset`, que aplica migrations/ y luego este archivo).
-- Se ejecuta con privilegios que bypasean RLS (rol postgres/service_role),
-- por lo que los INSERT no necesitan simular sesiones autenticadas.
--
-- Contraseña de todos los usuarios de prueba: Password123!
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Usuarios de prueba (auth.users)
--
-- Solo se inserta en auth.users: el trigger on_auth_user_created (definido en
-- supabase/migrations) crea automáticamente el profile correspondiente,
-- leyendo birth_date/phone/role desde raw_user_meta_data.
--
-- auth.identities se completa también para que los usuarios puedan iniciar
-- sesión con email/password una vez exista la pantalla de login (sesiones
-- posteriores), siguiendo el esquema estándar de Supabase Auth.
-- -----------------------------------------------------------------------------
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated', 'authenticated',
    'admin@readhub.test',
    crypt('Password123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"birth_date":"1985-03-12","phone":"3001110001","role":"admin"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated', 'authenticated',
    'writer1@readhub.test',
    crypt('Password123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"birth_date":"1992-07-24","phone":"3001110002","role":"writer"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated', 'authenticated',
    'writer2@readhub.test',
    crypt('Password123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"birth_date":"1990-11-02","phone":"3001110003","role":"writer"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-4444-444444444444',
    'authenticated', 'authenticated',
    'reader1@readhub.test',
    crypt('Password123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"birth_date":"1998-05-30","phone":"3001110004","role":"reader"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '55555555-5555-5555-5555-555555555555',
    'authenticated', 'authenticated',
    'reader2@readhub.test',
    crypt('Password123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"birth_date":"2001-09-18","phone":"3001110005","role":"reader"}',
    now(), now(), '', '', '', ''
  );

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id,
  u.id::text,
  format('{"sub":"%s","email":"%s"}', u.id::text, u.email)::jsonb,
  'email',
  now(), now(), now()
from auth.users u
where u.id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);

-- -----------------------------------------------------------------------------
-- Artículos
-- writer1 (22222222…) publica 2 artículos públicos.
-- writer2 (33333333…) publica 1 artículo público y 1 privado (is_public = false),
-- útil para probar la política "el autor también ve sus artículos privados".
-- -----------------------------------------------------------------------------
insert into public.articles (id, author_id, title, summary, document_path, image_path, is_public, created_at) values
  (
    'a1111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Cómo empezar con Next.js 15',
    'Una introducción práctica al App Router y sus principales novedades.',
    '/storage/articles/a1111111/documento.txt',
    '/storage/articles/a1111111/portada.jpg',
    true,
    now() - interval '5 days'
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'Row Level Security explicado con ejemplos',
    'Qué es RLS en PostgreSQL y por qué es clave para proteger datos multiusuario.',
    '/storage/articles/a2222222/documento.pdf',
    '/storage/articles/a2222222/portada.jpg',
    true,
    now() - interval '3 days'
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'Arquitectura escalable con Supabase',
    'Patrones de organización de esquema y migraciones para proyectos que crecen.',
    '/storage/articles/a3333333/documento.docx',
    '/storage/articles/a3333333/portada.jpg',
    true,
    now() - interval '2 days'
  ),
  (
    'a4444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    'Borrador: ideas para la próxima serie de artículos',
    'Notas preliminares aún no publicadas.',
    '/storage/articles/a4444444/documento.txt',
    '/storage/articles/a4444444/portada.jpg',
    false,
    now() - interval '1 day'
  );

-- -----------------------------------------------------------------------------
-- Comentarios (solo sobre artículos públicos)
-- -----------------------------------------------------------------------------
insert into public.comments (article_id, user_id, comment, created_at) values
  ('a1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Muy claro, justo lo que necesitaba para arrancar.', now() - interval '4 days'),
  ('a1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', '¿Podrías profundizar en los Server Components?', now() - interval '4 days'),
  ('a2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Los ejemplos de políticas me sirvieron mucho, gracias.', now() - interval '2 days'),
  ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Buen resumen de la arquitectura, lo recomendaré al equipo.', now() - interval '1 day');

-- -----------------------------------------------------------------------------
-- Likes (respetan UNIQUE(article_id, user_id))
-- -----------------------------------------------------------------------------
insert into public.likes (article_id, user_id, created_at) values
  ('a1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', now() - interval '4 days'),
  ('a1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', now() - interval '4 days'),
  ('a1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', now() - interval '3 days'),
  ('a2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', now() - interval '2 days'),
  ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', now() - interval '1 day'),
  ('a3333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', now() - interval '1 day');

-- -----------------------------------------------------------------------------
-- Visualizaciones (cada apertura es un evento independiente, sin contador)
-- -----------------------------------------------------------------------------
insert into public.views (article_id, user_id, viewed_at) values
  ('a1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', now() - interval '4 days'),
  ('a1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', now() - interval '2 days'),
  ('a1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', now() - interval '4 days'),
  ('a1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', now() - interval '3 days'),
  ('a2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', now() - interval '2 days'),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', now() - interval '2 days'),
  ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', now() - interval '1 day'),
  ('a3333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', now() - interval '1 day'),
  ('a3333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', now() - interval '12 hours');

-- -----------------------------------------------------------------------------
-- Favoritos
-- -----------------------------------------------------------------------------
insert into public.favorites (article_id, user_id, created_at) values
  ('a1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', now() - interval '4 days'),
  ('a3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', now() - interval '1 day');
