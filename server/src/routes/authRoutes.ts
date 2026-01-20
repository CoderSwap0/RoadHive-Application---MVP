import { Router } from 'express';
import { db } from '../db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = Router();
const SECRET_KEY = process.env.JWT_SECRET || 'roadhive-secret-key-change-me';

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
console.log("Login Password:", password);
  try {
    // Join with Companies to get UI friendly name
    const result = await db.query(`
      SELECT u.*, c.company_name 
      FROM users u 
      LEFT JOIN companies c ON u.company_id = c.company_id 
      WHERE u.email = $1
    `, [email]);

    if (!result || result.rows.length === 0) return res.status(401).json({ error: 'User not found' });

    const user = result.rows[0];
    
    // In production: await bcrypt.compare(password, user.password_hash)
    // For demo, we accept any password if user exists
    
    const token = jwt.sign({ 
      userId: user.user_id, 
      tenantId: user.tenant_id, 
      role: user.role,
      email: user.email 
    }, SECRET_KEY, { expiresIn: '24h' });

    res.json({ 
      token, 
      user: {
        id: user.user_id,
        tenantId: user.tenant_id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.company_name || 'Individual'
      } 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// SIGNUP
router.post('/signup', async (req, res) => {
  const { name, email, companyName, role, password } = req.body;

  try {
    // 1. Create Tenant & Company
    const tenantRes = await db.query(
        `INSERT INTO tenants (tenant_name, type, tenant_code) 
         VALUES ($1, $2, $3) RETURNING tenant_id`,
         [companyName, role, `ORG-${Date.now()}`]
    );
    const tenantId = tenantRes?.rows[0]?.tenant_id;

    const compRes = await db.query(
        `INSERT INTO companies (tenant_id, company_name, company_type)
         VALUES ($1, $2, $3) RETURNING company_id`,
         [tenantId, companyName, role]
    );
    const companyId = compRes?.rows[0]?.company_id;

    // 2. Create User
    const hash = await bcrypt.hash(password || '123456', 10);
    const userRes = await db.query(
      `INSERT INTO users (tenant_id, company_id, name, email, role, password_hash) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING user_id`,
      [tenantId, companyId, name, email, role, hash]
    );
    
    const userId = userRes?.rows[0]?.user_id;

    // Issue Token
    const token = jwt.sign({ 
      userId, 
      tenantId, 
      role,
      email 
    }, SECRET_KEY, { expiresIn: '24h' });

    res.json({
      token,
      user: { id: userId, tenantId, name, email, role, companyName }
    });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;