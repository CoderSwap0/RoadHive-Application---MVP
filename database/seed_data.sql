
-- Enable UUID extension just in case
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Insert Tenants
INSERT INTO tenants (tenant_id, tenant_code, tenant_name, type) VALUES
('11111111-1111-4111-a111-111111111111', 'GLOBAL-LOG', 'Global Logistics Solutions', 'SHIPPER'),
('22222222-2222-4222-a222-222222222222', 'FAST-WHEELS', 'Fast Wheels Transport', 'TRANSPORTER'),
('33333333-3333-4333-a333-333333333333', 'RH-ADMIN', 'RoadHive Admin', 'SUPER_ADMIN')
ON CONFLICT (tenant_id) DO NOTHING;

-- 2. Insert Companies
INSERT INTO companies (company_id, tenant_id, company_name, company_type) VALUES
('44444444-4444-4444-a444-444444444444', '11111111-1111-4111-a111-111111111111', 'Global Logistics Pvt Ltd', 'SHIPPER'),
('55555555-5555-4555-a555-555555555555', '22222222-2222-4222-a222-222222222222', 'Fast Wheels Fleet', 'TRANSPORTER')
ON CONFLICT (company_id) DO NOTHING;

-- 3. Insert Users
-- Note: password_hash is dummy. The backend demo login accepts any password if the user exists.
INSERT INTO users (user_id, tenant_id, company_id, name, email, role, password_hash) VALUES
-- Shipper User
('66666666-6666-4666-a666-666666666666', '11111111-1111-4111-a111-111111111111', '44444444-4444-4444-a444-444444444444', 'John Shipper', 'shipper@roadhive.com', 'SHIPPER', '$2a$10$dummyhashformockingpurposes000000000000000000'),
-- Transporter User
('77777777-7777-4777-a777-777777777777', '22222222-2222-4222-a222-222222222222', '55555555-5555-4555-a555-555555555555', 'Mike Transporter', 'transporter@roadhive.com', 'TRANSPORTER', '$2a$10$dummyhashformockingpurposes000000000000000000'),
-- Driver User (Belongs to Transporter Tenant)
('88888888-8888-4888-a888-888888888888', '22222222-2222-4222-a222-222222222222', '55555555-5555-4555-a555-555555555555', 'Dave Driver', 'driver@roadhive.com', 'DRIVER', '$2a$10$dummyhashformockingpurposes000000000000000000'),
-- Receiver User (Public/No Company)
('99999999-9999-4999-a999-999999999999', '11111111-1111-4111-a111-111111111111', NULL, 'Rick Receiver', 'receiver@roadhive.com', 'RECEIVER', '$2a$10$dummyhashformockingpurposes000000000000000000'),
-- Admin User
('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', '33333333-3333-4333-a333-333333333333', NULL, 'System Admin', 'admin@roadhive.com', 'SUPER_ADMIN', '$2a$10$dummyhashformockingpurposes000000000000000000')
ON CONFLICT (user_id) DO NOTHING;

-- 4. Insert Loads
INSERT INTO loads (
    load_id, tenant_id, load_number, shipper_company_id, shipper_user_id, receiver_email,
    title, material_type, weight, vehicle_count,
    pickup_location, drop_location,
    vehicle_type, body_type, tyres, price, price_type,
    goods_value, insurance_required, insurance_premium,
    status, assigned_driver_id, created_at
) VALUES 
(
    'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb', 
    '11111111-1111-4111-a111-111111111111', 
    1001, 
    '44444444-4444-4444-a444-444444444444', 
    '66666666-6666-4666-a666-666666666666', 
    'receiver@roadhive.com',
    'Steel Pipes Transport', 
    'Steel', 
    25.00, 
    2,
    '{"city": "Mumbai", "address": "Port Trust Area", "lat": 18.9466, "lng": 72.8524, "date": "2023-11-15"}'::jsonb,
    '{"city": "Delhi", "address": "Okhla Ind. Estate", "lat": 28.5355, "lng": 77.3910, "date": "2023-11-18"}'::jsonb,
    'Trailer', 'Open', 18, 45000.00, 'Fixed',
    1500000.00, TRUE, 7500.00,
    'Assigned', 
    '88888888-8888-4888-a888-888888888888', -- Assigned to Dave Driver
    NOW() - INTERVAL '2 days'
),
(
    'cccccccc-cccc-4ccc-accc-cccccccccccc', 
    '11111111-1111-4111-a111-111111111111', 
    1002, 
    '44444444-4444-4444-a444-444444444444', 
    '66666666-6666-4666-a666-666666666666', 
    'receiver@roadhive.com',
    'Textile Shipment', 
    'Cotton Bales', 
    12.00, 
    1,
    '{"city": "Surat", "address": "Textile Market", "lat": 21.1702, "lng": 72.8311, "date": "2023-11-20"}'::jsonb,
    '{"city": "Chennai", "address": "T. Nagar", "lat": 13.0827, "lng": 80.2707, "date": "2023-11-23"}'::jsonb,
    'Container', 'Closed', 10, 32000.00, 'Negotiable',
    0.00, FALSE, 0.00,
    'Active', 
    NULL,
    NOW() - INTERVAL '1 day'
)
ON CONFLICT (load_id) DO NOTHING;
