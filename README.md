
# 🚛 RoadHive - Modern Logistics Platform

RoadHive is a logistics web application connecting Shippers, Transporters, and Drivers. It features real-time tracking, load management, and multi-tenant role-based access.

---

## 🚀 How to Run Locally (VS Code)

Follow these steps to get the application running on your local machine.

### Prerequisites
1.  **Node.js** (v16 or higher) installed.
2.  **VS Code** installed.

### Steps
1.  **Open the project** in VS Code.
2.  Open the **Integrated Terminal** (`Ctrl + ~`).
3.  **Install Dependencies**:
    ```bash
    npm install
    ```
4.  **Start the Development Server**:
    ```bash
    npm start
    # OR if using Vite
    npm run dev
    ```
5.  Open your browser to `http://localhost:3000` (or the port shown in the terminal).

---

## 🗄️ Connecting to a Database

This application is built to work with **PostgreSQL**. We recommend using **Neon (Serverless Postgres)** because the installed driver (`@neondatabase/serverless`) is optimized for it, but any standard PostgreSQL database will work.

### 1. Configure Environment Variable
Create a file named `.env` in the root of your project and add your connection string:

```env
# If using Create-React-App
REACT_APP_DATABASE_URL="postgres://user:password@endpoint.neon.tech/neondb?sslmode=require"

# If using Vite
VITE_DATABASE_URL="postgres://user:password@endpoint.neon.tech/neondb?sslmode=require"

# Note: You may need to update services/db.ts to read process.env.REACT_APP_DATABASE_URL 
# depending on your bundler configuration.
```

### 2. Database Schema (Create Scripts)

To set up your database manually, execute the following SQL script in your database's SQL editor (e.g., pgAdmin, Neon SQL Editor, or DBeaver). This creates all necessary tables and indexes.

```sql
-- 1. Tenants (Organizations)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'SHIPPER', 'TRANSPORTER', etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users (Scoped to Tenants)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'SHIPPER', 'DRIVER', etc.
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- 3. Loads (Trips/Shipments)
CREATE TABLE IF NOT EXISTS loads (
  id SERIAL PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id), -- Creator (Shipper)
  transporter_id UUID REFERENCES tenants(id), -- Assigned Carrier
  receiver_email TEXT, -- Specific Receiver Visibility
  title TEXT NOT NULL,
  material_type TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  vehicle_count INTEGER NOT NULL,
  pickup_city TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_date TEXT NOT NULL,
  pickup_lat NUMERIC,
  pickup_lng NUMERIC,
  drop_city TEXT NOT NULL,
  drop_address TEXT NOT NULL,
  drop_date TEXT NOT NULL,
  drop_lat NUMERIC,
  drop_lng NUMERIC,
  vehicle_type TEXT NOT NULL,
  body_type TEXT NOT NULL,
  tyres INTEGER,
  price NUMERIC NOT NULL,
  price_type TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  assigned_driver_id INTEGER REFERENCES users(id),
  current_lat NUMERIC,
  current_lng NUMERIC,
  current_heading NUMERIC,
  current_speed NUMERIC,
  last_updated TIMESTAMP,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_loads_tenant ON loads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loads_transporter ON loads(transporter_id);

-- 4. Bids (For Transporters to bid on loads)
CREATE TABLE IF NOT EXISTS bids (
  id SERIAL PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  load_id INTEGER REFERENCES loads(id) ON DELETE CASCADE,
  transporter_name TEXT,
  amount NUMERIC,
  vehicle_details TEXT,
  date TEXT,
  status TEXT DEFAULT 'Pending'
);
CREATE INDEX IF NOT EXISTS idx_bids_tenant ON bids(tenant_id);

-- 5. Location History (For Route Replay/Tracking)
CREATE TABLE IF NOT EXISTS location_history (
  id SERIAL PRIMARY KEY,
  load_id INTEGER REFERENCES loads(id) ON DELETE CASCADE,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  heading NUMERIC,
  speed NUMERIC,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_history_load ON location_history(load_id);
```

---

## 🌱 Automatic Scaffolding (Seeding)

If you do not want to run the SQL scripts manually, the application includes a built-in seeding tool.

1.  Connect your database via `.env`.
2.  Run the application.
3.  Log in as an **Admin** (Use mock credentials if DB is empty: `admin@roadhive.com`).
    *   *Note: If the DB is connected but empty, the login might fail. In that case, manually execute ONLY the `users` and `tenants` creation SQL above first to insert a user, OR use the "Initialize Database" button if you can access the dashboard.*
4.  Navigate to the **Dashboard**.
5.  In the top right corner, click **"Initialize Database"**.
6.  This will:
    *   Create all tables.
    *   Create default Tenants (Shipper, Transporter, Public).
    *   Create default Users (Admin, Driver, Shipper).
    *   Insert sample Loads.

---

## 🧹 Transitioning from Mock Data to Real Data

Currently, the application is designed to **automatically switch** between Real DB and Mock Data.

*   **Logic:** `services/db.ts` checks if a `DATABASE_URL` is provided. If yes, it tries to query Postgres. If that fails or is missing, it falls back to `mockService.ts`.

**If you want to permanently remove Mock Data code:**

1.  **Delete file:** `services/mockService.ts`.
2.  **Update Services:** Go to `services/authService.ts`, `services/loadService.ts`, `services/tripService.ts`, and `services/userService.ts`.
3.  **Refactor:** Look for the `if (!db.isAvailable())` blocks. Remove these blocks and the calls to `mockService`.

**Example Refactor (loadService.ts):**

*Before:*
```typescript
async getAllLoads() {
  if (!db.isAvailable()) {
    return mockService.getLoads();
  }
  // ... real db logic
}
```

*After:*
```typescript
async getAllLoads() {
  // ... real db logic only
}
```
