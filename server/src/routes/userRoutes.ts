import { Router } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();

// GET ALL USERS (Admin Only - Scoped to Tenant unless SUPER_ADMIN)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  const { tenantId, role } = req.user!;
  
  try {
    let query = `
      SELECT u.user_id as id, u.tenant_id as "tenantId", u.name, u.email, u.role, u.status, u.created_at as "createdAt",
             c.company_name as "companyName", u.company_id as "companyId"
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.company_id
    `;
    const params: any[] = [];

    // If not SUPER_ADMIN, filter by tenant
    if (role !== 'SUPER_ADMIN') {
        query += ` WHERE u.tenant_id = $1`;
        params.push(tenantId);
    }

    query += ` ORDER BY u.created_at DESC`;

    const result = await db.query(query, params);
    res.json(result?.rows || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB Error' });
  }
});

// GET DRIVERS (For Transporter Dropdown)
router.get('/drivers', authenticateToken, async (req: AuthRequest, res) => {
    const { tenantId } = req.user!;
    try {
        const result = await db.query(`
            SELECT user_id as id, name FROM users 
            WHERE tenant_id = $1 AND role = 'DRIVER'
        `, [tenantId]);
        res.json(result?.rows || []);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch drivers' });
    }
});

// CREATE USER
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
    const { name, email, companyName, role, password } = req.body;
    const { tenantId: authTenantId, role: authRole } = req.user!;

    // Security: Only Admins can create
    if (!['ADMIN', 'SUPER_ADMIN'].includes(authRole)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const hash = await bcrypt.hash(password || 'password123', 10);
        
        // Determine Tenant & Company. 
        // For simplicity in this demo, if Admin creates a user, they belong to Admin's tenant 
        // unless Super Admin logic is added. We'll use authUser's tenant.
        let targetTenantId = authTenantId;
        
        // Find or Create Company (Simple logic: if companyName exists in tenant, use it, else create)
        let companyId = null;
        if (companyName) {
            const compRes = await db.query(
                `SELECT company_id FROM companies WHERE tenant_id = $1 AND company_name = $2`, 
                [targetTenantId, companyName]
            );
            if (compRes?.rows.length > 0) {
                companyId = compRes.rows[0].company_id;
            } else {
                const newComp = await db.query(
                    `INSERT INTO companies (tenant_id, company_name, company_type) VALUES ($1, $2, $3) RETURNING company_id`,
                    [targetTenantId, companyName, role === 'DRIVER' ? 'TRANSPORTER' : role]
                );
                companyId = newComp?.rows[0].company_id;
            }
        }

        const userRes = await db.query(
            `INSERT INTO users (tenant_id, company_id, name, email, role, password_hash)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING user_id as id, name, email, role, created_at`,
            [targetTenantId, companyId, name, email, role, hash]
        );

        res.json(userRes?.rows[0]);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// UPDATE USER
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { name, email, role, companyName } = req.body;
    
    try {
        // Update company name is tricky in relational, skipping for MVP simplicity or just updating user fields
        const result = await db.query(
            `UPDATE users SET name = $1, email = $2, role = $3 WHERE user_id = $4 RETURNING *`,
            [name, email, role, id]
        );
        res.json(result?.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// DELETE USER
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { tenantId, role } = req.user!;

    try {
        // Ensure tenant isolation
        const check = await db.query('SELECT tenant_id FROM users WHERE user_id = $1', [id]);
        if (check?.rows.length === 0) return res.status(404).json({error: 'User not found'});
        
        if (role !== 'SUPER_ADMIN' && check.rows[0].tenant_id !== tenantId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await db.query('DELETE FROM users WHERE user_id = $1', [id]);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

export default router;