import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/db';
import { requireCompanyAuth } from '../middleware/auth';

const router = Router();
router.use(requireCompanyAuth);

router.get('/', (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  let vehicles = db.vehicles.findWhere(v => v.companyId === companyId);
  if (req.query.active === 'true') vehicles = vehicles.filter(v => v.active);
  if (req.query.type) vehicles = vehicles.filter(v => v.type === req.query.type);
  if (req.query.search) {
    const q = (req.query.search as string).toLowerCase();
    vehicles = vehicles.filter(v =>
      v.plate.toLowerCase().includes(q) ||
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q)
    );
  }
  return res.json({ success: true, data: vehicles });
});

router.get('/:id', (req: Request, res: Response) => {
  const vehicle = db.vehicles.findById(req.params.id);
  if (!vehicle || vehicle.companyId !== req.user!.companyId) {
    return res.status(404).json({ success: false, error: 'Vehículo no encontrado' });
  }
  return res.json({ success: true, data: vehicle });
});

router.post('/', (req: Request, res: Response) => {
  const vehicle = db.vehicles.create({
    id: uuidv4(),
    companyId: req.user!.companyId,
    active: true,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return res.status(201).json({ success: true, data: vehicle });
});

router.put('/:id', (req: Request, res: Response) => {
  const vehicle = db.vehicles.findById(req.params.id);
  if (!vehicle || vehicle.companyId !== req.user!.companyId) {
    return res.status(404).json({ success: false, error: 'Vehículo no encontrado' });
  }
  const updated = db.vehicles.update(req.params.id, { ...req.body, updatedAt: new Date().toISOString() });
  return res.json({ success: true, data: updated });
});

router.delete('/:id', (req: Request, res: Response) => {
  const vehicle = db.vehicles.findById(req.params.id);
  if (!vehicle || vehicle.companyId !== req.user!.companyId) {
    return res.status(404).json({ success: false, error: 'Vehículo no encontrado' });
  }
  db.vehicles.update(req.params.id, { active: false, updatedAt: new Date().toISOString() });
  return res.json({ success: true, message: 'Vehículo desactivado' });
});

export default router;
