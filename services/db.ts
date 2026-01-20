import { Pool } from '@neondatabase/serverless';

// SECURITY WARNING: In a production application, never expose your database credentials 
// in client-side code. This is for demonstration MVP purposes only.
// In production, use a backend proxy (Node.js/Express) to handle DB connections.

const DATABASE_URL = process.env.DATABASE_URL;

let pool: Pool | null = null;

if (DATABASE_URL) {
  pool = new Pool({ connectionString: DATABASE_URL });
}

export const db = {
  async query(text: string, params?: any[]) {
    if (!pool) {
      console.warn("Database URL not found. Using mock fallback logic.");
      return null;
    }
    
    // Simple retry logic or connection handling could go here
    try {
      const start = Date.now();
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      // console.log('executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Database Error:', error);
      throw error;
    }
  },

  isAvailable() {
    return !!pool;
  }
};
