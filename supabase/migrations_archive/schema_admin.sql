-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User profiles with role
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reports table
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_name text not null,
  status text not null default 'draft' check (status in ('draft', 'processing', 'completed', 'failed')),
  image_url text,
  data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Verifications table
create table if not exists public.verifications (
  id uuid default uuid_generate_v4() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  verification_type text not null check (verification_type in ('sample', 'inspection', 'audit')),
  notes text,
  result jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders table
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  report_id uuid references public.reports(id) on delete set null,
  order_number text unique not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled')),
  supplier_name text,
  product_name text not null,
  quantity integer not null,
  unit_price numeric(10, 2),
  total_amount numeric(10, 2),
  data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages/Inbox table
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete set null,
  subject text not null,
  body text not null,
  read boolean default false,
  message_type text not null default 'system' check (message_type in ('system', 'support', 'notification', 'order_update')),
  related_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Files table
create table if not exists public.files (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  file_size integer not null,
  related_type text check (related_type in ('report', 'order', 'verification', 'message')),
  related_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Leads table (from sourcing)
create table if not exists public.leads (
  id uuid default uuid_generate_v4() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  supplier_name text not null,
  supplier_type text,
  contact_email text,
  contact_phone text,
  confidence_score numeric(3, 2),
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'converted', 'rejected')),
  data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.verifications enable row level security;
alter table public.orders enable row level security;
alter table public.messages enable row level security;
alter table public.files enable row level security;
alter table public.leads enable row level security;

-- RLS Policies for profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for reports
create policy "Users can view own reports"
  on public.reports for select
  using (auth.uid() = user_id);

create policy "Users can create own reports"
  on public.reports for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reports"
  on public.reports for update
  using (auth.uid() = user_id);

create policy "Admins can view all reports"
  on public.reports for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for verifications
create policy "Users can view own verifications"
  on public.verifications for select
  using (auth.uid() = user_id);

create policy "Admins can view all verifications"
  on public.verifications for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for orders
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can create own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own orders"
  on public.orders for update
  using (auth.uid() = user_id);

create policy "Admins can view all orders"
  on public.orders for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for messages
create policy "Users can view own messages"
  on public.messages for select
  using (auth.uid() = user_id);

create policy "Admins can view all messages"
  on public.messages for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for files
create policy "Users can view own files"
  on public.files for select
  using (auth.uid() = user_id);

create policy "Users can upload files"
  on public.files for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all files"
  on public.files for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for leads
create policy "Leads viewable by report owner"
  on public.leads for select
  using (
    exists (
      select 1 from public.reports
      where reports.id = leads.report_id
      and reports.user_id = auth.uid()
    )
  );

create policy "Admins can view all leads"
  on public.leads for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Indexes for performance
create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists reports_user_id_idx on public.reports(user_id);
create index if not exists reports_status_idx on public.reports(status);
create index if not exists verifications_report_id_idx on public.verifications(report_id);
create index if not exists verifications_status_idx on public.verifications(status);
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists messages_user_id_idx on public.messages(user_id);
create index if not exists messages_read_idx on public.messages(read);
create index if not exists files_user_id_idx on public.files(user_id);
create index if not exists leads_report_id_idx on public.leads(report_id);
create index if not exists leads_status_idx on public.leads(status);

-- Function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger reports_updated_at before update on public.reports
  for each row execute procedure public.handle_updated_at();

create trigger verifications_updated_at before update on public.verifications
  for each row execute procedure public.handle_updated_at();

create trigger orders_updated_at before update on public.orders
  for each row execute procedure public.handle_updated_at();

create trigger leads_updated_at before update on public.leads
  for each row execute procedure public.handle_updated_at();
