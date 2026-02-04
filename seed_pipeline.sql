-- Create pipeline_stages table
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id TEXT PRIMARY KEY, -- using text key to maintain compatibility (e.g. 'new_lead')
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON pipeline_stages FOR SELECT USING (true);
CREATE POLICY "Enable write access for admins" ON pipeline_stages FOR ALL USING (
  exists (
    select 1 from users
    where users.id = auth.uid()
    and users.role = 'admin'
  )
);

-- Insert default stages
INSERT INTO pipeline_stages (id, label, color, order_index, is_system)
VALUES 
  ('new_lead', 'New Lead', 'bg-slate-500', 0, true),
  ('contacted', 'Contacted', 'bg-blue-500', 1, true),
  ('presentation', 'Presentation', 'bg-purple-500', 2, true),
  ('negotiation', 'Negotiation', 'bg-amber-500', 3, true),
  ('closed_won', 'Closed Won', 'bg-emerald-500', 4, true),
  ('closed_lost', 'Closed Lost', 'bg-red-500', 5, true)
ON CONFLICT (id) DO NOTHING;
