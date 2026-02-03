-- Supabase Database Schema for Sales CRM

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: users
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text not null,
  role text not null check (role in ('admin', 'manager', 'sales')),
  avatar text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table: leads
create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  company text not null,
  phone text,
  email text not null,
  product_interest text,
  deal_value numeric default 0,
  status text not null,
  tags text[] default '{}',
  assigned_to uuid references public.users(id) on delete set null,
  source text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table: tasks
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  lead_id uuid references public.leads(id) on delete cascade,
  assigned_to uuid references public.users(id) on delete set null,
  due_date timestamptz not null,
  priority text not null check (priority in ('low', 'medium', 'high')),
  status text not null check (status in ('pending', 'in_progress', 'completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table: broadcast_templates
create table if not exists public.broadcast_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null check (type in ('email', 'whatsapp')),
  subject text,
  content text not null,
  variables text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table: broadcast_campaigns
create table if not exists public.broadcast_campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null check (type in ('email', 'whatsapp')),
  template_id uuid references public.broadcast_templates(id) on delete set null,
  status text not null check (status in ('draft', 'scheduled', 'sending', 'completed', 'failed')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipients text[] default '{}',
  stats jsonb default '{"total": 0, "sent": 0, "delivered": 0, "read": 0, "replied": 0, "failed": 0}',
  created_at timestamptz default now()
);

-- Table: communication_logs
create table if not exists public.communication_logs (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete cascade,
  type text not null check (type in ('email', 'whatsapp', 'call', 'meeting', 'note')),
  subject text,
  content text not null,
  status text not null check (status in ('sent', 'delivered', 'read', 'replied', 'failed')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Table: notifications
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  type text not null check (type in ('task', 'lead', 'broadcast', 'system')),
  title text not null,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.users enable row level security;
alter table public.leads enable row level security;
alter table public.tasks enable row level security;
alter table public.broadcast_templates enable row level security;
alter table public.broadcast_campaigns enable row level security;
alter table public.communication_logs enable row level security;
alter table public.notifications enable row level security;

-- Basic Policies (Everyone can access for now)
create policy "Enable all access for now" on public.users for all using (true) with check (true);
create policy "Enable all access for now" on public.leads for all using (true) with check (true);
create policy "Enable all access for now" on public.tasks for all using (true) with check (true);
create policy "Enable all access for now" on public.broadcast_templates for all using (true) with check (true);
create policy "Enable all access for now" on public.broadcast_campaigns for all using (true) with check (true);
create policy "Enable all access for now" on public.communication_logs for all using (true) with check (true);
create policy "Enable all access for now" on public.notifications for all using (true) with check (true);

-- Functions for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- Triggers for updated_at
create trigger update_users_updated_at before update on public.users for each row execute procedure update_updated_at_column();
create trigger update_leads_updated_at before update on public.leads for each row execute procedure update_updated_at_column();
create trigger update_tasks_updated_at before update on public.tasks for each row execute procedure update_updated_at_column();
create trigger update_broadcast_templates_updated_at before update on public.broadcast_templates for each row execute procedure update_updated_at_column();

-- Seed data: Admin User
insert into public.users (email, name, role) 
values ('admin@test.com', 'Admin User', 'admin') 
on conflict (email) do nothing;
