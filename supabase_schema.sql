-- Supabase SQL Schema for Deal Intelligence Agent
-- Copy and paste this directly into Supabase SQL Editor!

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Enterprise AE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  value NUMERIC NOT NULL,
  stage TEXT NOT NULL,
  probability INT NOT NULL DEFAULT 50,
  expected_close_date TEXT,
  account_owner TEXT DEFAULT 'Alex Morgan',
  deal_health TEXT DEFAULT 'Good',
  risk_level TEXT DEFAULT 'Medium',
  last_interaction TEXT,
  next_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  deal_id TEXT REFERENCES deals(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  budget TEXT,
  timeline TEXT,
  current_solution TEXT,
  pain_points JSONB DEFAULT '[]'::jsonb,
  company_requirements JSONB DEFAULT '[]'::jsonb,
  priorities JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stakeholders (
  id TEXT PRIMARY KEY,
  deal_id TEXT REFERENCES deals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  role TEXT,
  email TEXT,
  sentiment TEXT DEFAULT 'Neutral',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interactions (
  id TEXT PRIMARY KEY,
  deal_id TEXT REFERENCES deals(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  participants JSONB DEFAULT '[]'::jsonb,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deal_memories (
  id TEXT PRIMARY KEY,
  deal_id TEXT REFERENCES deals(id) ON DELETE CASCADE,
  interaction_id TEXT REFERENCES interactions(id) ON DELETE SET NULL,
  memory_type TEXT NOT NULL,
  content TEXT NOT NULL,
  importance TEXT DEFAULT 'Medium',
  date TEXT,
  source_type TEXT DEFAULT 'Interaction',
  resolved BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS competitors (
  id TEXT PRIMARY KEY,
  deal_id TEXT REFERENCES deals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mentioned_date TEXT,
  customer_sentiment TEXT,
  consideration_reason TEXT,
  address_strategy TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY,
  deal_id TEXT REFERENCES deals(id) ON DELETE CASCADE,
  recommendation TEXT NOT NULL,
  reason TEXT NOT NULL,
  confidence INT DEFAULT 80,
  risk_level TEXT DEFAULT 'Medium',
  risk_reason TEXT,
  risk_mitigation TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_meetings (
  id TEXT PRIMARY KEY,
  deal_id TEXT REFERENCES deals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  duration TEXT DEFAULT '30 min',
  participants JSONB DEFAULT '[]'::jsonb,
  agenda TEXT,
  meeting_link TEXT,
  status TEXT DEFAULT 'Scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS Policies on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public Insert Profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Profiles" ON profiles FOR UPDATE USING (true);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Deals" ON deals FOR SELECT USING (true);
CREATE POLICY "Public Insert Deals" ON deals FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Deals" ON deals FOR UPDATE USING (true);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Public Insert Customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Customers" ON customers FOR UPDATE USING (true);

ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Stakeholders" ON stakeholders FOR SELECT USING (true);
CREATE POLICY "Public Insert Stakeholders" ON stakeholders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Stakeholders" ON stakeholders FOR UPDATE USING (true);

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Interactions" ON interactions FOR SELECT USING (true);
CREATE POLICY "Public Insert Interactions" ON interactions FOR INSERT WITH CHECK (true);

ALTER TABLE deal_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Memories" ON deal_memories FOR SELECT USING (true);
CREATE POLICY "Public Insert Memories" ON deal_memories FOR INSERT WITH CHECK (true);

ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Competitors" ON competitors FOR SELECT USING (true);
CREATE POLICY "Public Insert Competitors" ON competitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Competitors" ON competitors FOR UPDATE USING (true);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Recommendations" ON recommendations FOR SELECT USING (true);
CREATE POLICY "Public Insert Recommendations" ON recommendations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Recommendations" ON recommendations FOR UPDATE USING (true);

ALTER TABLE scheduled_meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Meetings" ON scheduled_meetings FOR SELECT USING (true);
CREATE POLICY "Public Insert Meetings" ON scheduled_meetings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete Meetings" ON scheduled_meetings FOR DELETE USING (true);
