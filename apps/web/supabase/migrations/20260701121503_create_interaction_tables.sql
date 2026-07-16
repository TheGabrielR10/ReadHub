-- views: cada apertura de un artículo es un evento independiente (sin contador).
create table public.views (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now()
);

alter table public.views enable row level security;

-- likes: un usuario solo puede registrar un "me gusta" por artículo.
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint likes_article_id_user_id_key unique (article_id, user_id)
);

alter table public.likes enable row level security;

-- comments: todo comentario está asociado a un artículo y a un usuario existentes.
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  comment text not null check (length(btrim(comment)) > 0),
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

-- favorites: artículos guardados por un usuario (estructura preparada, sin UI en el MVP).
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.favorites enable row level security;
