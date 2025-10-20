-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  area VARCHAR(100) NOT NULL,
  position VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table (uniforms and medications)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'uniform' or 'medication'
  subcategory VARCHAR(100),
  description TEXT,
  unit VARCHAR(50) NOT NULL, -- 'unit', 'box', 'bottle', etc.
  current_stock INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 10,
  maximum_stock INTEGER,
  location VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Removed unit_cost, total_cost, and invoice_number fields from stock_entries
-- Create stock_entries table (purchases/incoming stock)
CREATE TABLE IF NOT EXISTS stock_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number VARCHAR(50) UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  supplier VARCHAR(255),
  entry_date DATE NOT NULL,
  notes TEXT,
  registered_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_exits table (deliveries to employees)
CREATE TABLE IF NOT EXISTS stock_exits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exit_number VARCHAR(50) UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  exit_date DATE NOT NULL,
  movement_type VARCHAR(50) DEFAULT 'delivered', -- 'delivered', 'returned'
  status VARCHAR(50) DEFAULT 'completed',
  signature_data TEXT, -- Digital signature
  notes TEXT,
  registered_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'admin', 'delivery_manager', 'auditor', 'employee'
  status VARCHAR(20) DEFAULT 'active',
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_stock_entries_product ON stock_entries(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_date ON stock_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_stock_exits_product ON stock_exits(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_exits_employee ON stock_exits(employee_id);
CREATE INDEX IF NOT EXISTS idx_stock_exits_date ON stock_exits(exit_date);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
