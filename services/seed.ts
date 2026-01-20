

import { db } from './db';
import { User, Role, TenantType } from '../types';

export const seedDatabase = async () => {
  if (!db.isAvailable()) {
    console.warn("Database connection not available. Skipping seed.");
    return true; 
  }

  try {
    console.log("Starting Enterprise Database seed...");

    // 1. Enable Extensions
    await db.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // 2. Master Tables (Tenants, Companies, Roles, Users)
    await db.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_code VARCHAR(50) UNIQUE,
        tenant_name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL, -- SHIPPER, TRANSPORTER, etc.
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
        role VARCHAR(50) NOT NULL,
        password_hash VARCHAR(255) DEFAULT 'dummy_hash',
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
    `);

    // 3. Transactional Tables (Loads) - Using JSONB for locations
    await db.query(`
      CREATE TABLE IF NOT EXISTS loads (
        load_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
        load_number SERIAL, -- Auto-incrementing friendly ID
        
        shipper_company_id UUID REFERENCES companies(company_id),
        shipper_user_id UUID REFERENCES users(user_id),
        receiver_email VARCHAR(100),
        
        -- Location Data stored as JSONB for flexibility
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

        delivery_auth_code VARCHAR(10),
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_loads_tenant ON loads(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_loads_location ON loads USING gin (pickup_location);
    `);

    // 4. Bids Table
    await db.query(`
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
    `);

    // 5. GPS History / Audit Logs
    await db.query(`
      CREATE TABLE IF NOT EXISTS location_history (
        history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        load_id UUID REFERENCES loads(load_id) ON DELETE CASCADE,
        lat DECIMAL(9,6) NOT NULL,
        lng DECIMAL(9,6) NOT NULL,
        heading DECIMAL(5,2),
        speed DECIMAL(5,2),
        recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS audit_logs (
        audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID,
        entity_name VARCHAR(50),
        entity_id UUID,
        action VARCHAR(20),
        changed_by UUID,
        changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log("Schema created. Seeding initial data...");

    // --- SEED DATA ---

    // 1. Tenants
    const tenants = [
      { name: 'RoadHive Admin', type: 'SUPER_ADMIN', code: 'RH-ADMIN' },
      { name: 'Global Logistics', type: 'SHIPPER', code: 'GLOBAL-LOG' },
      { name: 'Fast Wheels', type: 'TRANSPORTER', code: 'FAST-WHEELS' },
      { name: 'Public Users', type: 'PUBLIC', code: 'PUBLIC' }
    ];

    for (const t of tenants) {
      await db.query(`
        INSERT INTO tenants (tenant_name, type, tenant_code) VALUES ($1, $2, $3)
        ON CONFLICT (tenant_code) DO NOTHING
      `, [t.name, t.type, t.code]);
    }

    // Retrieve Tenant IDs
    const tenantRows = await db.query('SELECT tenant_id, tenant_code FROM tenants');
    const tenantMap: Record<string, string> = {};
    tenantRows?.rows.forEach((r: any) => tenantMap[r.tenant_code] = r.tenant_id);

    // 2. Companies
    await db.query(`INSERT INTO companies (tenant_id, company_name, company_type) VALUES ($1, $2, $3)`, 
      [tenantMap['GLOBAL-LOG'], 'Global Logistics Pvt Ltd', 'SHIPPER']);
    await db.query(`INSERT INTO companies (tenant_id, company_name, company_type) VALUES ($1, $2, $3)`, 
      [tenantMap['FAST-WHEELS'], 'Fast Wheels Fleet', 'TRANSPORTER']);

    const companies = await db.query('SELECT company_id, tenant_id FROM companies');
    const compMap: Record<string, string> = {};
    companies?.rows.forEach((c: any) => compMap[c.tenant_id] = c.company_id);

    // 3. Users
    const users = [
      { name: 'System Admin', email: 'admin@roadhive.com', role: 'SUPER_ADMIN', tenant: 'RH-ADMIN' },
      { name: 'John Shipper', email: 'shipper@roadhive.com', role: 'SHIPPER', tenant: 'GLOBAL-LOG' },
      { name: 'Mike Transporter', email: 'transporter@roadhive.com', role: 'TRANSPORTER', tenant: 'FAST-WHEELS' },
      { name: 'Dave Driver', email: 'driver@roadhive.com', role: 'DRIVER', tenant: 'PUBLIC' }
    ];

    for (const u of users) {
      const tId = tenantMap[u.tenant];
      const cId = compMap[tId] || null; // Public users might not have company initially
      
      await db.query(`
        INSERT INTO users (tenant_id, company_id, name, email, role) 
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO NOTHING
      `, [tId, cId, u.name, u.email, u.role]);
    }

    // 4. Sample Load
    const shipperTenantId = tenantMap['GLOBAL-LOG'];
    const shipperCompanyId = compMap[shipperTenantId];
    const shipperUser = (await db.query(`SELECT user_id FROM users WHERE email='shipper@roadhive.com'`))?.rows[0].user_id;
    const driverUser = (await db.query(`SELECT user_id FROM users WHERE email='driver@roadhive.com'`))?.rows[0].user_id;

    const loadCheck = await db.query('SELECT count(*) FROM loads');
    if (loadCheck && parseInt(loadCheck.rows[0].count) === 0) {
        await db.query(`
            INSERT INTO loads (
                tenant_id, shipper_company_id, shipper_user_id, receiver_email,
                title, material_type, weight, vehicle_count,
                pickup_location, drop_location,
                vehicle_type, body_type, tyres, price, price_type,
                goods_value, insurance_required, insurance_premium,
                status, assigned_driver_id
            ) VALUES (
                $1, $2, $3, 'receiver@roadhive.com',
                'Steel Pipes Transport', 'Steel', 25, 2,
                '{ "city": "Mumbai", "address": "Port Trust Area", "lat": 18.9466, "lng": 72.8524, "date": "2023-11-15" }'::jsonb,
                '{ "city": "Delhi", "address": "Okhla Ind. Estate", "lat": 28.5355, "lng": 77.3910, "date": "2023-11-18" }'::jsonb,
                'Trailer', 'Open', 18, 45000, 'Fixed',
                1500000, TRUE, 7500,
                'Assigned', $4
            )
        `, [shipperTenantId, shipperCompanyId, shipperUser, driverUser]);
    }

    console.log("Enterprise Seeding Complete.");
    return true;
  } catch (error) {
    console.error("Seeding failed:", error);
    throw error;
  }
};