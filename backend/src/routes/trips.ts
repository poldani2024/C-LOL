import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/db';
import { requireCompanyAuth } from '../middleware/auth';
import { TripStatus, TRIP_STATUS_ORDER } from '../../../shared/types';

const router = Router();

router.use(requireCompanyAuth);

router.get('/', (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    let trips = db.trips.findWhere(t => t.companyId === companyId);

    // Filters
    if (req.query.status) trips = trips.filter(t => t.status === req.query.status);
    if (req.query.driverId) trips = trips.filter(t => t.driverId === req.query.driverId);
    if (req.query.search) {
      const q = (req.query.search as string).toLowerCase();
      trips = trips.filter(t =>
        t.tripNumber.toLowerCase().includes(q) ||
        t.contractingCompany.toLowerCase().includes(q) ||
        t.destinationClient.toLowerCase().includes(q) ||
        t.origin.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q)
      );
    }

    // Sort by date desc
    trips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Enrich with driver and vehicle
    const enriched = trips.map(trip => ({
      ...trip,
      driver: trip.driverId ? db.drivers.findById(trip.driverId) : null,
      vehicle: trip.vehicleId ? db.vehicles.findById(trip.vehicleId) : null,
    }));

    return res.json({ success: true, data: enriched, total: enriched.length });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al obtener viajes' });
  }
});

