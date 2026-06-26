import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/db';
import { requireDriverAuth } from '../middleware/auth';
import { TripStatus, DRIVER_STATUS_TRANSITIONS } from '../../../shared/types';

const router = Router();
router.use(requireDriverAuth);

router.get('/trip', (req: Request, res: Response) => {
  const { tripId, driverId } = req.driver!;
  const trip = db.trips.findById(tripId);
  if (!trip) return res.status(404).json({ success: false, error: 'Viaje no encontrado' });

  const events = db.tripEvents.findWhere(e => e.tripId === tripId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const incidents = db.incidents.findWhere(i => i.tripId === tripId);
  const photos = db.photos.findWhere(p => p.tripId === tripId);
  const vehicle = trip.vehicleId ? db.vehicles.findById(trip.vehicleId) : null;

  return res.json({ success: true, data: { ...trip, events, incidents, photos, vehicle } });
});

router.put('/trip/status', (req: Request, res: Response) => {
  const { tripId, driverId } = req.driver!;
  const trip = db.trips.findById(tripId);
  if (!trip) return res.status(404).json({ success: false, error: 'Viaje no encontrado' });

  const { notes, lat, lng } = req.body;
  const nextStatus = DRIVER_STATUS_TRANSITIONS[trip.status];
  if (!nextStatus) {
    return res.status(400).json({ success: false, error: 'No se puede avanzar el estado del viaje' });
  }

  const now = new Date().toISOString();
  const updates: Partial<typeof trip> = { status: nextStatus, updatedAt: now };

  if (nextStatus === 'heading_to_origin') updates.startedAt = now;
  if (nextStatus === 'arrived_at_origin') updates.arrivedAtOriginAt = now;
  if (nextStatus === 'loading') updates.loadingStartedAt = now;
  if (nextStatus === 'in_transit') updates.departedAt = now;
  if (nextStatus === 'arrived_at_destination') updates.arrivedAtDestinationAt = now;
  if (nextStatus === 'delivered') updates.completedAt = now;

  db.trips.update(tripId, updates);
  db.tripEvents.create({
    id: uuidv4(),
    tripId,
    status: nextStatus,
    timestamp: now,
    lat: lat ? parseFloat(lat) : undefined,
    lng: lng ? parseFloat(lng) : undefined,
    notes: notes || undefined,
    createdBy: driverId,
    createdByType: 'driver',
  });

  return res.json({ success: true, data: db.trips.findById(tripId) });
});

router.post('/trip/location', (req: Request, res: Response) => {
  const { tripId, driverId } = req.driver!;
  const { lat, lng, accuracy, speed, heading } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ success: false, error: 'Coordenadas requeridas' });
  }

  const location = db.locations.create({
    id: uuidv4(),
    tripId,
    driverId,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    accuracy: accuracy ? parseFloat(accuracy) : undefined,
    speed: speed ? parseFloat(speed) : undefined,
    heading: heading ? parseFloat(heading) : undefined,
    timestamp: new Date().toISOString(),
  });

  return res.json({ success: true, data: location });
});

router.post('/trip/event', (req: Request, res: Response) => {
  const { tripId, driverId } = req.driver!;
  const { notes, lat, lng, photos } = req.body;

  const trip = db.trips.findById(tripId);
  if (!trip) return res.status(404).json({ success: false, error: 'Viaje no encontrado' });

  const event = db.tripEvents.create({
    id: uuidv4(),
    tripId,
    status: trip.status,
    timestamp: new Date().toISOString(),
    lat: lat ? parseFloat(lat) : undefined,
    lng: lng ? parseFloat(lng) : undefined,
    notes,
    photos: photos || [],
    createdBy: driverId,
    createdByType: 'driver',
  });

  return res.json({ success: true, data: event });
});

router.post('/trip/incident', (req: Request, res: Response) => {
  const { tripId, driverId } = req.driver!;
  const { type, description, photos, lat, lng } = req.body;

  if (!type || !description) {
    return res.status(400).json({ success: false, error: 'Tipo y descripción requeridos' });
  }

  const incident = db.incidents.create({
    id: uuidv4(),
    tripId,
    driverId,
    type,
    description,
    photos: photos || [],
    lat: lat ? parseFloat(lat) : undefined,
    lng: lng ? parseFloat(lng) : undefined,
    resolved: false,
    timestamp: new Date().toISOString(),
  });

  return res.json({ success: true, data: incident });
});

export default router;
