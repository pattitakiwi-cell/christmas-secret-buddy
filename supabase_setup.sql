-- Christmas Secret Buddy 2026
-- Run the whole file in Supabase SQL Editor.
create table if not exists public.members (
  member_no int primary key check (member_no between 1 and 38),
  nickname text not null unique
);
insert into public.members(member_no,nickname) values
(1,'กิต'),(2,'เท็น'),(3,'แบมโบ'),(4,'ต้นปาล์ม'),(5,'บ๊อบบี้'),(6,'มาสเตอร์'),(7,'ธรรมะ'),(8,'จิมมี่'),(9,'ปันปัน'),(10,'สุดเขต'),
(11,'ออโต้'),(12,'คิม'),(13,'เจเจ'),(14,'กานต์'),(15,'นนท์'),(16,'ภาส'),(17,'คอปเตอร์'),(18,'จิม'),(19,'ตั้น'),(20,'สตางค์'),
(21,'อาอิง'),(22,'คณิน'),(23,'เก็บตุน'),(24,'โปรแกรม'),(25,'ต้นน้ำ'),(26,'ลิลลี่'),(27,'กีวี่'),(28,'น้ำอิง'),(29,'หมิงหมิง'),(30,'ใบข้าว'),
(31,'ลูกกอล์ฟ'),(32,'แบมแบม'),(33,'ติว'),(34,'เซย่า'),(35,'นีออน'),(36,'ลิตเติ้ล'),(37,'ครูสา'),(38,'ครูผักกาด')
on conflict (member_no) do update set nickname=excluded.nickname;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  member_no int not null unique references public.members(member_no),
  created_at timestamptz not null default now()
);
create table if not exists public.buddy_links (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  owner_no int not null unique references public.members(member_no),
  buddy_no int not null unique references public.members(member_no),
  created_at timestamptz not null default now(),
  constraint no_self_buddy check(owner_no <> buddy_no)
);
create table if not exists public.wishlists (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check(length(title) between 1 and 100),
  detail text check(length(detail)<=500),
  url text,
  created_at timestamptz not null default now()
);
create table if not exists public.clues (
  id bigint generated always as identity primary key,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_no int not null references public.members(member_no),
  body text not null check(length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.members enable row level security;
alter table public.profiles enable row level security;
alter table public.buddy_links enable row level security;
alter table public.wishlists enable row level security;
alter table public.clues enable row level security;

-- Public member names only; no personal data in this table.
drop policy if exists "members readable" on public.members;
create policy "members readable" on public.members for select to anon, authenticated using (true);

-- Users can read only their own profile.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated using (user_id=auth.uid());

-- Wishlist owner can manage own items; buddy can read wishlist only through a security-definer RPC.
drop policy if exists "wishlist owner read" on public.wishlists;
create policy "wishlist owner read" on public.wishlists for select to authenticated using (user_id=auth.uid());
drop policy if exists "wishlist owner insert" on public.wishlists;
create policy "wishlist owner insert" on public.wishlists for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "wishlist owner delete" on public.wishlists;
create policy "wishlist owner delete" on public.wishlists for delete to authenticated using (user_id=auth.uid());

-- Clue sender can insert; recipients read through RPC only. No sender identity is exposed.
create or replace function public.can_send_clue(p_recipient_no int)
returns boolean language sql security definer set search_path=public
as $$
 select exists(select 1 from public.buddy_links b where b.owner_id=auth.uid() and b.buddy_no=p_recipient_no);
$$;
drop policy if exists "clue sender insert" on public.clues;
create policy "clue sender insert" on public.clues for insert to authenticated
with check(sender_id=auth.uid() and public.can_send_clue(recipient_no));
-- Do not create direct SELECT policy on clues.

create or replace function public.available_buddies(p_member_no int)
returns table(member_no int,nickname text)
language sql security definer set search_path=public
as $$
 select m.member_no,m.nickname from public.members m
 where m.member_no <> p_member_no
 and not exists(select 1 from public.buddy_links b where b.buddy_no=m.member_no)
 order by m.member_no;
$$;

create or replace function public.lock_buddy_choice(p_member_no int,p_buddy_no int)
returns void language plpgsql security definer set search_path=public
as $$
declare uid uuid := auth.uid(); remaining_users int; remaining_targets int; my_nickname text;
begin
 if uid is null then raise exception 'กรุณาเข้าสู่ระบบก่อน'; end if;
 if p_member_no not between 1 and 38 or p_buddy_no not between 1 and 38 or p_member_no=p_buddy_no then
   raise exception 'เลือกบัดดี้ไม่ถูกต้อง';
 end if;
 if exists(select 1 from public.profiles where member_no=p_member_no) then raise exception 'ชื่อนี้มีบัญชีแล้ว'; end if;
 if exists(select 1 from public.buddy_links where buddy_no=p_buddy_no) then raise exception 'มีคนเลือกบัดดี้คนนี้ไปแล้ว กรุณาเลือกใหม่'; end if;
 insert into public.profiles(user_id,member_no) values(uid,p_member_no);
 insert into public.buddy_links(owner_id,owner_no,buddy_no) values(uid,p_member_no,p_buddy_no);
 -- Prevent a choice that leaves the final unregistered person with only themselves.
 select count(*) into remaining_users from public.members m
 where not exists(select 1 from public.profiles p where p.member_no=m.member_no);
 select count(*) into remaining_targets from public.members m
 where not exists(select 1 from public.buddy_links b where b.buddy_no=m.member_no);
 if remaining_users=1 and remaining_targets=1 and exists(
   select 1 from public.members u join public.members t on u.member_no=t.member_no
   where not exists(select 1 from public.profiles p where p.member_no=u.member_no)
   and not exists(select 1 from public.buddy_links b where b.buddy_no=t.member_no)
 ) then
   raise exception 'การเลือกนี้จะทำให้สมาชิกคนสุดท้ายเลือกตัวเอง กรุณาเลือกบัดดี้คนอื่น';
 end if;
end;
$$;

create or replace function public.my_profile()
returns table(member_no int,nickname text)
language sql security definer set search_path=public
as $$
 select p.member_no,m.nickname from public.profiles p join public.members m using(member_no) where p.user_id=auth.uid();
$$;

create or replace function public.my_buddy()
returns table(member_no int,nickname text)
language sql security definer set search_path=public
as $$
 select m.member_no,m.nickname from public.buddy_links b join public.members m on m.member_no=b.buddy_no where b.owner_id=auth.uid();
$$;

create or replace function public.buddy_wishlist()
returns table(id bigint,title text,detail text,url text,created_at timestamptz)
language sql security definer set search_path=public
as $$
 select w.id,w.title,w.detail,w.url,w.created_at from public.wishlists w
 join public.buddy_links b on w.user_id=b.owner_id
 where b.buddy_no=(select bb.buddy_no from public.buddy_links bb where bb.owner_id=auth.uid())
 order by w.created_at desc;
$$;

create or replace function public.my_clues()
returns table(body text,created_at timestamptz)
language sql security definer set search_path=public
as $$
 select c.body,c.created_at from public.clues c
 join public.profiles p on p.member_no=c.recipient_no
 where p.user_id=auth.uid() order by c.created_at desc;
$$;

grant execute on function public.available_buddies(int) to anon,authenticated;
grant execute on function public.lock_buddy_choice(int,int) to authenticated;
grant execute on function public.my_profile() to authenticated;
grant execute on function public.my_buddy() to authenticated;
grant execute on function public.buddy_wishlist() to authenticated;
grant execute on function public.my_clues() to authenticated;\ngrant execute on function public.can_send_clue(int) to authenticated;
grant select on public.members to anon,authenticated;
grant select,insert,delete on public.wishlists to authenticated;
grant usage,select on sequence public.wishlists_id_seq to authenticated;
