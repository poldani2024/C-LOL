import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/db';
import { generateToken, requireCompanyAuth, validateDriverToken } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login empresa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login exitoso
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y contraseña requeridos' });
    }

    const user = db.users.findOneWhere(u => u.email === email && u.active);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }

    const company = db.companies.findById(user.companyId);
    if (!company) {
      return res.status(500).json({ success: false, error: 'Empresa no encontrada' });
    }

    const token = generateToken({
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      type: 'company',
    });

    const { passwordHash: _, ...safeUser } = user;
    return res.json({
      success: true,
      data: { token, user: safeUser, company },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

/**
 * @swagger
 * /api/auth/driver/access:
 *   post:
 *     tags: [Auth]
 *     summary: Acceso del chofer via token temporal
 */
router.post('/driver/access', (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token requerido' });
    }

    const validation = validateDriverToken(token);
    if (!validation.valid || !validation.driverId || !validation.tripId) {
      return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
    }

    const driver = db.drivers.findById(validation.driverId);
    const trip = db.trips.findById(validation.tripId);

    if (!driver || !trip) {
      return res.status(404).json({ success: false, error: 'Datos no encontrados' });
    }

    // Mark token as used
    db.driverTokens.update(validation.driverTokenId!, { usedAt: new Date().toISOString() });

    const jwtToken = generateToken({
      driverId: driver.id,
      tripId: trip.id,
      companyId: trip.companyId,
      type: 'driver',
    });

    return res.json({
      success: true,
      data: { token: jwtToken, driver, trip },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

/**
 * @swagger
 * /api/auth/driver/token/generate:
 *   post:
 *     tags: [Auth]
 *     summary: Generar link para el chofer
 */
router.post('/driver/token/generate', requireCompanyAuth, (req: Request, res: Response) => {
  try {
    const { tripId } = req.body;
    const companyId = req.user!.companyId;

    const trip = db.trips.findById(tripId);
    if (!trip || trip.companyId !== companyId) {
      return res.status(404).json({ success: false, error: 'Viaje no encontrado' });
    }
    if (!trip.driverId) {
      return res.status(400).json({ success: false, error: 'El viaje no tiene chofer asignado' });
    }

    // Invalidate previous tokens
    const existing = db.driverTokens.findWhere(t => t.tripId === tripId && t.active);
    existing.forEach(t => db.driverTokens.update(t.id, { active: false }));

    const token = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 48 * 3600000).toISOString();

    const driverToken = db.driverTokens.create({
      id: uuidv4(),
      token,
      tripId,
      driverId: trip.driverId,
      companyId,
      createdAt: new Date().toISOString(),
      expiresAt,
      active: true,
    });

    const baseUrl = process.env.DRIVER_APP_URL || 'http://localhost:5174';
    const link = `${baseUrl}/access/${token}`;

    // Update trip
    db.trips.update(tripId, {
      driverToken: token,
      driverTokenExpiry: expiresAt,
      status: 'driver_notified',
      updatedAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      data: { token, link, expiresAt, driverTokenId: driverToken.id },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Obtener usuario actual
 */
router.get('/me', requireCompanyAuth, (req: Request, res: Response) => {
  const user = db.users.findById(req.user!.userId);
  if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  const { passwordHash: _, ...safeUser } = user;
  const company = db.companies.findById(user.companyId);
  return res.json({ success: true, data: { user: safeUser, company } });
});

export default router;
