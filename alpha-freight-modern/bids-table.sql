-- Create bids table (simplified for testing)
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id UUID NOT NULL,
  carrier_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Temporarily disable RLS for testing (remove after testing!)
ALTER TABLE bids DISABLE ROW LEVEL SECURITY;
