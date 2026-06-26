import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, User, Truck, Package, Edit,
  Share2, CheckCircle, AlertTriangle, Clock, Link2
} from 'lucide-react';
import { get, put, post } from '../services/api';
import { Trip, TripEvent, TRIP_STATUS_LABELS, TripStatus } from '@shared/types';
import StatusBadge from '../components/ui/StatusBadge';

interface TripDetail extends Trip {
  driver?: { id: string; name: string; phone: string };
  vehicle?: { plate: string; brand: string; model: string };
  events: TripEvent[];
  incidents: unknown[];
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [driverLink, setDriverLink] = useState('');

  async function load() {
    try {
      const data = await get<TripDetail>(`/trips/${id}`);
      setTrip(data);
    } catch {
      navigate('/trips');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function updateStatus(status: TripStatus) {
    setActionLoading(status);
    try {
      await put(`/trips/${id}/status`, { status });
      await load();
    } finally {
      setActionLoading('');
    }
  }

  async function generateDriverLink() {
    setActionLoading('link');
    try {
      const data = await post<{ link: string }>('/auth/driver/token/generate', { tripId: id });
      setDriverLink(data.link);
      await load();
    } finally {
      setActionLoading('');
    }
  }

  async function duplicateTrip() {
    setActionLoading('dup');
    try {
      const data = await post<Trip>(`/trips/${id}/duplicate`);
      navigate(`/trips/${data.id}`);
    } finally {
      setActionLoading('');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/trips"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{trip.tripNumber}</h1>
              <StatusBadge status={trip.status} />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{trip.contractingCompany} → {trip.destinationClient}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={duplicateTrip}
            disabled={!!actionLoading}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
          >
            Duplicar
          </button>
          <Link
            to={`/trips/${id}/edit`}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <Edit className="w-4 h-4" /> Editar
          </Link>
          {trip.driverId && !['completed', 'cancelled'].includes(trip.status) && (
            <button
              onClick={generateDriverLink}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors font-medium"
            >
              <Share2 className="w-4 h-4" />
              {actionLoading === 'link' ? 'Generando...' : 'Enviar link al chofer'}
            </button>
          )}
        </div>
      </div>

      {/* Driver link */}
      {driverLink && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="w-4 h-4 text-green-600" />
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">Link generado exitosamente</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={driverLink}
              className="flex-1 text-xs bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 font-mono"
            />
            <button
              onClick={() => navigator.clipboard.writeText(driverLink)}
              className="px-3 py-2 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Copiar
            </button>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1.5">Válido por 48 horas. Enviar por WhatsApp o SMS al chofer.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Ruta</h3>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mt-1" />
                <div className="w-0.5 h-12 bg-gray-200 dark:bg-gray-700 my-1" />
                <div className="w-3 h-3 rounded-full bg-red-500" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Origen</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{trip.origin}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {trip.originAddress}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Destino</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{trip.destination}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {trip.destinationAddress}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Fecha programada</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1 justify-end">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {trip.scheduledDate}
                </p>
                <p className="text-sm text-gray-500">{trip.scheduledTime}h</p>
                {trip.distanceKm && (
                  <p className="text-xs text-gray-400 mt-1">{trip.distanceKm} km</p>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Línea de tiempo</h3>
            {trip.events.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sin eventos registrados aún</p>
            ) : (
              <div className="space-y-3">
                {trip.events.map((event, i) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full mt-0.5 ${i === trip.events.length - 1 ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      {i < trip.events.length - 1 && <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700 mt-1" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={event.status} size="sm" />
                        <span className="text-xs text-gray-400">
                          {new Date(event.timestamp).toLocaleString('es-AR')}
                        </span>
                      </div>
                      {event.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{event.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cargo */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" /> Carga
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{trip.totalWeightKg.toLocaleString()}</p>
                <p className="text-xs text-gray-500">kg</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{trip.totalVolumeM3.toLocaleString()}</p>
                <p className="text-xs text-gray-500">m³</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ${(trip.cargoValue / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-gray-500">{trip.cargoCurrency}</p>
              </div>
            </div>
            {trip.products.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-700 dark:text-gray-300">{p.name}</p>
                <p className="text-sm text-gray-500">{p.quantity} {p.unit}</p>
              </div>
            ))}
            {trip.observations && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                  {trip.observations}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Driver */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" /> Chofer
            </h3>
            {trip.driver ? (
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{trip.driver.name}</p>
                <p className="text-sm text-gray-500">{trip.driver.phone}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Sin asignar</p>
            )}
          </div>

          {/* Vehicle */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-gray-400" /> Vehículo
            </h3>
            {trip.vehicle ? (
              <div>
                <p className="font-medium text-gray-900 dark:text-white font-mono">{trip.vehicle.plate}</p>
                <p className="text-sm text-gray-500">{trip.vehicle.brand} {trip.vehicle.model}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Sin asignar</p>
            )}
          </div>

          {/* Status actions */}
          {!['completed', 'cancelled'].includes(trip.status) && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Acciones</h3>
              <div className="space-y-2">
                {trip.status !== 'completed' && (
                  <button
                    onClick={() => updateStatus('completed')}
                    disabled={!!actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {actionLoading === 'completed' ? 'Procesando...' : 'Finalizar viaje'}
                  </button>
                )}
                <button
                  onClick={() => updateStatus('cancelled')}
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm rounded-lg transition-colors font-medium"
                >
                  Cancelar viaje
                </button>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" /> Tiempos
            </h3>
            <div className="space-y-2">
              {[
                ['Creado', trip.createdAt],
                ['Partida', trip.departedAt],
                ['Llegó origen', trip.arrivedAtOriginAt],
                ['Llegó destino', trip.arrivedAtDestinationAt],
                ['Completado', trip.completedAt],
              ].map(([label, val]) => val ? (
                <div key={label as string} className="flex justify-between text-xs">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {new Date(val as string).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ) : null)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
