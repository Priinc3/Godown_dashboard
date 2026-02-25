-- Godown Dashboard - Supabase Schema Auth & Finance Tables

-- 1. Create Profiles table (linked to auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS for profiles
alter table public.profiles enable row level security;

-- Create policy for users to see their own profile
create policy "Users can view own profile" on profiles for select using ( auth.uid() = id );
-- Create policy for admins to see all profiles
create policy "Admins can view all profiles" on profiles for select using ( (select role from profiles where id = auth.uid()) = 'admin' );

-- Function to automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Create Invoices Table
CREATE TABLE public.invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  file_name text not null,
  file_url text not null,
  status varchar(50) default 'Pending', -- Pending, Approved, Paid
  extracted_data jsonb,
  aws_bucket_path text,
  approved_by uuid references auth.users(id),
  paid_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.invoices enable row level security;

-- Policies for invoices
create policy "Users can view own invoices" on invoices for select using ( auth.uid() = user_id );
create policy "Users can insert own invoices" on invoices for insert with check ( auth.uid() = user_id );
create policy "Users can update own invoices to paid" on invoices for update using ( auth.uid() = user_id ) with check ( status = 'Paid' );
create policy "Admins can view all invoices" on invoices for select using ( (select role from profiles where id = auth.uid()) = 'admin' );
create policy "Admins can update all invoices" on invoices for update using ( (select role from profiles where id = auth.uid()) = 'admin' );
