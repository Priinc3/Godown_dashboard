-- Products Table - Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add product_id column to work_entries
ALTER TABLE work_entries ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL;

-- Insert default products
INSERT INTO products (name) VALUES 
  ('Product A'),
  ('Product B'),
  ('Product C')
ON CONFLICT DO NOTHING;
