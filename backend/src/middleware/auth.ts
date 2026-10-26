import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { UserRole } from '../types/enums';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    institutionId?: string | null;
  };
}

const JWT_SECRET = process.env.TOKEN_KEY || process.env.JWT_SECRET || 'aicte_sih_hackathon_2026_secret_key_very_secure';

export function generateToken(payload: { id: string; email: string; role: UserRole; name: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: UserRole };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { institution: true },
    });

    if (!user) {
      res.status(401).json({ message: 'User not found or session expired' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      institutionId: user.institutionId,
    };

    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired authentication token' });
  }
}

export function requireRole(role: UserRole) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
      return;
    }
    next();
  };
}
