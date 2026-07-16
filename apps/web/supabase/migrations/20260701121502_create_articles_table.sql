-- articles: cada artículo pertenece exactamente a un profile (author_id).
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
