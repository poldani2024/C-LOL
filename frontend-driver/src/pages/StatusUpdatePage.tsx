import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, MapPin, Loader2 } from 'lucide-react';
import { getMyTrip, updateTripStatus } from '../services/api';
import { Trip, DRIVER_STATUS_TRANSITIONS, DRIVER_STATUS_LABELS, TRIP_STATUS_LABELS } from '@shared/types';

export default function StatusUpdatePage() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getMyTrip().then(data => setTrip(data)).catch(() => {
      const raw = localStorage.getItem('c-lol-driver-trip');
      if (raw) setTrip(JSON.parse(raw));
    });

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  async function handleConfirm() {
    if (!trip) return;
    setLoading(true);
    try {
      await updateTripStatus(notes || undefined, location?.lat, location?.lng);
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      alert('Error al actualizar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (!trip) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>;
  }

  const nextStatus = DRIVER_STATUS_TRANSITIONS[trip.status];
  const nextLabel = nextStatus ? DRIVER_STATUS_LABELS[trip.status] : null;

  if (!nextLabel) {
    navigate('/');
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChevronRight className="w-10 h-10 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">¡Actualizado!</p>
          <p className="text-gray-400 mt-2">{nextStatus ? TRIP_STATUS_LABELS[nextStatus] : ''}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-5 safe-top bg-gray-900">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>
        <h1 className="text-2xl font-bold text-white">Actualizar estado</h1>
        <p className="text-gray-400 text-sm mt-1">{trip.tripNumber}</p>
      </div>

      <div className="flex-1 px-5 py-6 space-y-6">
        {/* Current → Next */}
        <div className="bg-gray-900 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 text-center p-3 bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">ESTADO ACTUAL</p>
              <p className="text-sm font-semibold text-gray-300">{TRIP_STATUS_LABELS[trip.status]}</p>
            </div>
            <ChevronRight className="w-6 h-6 text-brand-400 shrink-0" />
            <div className="flex-1 text-center p-3 bg-brand-900/40 border border-brand-700 rounded-xl">
              <p className="text-xs text-brand-400 mb-1">NUEVO ESTADO</p>
              <p className="text-sm font-semibold text-brand-200">{nextStatus ? TRIP_STATUS_LABELS[nextStatus] : ''}</p>
            </div>
          </div>
        </div>

        {/* GPS */}
        <div className="bg-gray-900 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <MapPin className={`w-5 h-5 ${location ? 'text-emerald-400' : 'text-gray-600'}`} />
            <div>
              <p className="text-sm font-medium text-white">Ubicación GPS</p>
              {location ? (
                <p className="text-xs text-emerald-400">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
              ) : (
                <p className="text-xs text-gray-500">Obteniendo ubicación...</p>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-gray-900 rounded-2xl p-5">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Comentario (opcional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            rows={4}
            placeholder="Ingresá cualquier observación sobre el estado actual..."
          />
        </div>
      </div>

      {/* Confirm button */}
      <div className="px-5 pb-8 safe-bottom">
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full py-5 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 disabled:opacity-60 rounded-2xl text-xl font-bold text-white flex items-center justify-center gap-3 shadow-lg shadow-brand-900/50 transition-all active:scale-95"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <ChevronRight className="w-7 h-7" />
              {nextLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
