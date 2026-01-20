

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. MASTER TABLES
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_code VARCHAR(50) UNIQUE NOT NULL,
    tenant_name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL, -- SHIPPER, TRANSPORTER, SUPER_ADMIN
    plan_type VARCHAR(20) DEFAULT 'STANDARD',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
    company_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    company_name VARCHAR(100) NOT NULL,
    company_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    company_id UUID REFERENCES companies(company_id),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL, -- ADMIN, SHIPPER, DRIVER
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TRANSACTIONAL TABLES
CREATE TABLE IF NOT EXISTS loads (
    load_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    load_number SERIAL,
    
    shipper_company_id UUID REFERENCES companies(company_id),
    shipper_user_id UUID REFERENCES users(user_id),
    receiver_email VARCHAR(100),
    
    -- Location Data (JSONB)
    pickup_location JSONB NOT NULL DEFAULT '{}'::jsonb, 
    drop_location JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    title VARCHAR(150),
    material_type VARCHAR(100),
    weight NUMERIC(10,2),
    vehicle_count INTEGER DEFAULT 1,
    vehicle_type VARCHAR(50),
    body_type VARCHAR(50),
    tyres INTEGER,
    
    price NUMERIC(15,2),
    price_type VARCHAR(20),
    
    goods_value NUMERIC(15,2),
    insurance_required BOOLEAN DEFAULT FALSE,
    insurance_premium NUMERIC(15,2),

    status VARCHAR(20) DEFAULT 'Active',
    
    assigned_transporter_id UUID REFERENCES tenants(tenant_id),
    assigned_driver_id UUID REFERENCES users(user_id),
    
    -- Tracking
    current_location JSONB DEFAULT '{}'::jsonb,
    last_updated TIMESTAMP WITH TIME ZONE,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    
    -- Delivery Verification
    delivery_auth_code VARCHAR(10),

    -- Financials / Invoice
    platform_fee NUMERIC(15,2) DEFAULT 0,
    tax_total NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) DEFAULT 0,
    invoice_number VARCHAR(50),
    invoice_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bids (
    bid_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    load_id UUID REFERENCES loads(load_id) ON DELETE CASCADE,
    transporter_name VARCHAR(100),
    amount NUMERIC(15,2),
    vehicle_details VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS location_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id UUID REFERENCES loads(load_id) ON DELETE CASCADE,
    lat DECIMAL(9,6) NOT NULL,
    lng DECIMAL(9,6) NOT NULL,
    heading DECIMAL(5,2),
    speed DECIMAL(5,2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loads_tenant ON loads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);

-- MIGRATION HELPERS (Run these manually if table exists)
-- ALTER TABLE loads ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(15,2) DEFAULT 0;
-- ALTER TABLE loads ADD COLUMN IF NOT EXISTS tax_total NUMERIC(15,2) DEFAULT 0;
-- ALTER TABLE loads ADD COLUMN IF NOT EXISTS total_amount NUMERIC(15,2) DEFAULT 0;
-- ALTER TABLE loads ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50);
-- ALTER TABLE loads ADD COLUMN IF NOT EXISTS invoice_date TIMESTAMP WITH TIME ZONE;
