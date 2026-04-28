create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  raw_input text not null,
  type text check (type in ('income', 'expense')) not null,
  amount numeric(12, 2) not null,
  category text not null,
  description text,
  transaction_date date not null default current_date,
  created_at timestamptz default now()
);

create index if not exists idx_transactions_user_date
  on transactions (user_id, transaction_date desc);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  name text not null,
  type text check (type in ('income', 'expense', 'both')) not null,
  color text not null,
  icon text
);
