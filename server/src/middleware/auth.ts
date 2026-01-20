import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'roadhive-secret-key-change-me';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    role: string;
    email: string;
  };
  headers: any;
  body: any;
  params: any;
}

export const authenticateToken = (req: AuthRequest, res: any, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).send('Unauthorized');

  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) return res.status(403).send('Forbidden');
    
    // Inject User Context into Request
    req.user = user;
    
    // CRITICAL: All subsequent queries must use req.user.tenantId
    next();
  });
};