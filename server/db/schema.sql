-- Deal Intelligence Agent Database Schema
-- Compatible with PostgreSQL (and optional pgvector extensions)

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(100) DEFAULT 'Sales Representative',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deals (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  value NUMERIC(12, 2) NOT NULL,
  stage VARCHAR(100) NOT NULL, -- 'Discovery', 'Demo', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'
  probability INTEGER NOT NULL DEFAULT 50,
  expected_close_date VARCHAR(50),
  account_owner VARCHAR(255) DEFAULT 'Alex Morgan',
  deal_health VARCHAR(50) DEFAULT 'Good', -- 'Good', 'At Risk', 'Critical'
  risk_level VARCHAR(50) DEFAULT 'Medium', -- 'Low', 'Medium', 'High'
  last_interaction VARCHAR(255),
  next_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(64) PRIMARY KEY,
  deal_id VARCHAR(64) REFERENCES deals(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  budget VARCHAR(100),
  timeline VARCHAR(100),
  current_solution TEXT,
  pain_points JSONB DEFAULT '[]'::jsonb,
  company_requirements JSONB DEFAULT '[]'::jsonb,
  priorities JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stakeholders (
  id VARCHAR(64) PRIMARY KEY,
  deal_id VARCHAR(64) REFERENCES deals(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  role VARCHAR(100), -- 'Decision Maker', 'Technical Contact', 'Champion', 'Blocker', 'User'
  email VARCHAR(255),
  sentiment VARCHAR(50) DEFAULT 'Neutral', -- 'Positive', 'Neutral', 'Negative', 'Concerned'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interactions (
  id VARCHAR(64) PRIMARY KEY,
  deal_id VARCHAR(64) REFERENCES deals(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'Call', 'Email', 'Meeting', 'Demo', 'Negotiation', 'Note'
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  participants JSONB DEFAULT '[]'::jsonb,
  date VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deal_memories (
  id VARCHAR(64) PRIMARY KEY,
  deal_id VARCHAR(64) REFERENCES deals(id) ON DELETE CASCADE,
  interaction_id VARCHAR(64) REFERENCES interactions(id) ON DELETE SET NULL,
  memory_type VARCHAR(50) NOT NULL, -- 'Customer statement', 'Objection', 'Requirement', 'Competitor mention', 'Pricing discussion', 'Stakeholder information', 'Action item', 'Sales tactic', 'Outcome'
  content TEXT NOT NULL,
  importance VARCHAR(50) DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
  date VARCHAR(50),
  source_type VARCHAR(50) DEFAULT 'Interaction',
  resolved BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS action_items (
  id VARCHAR(64) PRIMARY KEY,
  deal_id VARCHAR(64) REFERENCES deals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'In Progress', 'Completed'
  due_date VARCHAR(50),
  assigned_to VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS competitors (
  id VARCHAR(64) PRIMARY KEY,
  deal_id VARCHAR(64) REFERENCES deals(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  mentioned_date VARCHAR(50),
  customer_sentiment VARCHAR(50) DEFAULT 'Neutral',
  consideration_reason TEXT,
  address_strategy TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendations (
  id VARCHAR(64) PRIMARY KEY,
  deal_id VARCHAR(64) REFERENCES deals(id) ON DELETE CASCADE,
  recommendation TEXT NOT NULL,
  reason TEXT NOT NULL,
  confidence INTEGER DEFAULT 80,
  risk_level VARCHAR(50) DEFAULT 'Medium',
  risk_reason TEXT,
  risk_mitigation TEXT,
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
