-- profiles: extiende auth.users en relación 1:1 (mismo UUID como PK/FK).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  birth_date date not null,
  phone text not null,
  role public.user_role not null default 'reader',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
