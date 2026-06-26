import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../data/db';

const JWT_SECRET = process.env.JWT_SECRET || 'c-lol-super-secret-jwt-key-2024';

export interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
  type: 'company' | 'driver';
}

export interface DriverJwtPayload {
  driverId: string;
  tripId: string;
  companyId: string;
  type: 'driver';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      driver?: DriverJwtPayload;
    }
  }
}

export function generateToken(payload: JwtPayload | DriverJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): JwtPayload | DriverJwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload | DriverJwtPayload;
}

export function requireCompanyAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Token de autenticación requerido' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token) as JwtPayload;
    if (payload.type !== 'company') {
      res.status(403).json({ success: false, error: 'Acceso no autorizado' });
      return;
    }
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Token inválido o expirado' });
  }
}

export function requireDriverAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Token de autenticación requerido' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token) as DriverJwtPayload;
    if (payload.type !== 'driver') {
      res.status(403).json({ success: false, error: 'Acceso no autorizado' });
      return;
    }
    req.driver = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Token inválido o expirado' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'No autenticado' });
    return;
  }
  if (req.user.role !== 'company_admin') {
    res.status(403).json({ success: false, error: 'Se requieren permisos de administrador' });
    return;
  }
  next();
}

export function validateDriverToken(token: string): { valid: boolean; driverTokenId?: string; driverId?: string; tripId?: string; companyId?: string } {
  const driverToken = db.driverTokens.findOneWhere(t => t.token === token && t.active);
  if (!driverToken) return { valid: false };
  if (new Date(driverToken.expiresAt) < new Date()) return { valid: false };
  return {
    valid: true,
    driverTokenId: driverToken.id,
    driverId: driverToken.driverId,
    tripId: driverToken.tripId,
    companyId: driverToken.companyId,
  };
}
