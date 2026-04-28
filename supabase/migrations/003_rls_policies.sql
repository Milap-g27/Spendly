alter table transactions enable row level security;

create policy "Users see own transactions"
  on transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table categories enable row level security;

create policy "Users see global + own categories"
  on categories for select
  using (user_id is null or auth.uid() = user_id);

create policy "Users manage own categories"
  on categories for insert
  with check (auth.uid() = user_id);

create policy "Users update own categories"
  on categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own categories"
  on categories for delete
  using (auth.uid() = user_id);
