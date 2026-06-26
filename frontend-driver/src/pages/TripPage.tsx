import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Navigation, Phone, Package, Truck, ChevronRight,
  AlertTriangle, Camera, RefreshCw, Clock
} from 'lucide-react';
import { getMyTrip, sendLocation } from '../services/api';
import { Trip, Driver, Vehicle, TRIP_STATUS_LABELS, DRIVER_STATUS_TRANSITIONS, DRIVER_STATUS_LABELS, TripStatus, TRIP_STATUS_ORDER } from '@shared/types';

interface TripWithDetails extends Trip {
  vehicle?: Vehicle;
}

export default function TripPage() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [driver] = useState<Driver | null>(() => {
    const raw = localStorage.getItem('c-lol-driver');
    return raw ? JSON.parse(raw) : null;
  });

  const load = useCallback(async () => {
    try {
      const data = await getMyTrip();
      setTrip(data);
      localStorage.setItem('c-lol-driver-trip', JSON.stringify(data));
    } catch {
      // offline fallback
      const raw = localStorage.getItem('c-lol-driver-trip');
      if (raw) setTrip(JSON.parse(raw));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // GPS tracking
    let watchId: number;
    if ('geolocation' in navigator && trip && !['completed', 'cancelled', 'delivered'].includes(trip.status)) {
      watchId = navigator.geolocation.watchPosition(
        pos => sendLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.speed || undefined).catch(() => {}),
        () => {},
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [load, trip?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Truck className="w-12 h-12 text-brand-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Cargando viaje...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-xl font-bold text-white mb-2">Sin viaje asignado</p>
          <p className="text-gray-400">No tenés viajes activos en este momento.</p>
        </div>
      </div>
    );
  }

  const statusIdx = TRIP_STATUS_ORDER.indexOf(trip.status);
  const progress = Math.round((statusIdx / (TRIP_STATUS_ORDER.length - 1)) * 100);
  const nextAction = DRIVER_STATUS_TRANSITIONS[trip.status];
  const nextLabel = nextAction ? DRIVER_STATUS_LABELS[trip.status] : null;
  const isFinished = ['completed', 'cancelled', 'delivered'].includes(trip.status);

  function openMaps(address: string) {
    const url = `https://maps.google.com/maps?q=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-brand-950 px-5 pt-12 pb-5 safe-top">
        <div className="flex items-center justify-between mb-1">
          <p className="text-brand-300 text-sm font-medium">¡Hola, {driver?.name?.split(' ')[0]}!</p>
          <button onClick={load} className="p-2 text-brand-400 hover:text-brand-200 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-white">{trip.tripNumber}</h1>
        <p className="text-brand-300 text-sm">{trip.contractingCompany}</p>
      </div>

      {/* Status */}
      <div className="bg-gray-900 mx-4 -mt-1 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Estado actual</span>
          <span className="text-xs text-gray-500">{Math.max(0, statusIdx)}/ {TRIP_STATUS_ORDER.length - 1}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full mb-3">
          <div
            className="h-1.5 bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-lg font-bold text-white">{TRIP_STATUS_LABELS[trip.status]}</p>
      </div>

      {/* Route card */}
      <div className="mx-4 mt-4 bg-gray-900 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center mt-1">
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <div className="w-0.5 h-10 bg-gray-700 my-1" />
            <div className="w-3 h-3 rounded-full bg-red-400" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">ORIGEN</p>
              <p className="font-semibold text-white">{trip.origin}</p>
              <p className="text-sm text-gray-400">{trip.originAddress}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">DESTINO</p>
              <p className="font-semibold text-white">{trip.destination}</p>
              <p className="text-sm text-gray-400">{trip.destinationAddress}</p>
            </div>
          </div>
        </div>

        {/* Map buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => openMaps(trip.originAddress || trip.origin)}
            className="flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-750 rounded-xl text-sm font-medium text-gray-200 transition-colors active:scale-95"
          >
            <Navigation className="w-4 h-4 text-emerald-400" />
            Ir al origen
          </button>
          <button
            onClick={() => openMaps(trip.destinationAddress || trip.destination)}
            className="flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-750 rounded-xl text-sm font-medium text-gray-200 transition-colors active:scale-95"
          >
            <MapPin className="w-4 h-4 text-red-400" />
            Ir al destino
          </button>
        </div>
      </div>

      {/* Trip details */}
      <div className="mx-4 mt-4 bg-gray-900 rounded-2xl p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">FECHA Y HORA</p>
            <p className="text-sm font-semibold text-white">{trip.scheduledDate}</p>
            <p className="text-sm text-gray-400">{trip.scheduledTime}h</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">CARGA</p>
            <p className="text-sm font-semibold text-white">{trip.totalWeightKg.toLocaleString()} kg</p>
            <p className="text-sm text-gray-400">{trip.totalVolumeM3} m³</p>
          </div>
          {trip.vehicle && (
            <div className="col-span-2">
              <p className="text-xs text-gray-500 mb-1">VEHÍCULO</p>
              <p className="text-sm font-semibold text-white font-mono">{trip.vehicle.plate}</p>
              <p className="text-sm text-gray-400">{trip.vehicle.brand} {trip.vehicle.model}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mx-4 mt-4 mb-4 space-y-3">
        {/* Primary action */}
        {nextLabel && !isFinished && (
          <button
            onClick={() => navigate('/update')}
            className="w-full py-5 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 rounded-2xl text-xl font-bold text-white flex items-center justify-center gap-3 shadow-lg shadow-brand-900/50 transition-all active:scale-95"
          >
            <ChevronRight className="w-7 h-7" />
            {nextLabel}
          </button>
        )}

        {isFinished && (
          <div className="w-full py-5 bg-emerald-900/30 border border-emerald-700 rounded-2xl text-center">
            <p className="text-xl font-bold text-emerald-300">✓ Viaje finalizado</p>
          </div>
        )}

        {/* Secondary actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/evidence')}
            className="py-4 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-semibold text-gray-200 flex items-center justify-center gap-2 transition-colors active:scale-95"
          >
            <Camera className="w-5 h-5 text-gray-400" />
            Evidencias
          </button>
          <button
            onClick={() => navigate('/incident')}
            className="py-4 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-semibold text-gray-200 flex items-center justify-center gap-2 transition-colors active:scale-95"
          >
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Incidencia
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto px-5 py-4 text-center safe-bottom">
        <p className="text-xs text-gray-600">C-LOL Conductor v1.0 · Última actualización: {new Date().toLocaleTimeString('es-AR')}</p>
      </div>
    </div>
  );
}
