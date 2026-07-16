-- =============================================================================
-- ReadHub — Esquema completo de la base de datos (referencia consolidada).
--
-- Este archivo es un espejo de lectura de las migraciones en supabase/migrations/.
-- La fuente de verdad ejecutable son las migraciones; este archivo documenta el
-- esquema completo en un único lugar para facilitar su consulta.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensiones y tipos
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto;

create type public.user_role as enum ('reader', 'writer', 'admin');

-- -----------------------------------------------------------------------------
-- profiles — extiende auth.users en relación 1:1 (mismo UUID como PK/FK).
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  birth_date date not null,
  phone text not null,
  role public.user_role not null default 'reader',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- -----------------------------------------------------------------------------
-- articles — cada artículo pertenece exactamente a un profile (author_id).
-- -----------------------------------------------------------------------------
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  summary text,
  document_path text not null,
  image_path text not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.articles enable row level security;

-- -----------------------------------------------------------------------------
-- views — cada apertura de un artículo es un evento independiente (sin contador).
-- -----------------------------------------------------------------------------
create table public.views (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now()
);

alter table public.views enable row level security;

-- -----------------------------------------------------------------------------
-- likes — un usuario solo puede registrar un "me gusta" por artículo.
-- -----------------------------------------------------------------------------
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint likes_article_id_user_id_key unique (article_id, user_id)
);

alter table public.likes enable row level security;

-- -----------------------------------------------------------------------------
-- comments — todo comentario está asociado a un artículo y a un usuario existentes.
-- -----------------------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  comment text not null check (length(btrim(comment)) > 0),
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

-- -----------------------------------------------------------------------------
-- favorites — artículos guardados por un usuario (estructura preparada).
-- -----------------------------------------------------------------------------
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.favorites enable row level security;

-- -----------------------------------------------------------------------------
-- Índices recomendados
-- -----------------------------------------------------------------------------
create index idx_articles_author_id on public.articles (author_id);
create index idx_views_article_id on public.views (article_id);
-- likes.article_id ya queda cubierto por el índice del UNIQUE (article_id, user_id).
create index idx_comments_article_id on public.comments (article_id);
create index idx_favorites_article_id on public.favorites (article_id);

-- -----------------------------------------------------------------------------
-- Sincronización auth.users → profiles
-- -----------------------------------------------------------------------------
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
