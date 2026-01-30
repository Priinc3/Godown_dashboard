-- Godown Dashboard - Supabase Schema
-- Run this in your Supabase SQL Editor to create all tables

-- ===== EMPLOYEES TABLE =====
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== WORK TYPES TABLE =====
CREATE TABLE IF NOT EXISTS work_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== UNITS TABLE =====
CREATE TABLE IF NOT EXISTS units (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== WORK ENTRIES TABLE =====
CREATE TABLE IF NOT EXISTS work_entries (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  work_type_id INTEGER REFERENCES work_types(id) ON DELETE SET NULL,
  unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
  target_quantity INTEGER NOT NULL,
  actual_quantity INTEGER,
  status VARCHAR(20) DEFAULT 'in-progress',
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== EXPENSE CATEGORIES TABLE =====
CREATE TABLE IF NOT EXISTS expense_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== EXPENSES TABLE =====
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  item_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category_id INTEGER REFERENCES expense_categories(id) ON DELETE SET NULL,
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  is_replacement BOOLEAN DEFAULT false,
  replacement_reason VARCHAR(100),
  original_expense_id INTEGER REFERENCES expenses(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== SETTINGS TABLE =====
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== INSERT DEFAULT DATA =====

-- Default employees
INSERT INTO employees (name, active) VALUES 
  ('John Doe', true),
  ('Jane Smith', true),
  ('Mike Johnson', true)
ON CONFLICT DO NOTHING;

-- Default work types
INSERT INTO work_types (name) VALUES 
  ('Packing Bottles'),
  ('Labeling'),
  ('Sorting')
ON CONFLICT DO NOTHING;

-- Default units
INSERT INTO units (name) VALUES 
  ('Pieces'),
  ('Boxes'),
  ('Kilograms')
ON CONFLICT DO NOTHING;

-- Default expense categories
INSERT INTO expense_categories (name) VALUES 
  ('Supplies'),
  ('Equipment'),
  ('Maintenance'),
  ('Utilities')
ON CONFLICT DO NOTHING;

-- Default settings
INSERT INTO settings (key, value) VALUES 
  ('company_name', 'Joyspoon Godown'),
  ('currency', 'INR'),
  ('shift_duration', '9')
ON CONFLICT (key) DO NOTHING;

-- ===== ENABLE ROW LEVEL SECURITY (Optional) =====
-- Uncomment these if you want to enable RLS

-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE work_types ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE units ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE work_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies for anon access (for development)
-- CREATE POLICY "Allow all" ON employees FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON work_types FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON units FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON work_entries FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON expenses FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON expense_categories FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON settings FOR ALL USING (true);
