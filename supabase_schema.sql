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
  product_interest text[],
  deal_value numeric default 0,
  status text not null check (status in ('new_lead', 'contacted', 'presentation', 'negotiation', 'closed_won', 'closed_lost')),
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
  attachments text[] default '{}',
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
DROP POLICY IF EXISTS "Enable all access for now" ON public.users;
create policy "Enable all access for now" on public.users for all using (true) with check (true);

DROP POLICY IF EXISTS "Enable all access for now" ON public.leads;
create policy "Enable all access for now" on public.leads for all using (true) with check (true);

DROP POLICY IF EXISTS "Enable all access for now" ON public.tasks;
create policy "Enable all access for now" on public.tasks for all using (true) with check (true);

DROP POLICY IF EXISTS "Enable all access for now" ON public.broadcast_templates;
create policy "Enable all access for now" on public.broadcast_templates for all using (true) with check (true);

DROP POLICY IF EXISTS "Enable all access for now" ON public.broadcast_campaigns;
create policy "Enable all access for now" on public.broadcast_campaigns for all using (true) with check (true);

DROP POLICY IF EXISTS "Enable all access for now" ON public.communication_logs;
create policy "Enable all access for now" on public.communication_logs for all using (true) with check (true);

DROP POLICY IF EXISTS "Enable all access for now" ON public.notifications;
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
drop trigger if exists update_users_updated_at on public.users;
create trigger update_users_updated_at before update on public.users for each row execute procedure update_updated_at_column();

drop trigger if exists update_leads_updated_at on public.leads;
create trigger update_leads_updated_at before update on public.leads for each row execute procedure update_updated_at_column();

drop trigger if exists update_tasks_updated_at on public.tasks;
create trigger update_tasks_updated_at before update on public.tasks for each row execute procedure update_updated_at_column();

drop trigger if exists update_broadcast_templates_updated_at on public.broadcast_templates;
create trigger update_broadcast_templates_updated_at before update on public.broadcast_templates for each row execute procedure update_updated_at_column();

-- Table: products
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;
DROP POLICY IF EXISTS "Enable all access for now" ON public.products;
create policy "Enable all access for now" on public.products for all using (true) with check (true);

drop trigger if exists update_products_updated_at on public.products;
create trigger update_products_updated_at before update on public.products for each row execute procedure update_updated_at_column();

-- Seed data: Honda Products
insert into public.products (name, description) values
-- Skuter Matik
('Honda Beat', 'Skutik Kecil - Lincah dan irit untuk penggunaan harian.'),
('Honda Beat Street', 'Skutik Kecil - Gaya street dengan stang telanjang.'),
('Honda Genio', 'Skutik Kecil - Desain casual dan stylish.'),
('Honda Vario 125', 'Skutik Menengah - Performa handal untuk harian.'),
('Honda Vario 160', 'Skutik Menengah - Sporty dengan mesin bertenaga 160cc.'),
('Honda Scoopy', 'Skutik Menengah - Ikonik dengan desain retro modern.'),
('Honda Stylo 160', 'Skutik Menengah - Retro modern dengan performa tinggi.'),
('Honda PCX 160', 'Skutik Besar - Mewah dan nyaman untuk jarak jauh.'),
('Honda ADV 160', 'Skutik Adventure - Tangguh untuk berbagai medan.'),
('Honda Forza 250', 'Skutik Premium - Performa dan fitur kasta tertinggi.'),
-- Bebek
('Honda Supra X 125', 'Bebek - Legendaris dan irit bahan bakar.'),
('Honda Revo', 'Bebek - Fungsional dan ekonomis.'),
('Honda Supra GTR 150', 'Bebek Sport - Performa mesin 150cc yang agresif.'),
('Honda Sonic 150R', 'Bebek Sport - Light Agility Sport untuk anak muda.'),
('Honda CT125', 'Bebek Trekking - Ikonik dan tangguh untuk petualangan.'),
('Honda Super Cub C125', 'Bebek Premium - Desain retro legendaris dengan teknologi modern.'),
-- Sport & Adventure
('Honda CBR150R', 'Sport Fairing - DNA balap untuk penggunaan harian.'),
('Honda CBR250RR', 'Sport Fairing - Total Control dengan mesin 2 silinder.'),
('Honda CB150R StreetFire', 'Naked Sport - Agresif dan lincah di kemacetan.'),
('Honda CB150X', 'Adv-Tourer - Desain adventure yang gagah.'),
('Honda CRF150L', 'Off-Road - Dual purpose untuk segala medan.'),
('Honda CRF250 Rally', 'Off-Road - Desain terinspirasi reli Dakar.'),
('Honda CRF1100L Africa Twin', 'Adventure - Performa tangguh untuk petualangan lintas benua.'),
('Honda CB500X', 'Adv-Tourer - Kenyamanan berkendara di berbagai kondisi.'),
('Honda CBR500R', 'Sport Fairing - Performa mesin 500cc yang seimbang.'),
('Honda CB650R', 'Neo Sports Café - Performa 4 silinder yang bergaya.'),
('Honda CBR600RR', 'Supersport - Performa balap kelas dunia.'),
('Honda CBR1000RR-R', 'Superbike - Performa kasta tertinggi di lintasan balap.'),
-- Cruiser
('Honda Rebel', 'Cruiser - Gaya klasik Amerika yang ikonik.'),
('Honda Rebel 1100', 'Cruiser - Performa besar dengan kenyamanan maksimal.'),
-- Electric & Others
('Honda EM1 e:', 'Electric - Motor listrik pertama untuk masa depan.'),
('Honda Monkey', 'Iconic - Kecil, unik, dan penuh gaya.'),
('Honda ST125 Dax', 'Iconic - Desain unik untuk para kolektor.')
on conflict (name) do nothing;

-- Seed data: Admin User
insert into public.users (email, name, role) 
values ('banana196501@gmail.com', 'Admin User', 'admin') 
on conflict (email) do nothing;
