-- Friendships: request / accept model. Progress & notes stay private.

create type friendship_status as enum (
  'pending',
  'accepted',
  'declined'
);

alter type notification_type add value if not exists 'friend_request';
alter type notification_type add value if not exists 'friend_accepted';

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_no_self check (requester_id <> addressee_id)
);

-- One edge per unordered pair
create unique index friendships_pair_uidx
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

create index friendships_requester_idx on public.friendships (requester_id, status);
create index friendships_addressee_idx on public.friendships (addressee_id, status);

create trigger friendships_set_updated_at
  before update on public.friendships
  for each row execute function public.set_updated_at();

create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friendships f
    where f.status = 'accepted'
      and (
        (f.requester_id = a and f.addressee_id = b)
        or (f.requester_id = b and f.addressee_id = a)
      )
  );
$$;

grant execute on function public.are_friends(uuid, uuid) to authenticated, anon;

-- Notify addressee / requester without exposing notification insert to clients
create or replace function public.notify_friendship_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_name text;
  addressee_name text;
begin
  select coalesce(display_name, username, 'Someone')
    into requester_name
  from public.profiles
  where id = new.requester_id;

  select coalesce(display_name, username, 'Someone')
    into addressee_name
  from public.profiles
  where id = new.addressee_id;

  if tg_op = 'INSERT' and new.status = 'pending' then
    insert into public.notifications (user_id, type, title, message, metadata)
    values (
      new.addressee_id,
      'friend_request',
      'Friend request',
      requester_name || ' sent you a friend request.',
      jsonb_build_object(
        'friendship_id', new.id,
        'requester_id', new.requester_id
      )
    );
  elsif tg_op = 'UPDATE'
    and old.status = 'pending'
    and new.status = 'accepted'
  then
    insert into public.notifications (user_id, type, title, message, metadata)
    values (
      new.requester_id,
      'friend_accepted',
      'Friend request accepted',
      addressee_name || ' accepted your friend request.',
      jsonb_build_object(
        'friendship_id', new.id,
        'addressee_id', new.addressee_id
      )
    );
  end if;

  return new;
end;
$$;

create trigger friendships_notify
  after insert or update of status on public.friendships
  for each row execute function public.notify_friendship_change();

alter table public.friendships enable row level security;

create policy "Participants can view friendships"
  on public.friendships for select
  using (
    auth.uid() = requester_id
    or auth.uid() = addressee_id
  );

create policy "Users can send friend requests"
  on public.friendships for insert
  with check (
    auth.uid() = requester_id
    and status = 'pending'
  );

create policy "Addressee can respond to requests"
  on public.friendships for update
  using (
    auth.uid() = addressee_id
    or auth.uid() = requester_id
  )
  with check (
    auth.uid() = addressee_id
    or auth.uid() = requester_id
  );

create policy "Participants can delete friendships"
  on public.friendships for delete
  using (
    auth.uid() = requester_id
    or auth.uid() = addressee_id
  );

-- Friends (and pending-request peers) can view each other's profiles
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;

create policy "Profiles are viewable when public, own, friends, or pending"
  on public.profiles for select
  using (
    is_public = true
    or auth.uid() = id
    or public.are_friends(auth.uid(), id)
    or exists (
      select 1
      from public.friendships f
      where f.status = 'pending'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = profiles.id)
          or (f.addressee_id = auth.uid() and f.requester_id = profiles.id)
        )
    )
  );