router.get('/stats', (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const trips = db.trips.findWhere(t => t.companyId === companyId);
    const today = new Date().toISOString().split('T')[0];

    const activeStatuses: TripStatus[] = ['heading_to_origin', 'arrived_at_origin', 'loading', 'loading_complete', 'in_transit', 'arrived_at_destination', 'unloading'];
    const delayedStatuses: TripStatus[] = ['pending', 'assigned', 'driver_notified'];

    const stats = {
      activeTrips: trips.filter(t => activeStatuses.includes(t.status)).length,
      completedTrips: trips.filter(t => t.status === 'completed').length,
      delayedTrips: trips.filter(t =>
        delayedStatuses.includes(t.status) &&
        t.scheduledDate < today
      ).length,
      trucksInTransit: trips.filter(t => t.status === 'in_transit').length,
      todayDeliveries: trips.filter(t => t.scheduledDate === today).length,
      pendingAlerts: trips.filter(t =>
        t.status !== 'completed' &&
        t.status !== 'cancelled' &&
        t.scheduledDate < today
      ).length,
      totalDrivers: db.drivers.findWhere(d => d.companyId === companyId && d.active).length,
      totalVehicles: db.vehicles.findWhere(v => v.companyId === companyId && v.active).length,
    };

    return res.json({ success: true, data: stats });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const trip = db.trips.findById(req.params.id);
    if (!trip || trip.companyId !== req.user!.companyId) {
      return res.status(404).json({ success: false, error: 'Viaje no encontrado' });
    }
    const events = db.tripEvents.findWhere(e => e.tripId === trip.id);
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const lastLocation = db.locations.findWhere(l => l.tripId === trip.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    const incidents = db.incidents.findWhere(i => i.tripId === trip.id);
    const photos = db.photos.findWhere(p => p.tripId === trip.id);
    const signatures = db.signatures.findWhere(s => s.tripId === trip.id);

    return res.json({
      success: true,
      data: {
        ...trip,
        driver: trip.driverId ? db.drivers.findById(trip.driverId) : null,
        vehicle: trip.vehicleId ? db.vehicles.findById(trip.vehicleId) : null,
        events,
        lastLocation,
        incidents,
        photos,
        signatures,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al obtener viaje' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { tripNumber, ...rest } = req.body;

    // Auto-generate trip number if not provided
    const existing = db.trips.findWhere(t => t.companyId === companyId);
    const autoNumber = tripNumber || `VJ-${new Date().getFullYear()}-${String(existing.length + 1).padStart(3, '0')}`;

    const trip = db.trips.create({
      id: uuidv4(),
      companyId,
      tripNumber: autoNumber,
      status: rest.driverId ? 'assigned' : 'pending',
      products: [],
      totalWeightKg: 0,
      totalVolumeM3: 0,
      cargoValue: 0,
      cargoCurrency: 'ARS',
      ...rest,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return res.status(201).json({ success: true, data: trip });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al crear viaje' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const trip = db.trips.findById(req.params.id);
    if (!trip || trip.companyId !== req.user!.companyId) {
      return res.status(404).json({ success: false, error: 'Viaje no encontrado' });
    }
    if (['completed', 'cancelled'].includes(trip.status)) {
      return res.status(400).json({ success: false, error: 'No se puede modificar un viaje finalizado' });
    }
    const updated = db.trips.update(req.params.id, { ...req.body, updatedAt: new Date().toISOString() });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al actualizar viaje' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const trip = db.trips.findById(req.params.id);
    if (!trip || trip.companyId !== req.user!.companyId) {
      return res.status(404).json({ success: false, error: 'Viaje no encontrado' });
    }
    db.trips.update(req.params.id, { status: 'cancelled', updatedAt: new Date().toISOString() });
    return res.json({ success: true, message: 'Viaje cancelado' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al cancelar viaje' });
  }
});

router.post('/:id/duplicate', (req: Request, res: Response) => {
  try {
    const trip = db.trips.findById(req.params.id);
    if (!trip || trip.companyId !== req.user!.companyId) {
      return res.status(404).json({ success: false, error: 'Viaje no encontrado' });
    }
    const existing = db.trips.findWhere(t => t.companyId === trip.companyId);
    const { id, tripNumber, status, driverToken, driverTokenExpiry, startedAt, arrivedAtOriginAt,
      loadingStartedAt, departedAt, arrivedAtDestinationAt, completedAt,
      actualDurationMinutes, createdAt, updatedAt, ...rest } = trip;

    const duplicated = db.trips.create({
      ...rest,
      id: uuidv4(),
      tripNumber: `${tripNumber}-COPIA`,
      status: 'pending',
      scheduledDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return res.status(201).json({ success: true, data: duplicated });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al duplicar viaje' });
  }
});

router.put('/:id/status', (req: Request, res: Response) => {
  try {
    const trip = db.trips.findById(req.params.id);
    if (!trip || trip.companyId !== req.user!.companyId) {
      return res.status(404).json({ success: false, error: 'Viaje no encontrado' });
    }
    const { status, notes } = req.body as { status: TripStatus; notes?: string };

    const now = new Date().toISOString();
    const updates: Partial<typeof trip> = { status, updatedAt: now };
    if (status === 'completed') updates.completedAt = now;
    if (status === 'cancelled') updates.completedAt = now;

    db.trips.update(req.params.id, updates);
    db.tripEvents.create({
      id: uuidv4(),
      tripId: trip.id,
      status,
      timestamp: now,
      notes: notes || `Estado actualizado a: ${status}`,
      createdBy: req.user!.userId,
      createdByType: 'company',
    });

    return res.json({ success: true, data: db.trips.findById(req.params.id) });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al actualizar estado' });
  }
});

router.get('/:id/location', (req: Request, res: Response) => {
  try {
    const trip = db.trips.findById(req.params.id);
    if (!trip || trip.companyId !== req.user!.companyId) {
      return res.status(404).json({ success: false, error: 'Viaje no encontrado' });
    }
    const locations = db.locations.findWhere(l => l.tripId === trip.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return res.json({ success: true, data: { locations, last: locations[0] || null } });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al obtener ubicación' });
  }
});

router.get('/:id/events', (req: Request, res: Response) => {
  try {
    const trip = db.trips.findById(req.params.id);
    if (!trip || trip.companyId !== req.user!.companyId) {
      return res.status(404).json({ success: false, error: 'Viaje no encontrado' });
    }
    const events = db.tripEvents.findWhere(e => e.tripId === trip.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return res.json({ success: true, data: events });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al obtener eventos' });
  }
});

export default router;
