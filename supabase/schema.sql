-- ============================================================
-- Huy ABO: database trên Supabase
-- Chạy một lần trong Supabase (SQL Editor hoặc qua connector).
-- Chạy lại được: mọi lệnh đều "if not exists" / "or replace".
--
-- Đăng nhập dùng Supabase Auth với email nội bộ <sđt>@phone.huyabo.app
-- (không gửi email/SMS). Phải TẮT "Confirm email" trong
-- Authentication > Sign In / Providers > Email.
--
-- Trạng thái tài khoản (profiles.status):
--   pending  : vừa tự đăng ký, chờ admin duyệt. Không đọc được giá NPP, không lưu đơn.
--   active   : đã duyệt.
--   disabled : bị khoá.
-- ============================================================

-- ---------- Hồ sơ người dùng ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  phone        text unique not null,
  name         text not null default '',
  role         text not null default 'user'    check (role in ('user', 'admin')),
  status       text not null default 'pending' check (status in ('pending', 'active', 'disabled')),
  bank_bin     text not null default '',
  bank_account text not null default '',
  bank_holder  text not null default '',
  qr_updated   bigint,                -- thời điểm tải ảnh QR (ms), null = chưa có ảnh
  created_at   timestamptz not null default now()
);

-- Hàm kiểm tra quyền (security definer để không bị vòng lặp RLS)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and status = 'active');
$$;

create or replace function public.is_active() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and status = 'active');
$$;

-- Hàm kiểm tra quyền chỉ cho người đã đăng nhập gọi (dùng trong RLS)
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_active() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_active() to authenticated;

-- Tự tạo hồ sơ "chờ duyệt" khi có người đăng ký
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, phone, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'phone', split_part(new.email, '@', 1)),
    left(coalesce(new.raw_user_meta_data ->> 'name', ''), 60)
  )
  on conflict (id) do nothing;
  return new;
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Người dùng thường không tự đổi được SĐT, vai trò, trạng thái của mình
-- (Không dùng security definer: current_user là vai trò của người gọi.
--  SQL Editor và service key chạy dưới vai trò khác nên không bị chặn.)
create or replace function public.protect_profile() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and not is_admin() then
    new.phone  := old.phone;
    new.role   := old.role;
    new.status := old.status;
  end if;
  new.id := old.id;
  new.created_at := old.created_at;
  return new;
end $$;

drop trigger if exists protect_profile on public.profiles;
create trigger protect_profile
  before update on public.profiles
  for each row execute function public.protect_profile();

alter table public.profiles enable row level security;

drop policy if exists "xem hồ sơ" on public.profiles;
create policy "xem hồ sơ" on public.profiles
  for select using (id = auth.uid() or is_admin());

drop policy if exists "sửa hồ sơ" on public.profiles;
create policy "sửa hồ sơ" on public.profiles
  for update using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());
-- Không có policy insert/delete: hồ sơ do trigger tạo, xoá qua api/admin (service key).

-- ---------- Giá NPP, PV, BV ----------
create table if not exists public.product_prices (
  code      text primary key,          -- mã hàng, khớp "code" trong data.js
  price_npp integer,
  pv        numeric(10, 2),
  bv        integer
);

alter table public.product_prices enable row level security;

drop policy if exists "đọc giá" on public.product_prices;
create policy "đọc giá" on public.product_prices
  for select using (is_active());

drop policy if exists "admin sửa giá" on public.product_prices;
create policy "admin sửa giá" on public.product_prices
  for all using (is_admin()) with check (is_admin());

-- ---------- Đơn hàng đã lưu ----------
create table if not exists public.orders (
  id             bigint generated always as identity primary key,
  user_id        uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  customer_name  text not null default '' check (char_length(customer_name) <= 80),
  customer_phone text not null default '' check (char_length(customer_phone) <= 20),
  note           text not null default '' check (char_length(note) <= 300),
  items          jsonb not null,          -- [{code, name, qty, price, gift}]
  total          bigint not null default 0,
  total_pv       numeric(12, 2) not null default 0,
  total_bv       bigint not null default 0,
  npp            boolean not null default false,  -- đơn tính theo giá NPP
  created_at     timestamptz not null default now()
);

create index if not exists orders_user_created on public.orders (user_id, created_at desc);

alter table public.orders enable row level security;

-- Mỗi người chỉ thấy và sửa đơn của chính mình (admin cũng không xem đơn của người khác)
drop policy if exists "đơn của tôi" on public.orders;
create policy "đơn của tôi" on public.orders
  for all using (user_id = auth.uid() and is_active())
  with check (user_id = auth.uid() and is_active());

-- ---------- Ảnh QR nhận tiền (Storage) ----------
-- Bucket riêng tư, mỗi người một thư mục <user_id>/qr
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('qr', 'qr', false, 614400, array['image/png', 'image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 614400, allowed_mime_types = array['image/png', 'image/jpeg'];

drop policy if exists "qr của tôi: xem" on storage.objects;
create policy "qr của tôi: xem" on storage.objects
  for select using (bucket_id = 'qr' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "qr của tôi: tải lên" on storage.objects;
create policy "qr của tôi: tải lên" on storage.objects
  for insert with check (bucket_id = 'qr' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "qr của tôi: thay" on storage.objects;
create policy "qr của tôi: thay" on storage.objects
  for update using (bucket_id = 'qr' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "qr của tôi: xoá" on storage.objects;
create policy "qr của tôi: xoá" on storage.objects
  for delete using (bucket_id = 'qr' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Tài khoản admin đầu tiên ----------
-- Sau khi chủ dự án tự đăng ký trên web, chạy (thay SĐT):
--   update public.profiles set role = 'admin', status = 'active' where phone = '09xxxxxxxx';
