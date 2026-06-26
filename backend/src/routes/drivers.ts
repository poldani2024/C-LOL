import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/db';
import { requireCompanyAuth } from '../middleware/auth';

const router = Router();
router.use(requireCompanyAuth);

router.get('/', (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  let drivers = db.drivers.findWhere(d => d.companyId === companyId);
  if (req.query.active === 'true') drivers = drivers.filter(d => d.active);
  if (req.query.search) {
    const q = (req.query.search as string).toLowerCase();
    drivers = drivers.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.phone.includes(q) ||
      d.licenseNumber.toLowerCase().includes(q)
    );
  }
  const enriched = drivers.map(d => ({
    ...d,
    vehicle: d.defaultVehicleId ? db.vehicles.findById(d.defaultVehicleId) : null,
    tripsCount: db.trips.findWhere(t => t.driverId === d.id).length,
  }));
  return res.json({ success: true, data: enriched });
});

router.get('/:id', (req: Request, res: Response) => {
  const driver = db.drivers.findById(req.params.id);
  if (!driver || driver.companyId !== req.user!.companyId) {
    return res.status(404).json({ success: false, error: 'Chofer no encontrado' });
  }
  const trips = db.trips.findWhere(t => t.driverId === driver.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
  return res.json({ success: true, data: { ...driver, trips } });
});

router.post('/', (req: Request, res: Response) => {
  const driver = db.drivers.create({
    id: uuidv4(),
    companyId: req.user!.companyId,
    active: true,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return res.status(201).json({ success: true, data: driver });
});

router.put('/:id', (req: Request, res: Response) => {
  const driver = db.drivers.findById(req.params.id);
  if (!driver || driver.companyId !== req.user!.companyId) {
    return res.status(404).json({ success: false, error: 'Chofer no encontrado' });
  }
  const updated = db.drivers.update(req.params.id, { ...req.body, updatedAt: new Date().toISOString() });
  return res.json({ success: true, data: updated });
});

router.delete('/:id', (req: Request, res: Response) => {
  const driver = db.drivers.findById(req.params.id);
  if (!driver || driver.companyId !== req.user!.companyId) {
    return res.status(404).json({ success: false, error: 'Chofer no encontrado' });
  }
  db.drivers.update(req.params.id, { active: false, updatedAt: new Date().toISOString() });
  return res.json({ success: true, message: 'Chofer desactivado' });
});

export default router;
