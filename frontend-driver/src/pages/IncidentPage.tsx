import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { reportIncident } from '../services/api';

const INCIDENT_TYPES = [
  { value: 'mechanical', label: '🔧 Problema mecánico', color: 'bg-orange-900/40 border-orange-700' },
  { value: 'accident', label: '🚗 Accidente', color: 'bg-red-900/40 border-red-700' },
  { value: 'traffic', label: '🚦 Tráfico / demora', color: 'bg-amber-900/40 border-amber-700' },
  { value: 'weather', label: '⛈️ Condiciones climáticas', color: 'bg-blue-900/40 border-blue-700' },
  { value: 'documentation', label: '📄 Problema con documentos', color: 'bg-purple-900/40 border-purple-700' },
  { value: 'other', label: '❓ Otro', color: 'bg-gray-800 border-gray-700' },
];

export default function IncidentPage() {
  const navigate = useNavigate();
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useState(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  });

  async function handleReport() {
    if (!type) { alert('Seleccioná el tipo de incidencia'); return; }
    if (!description.trim()) { alert('Describí la incidencia'); return; }
    setSaving(true);
    try {
      await reportIncident(type, description, location?.lat, location?.lng);
      setDone(true);
      setTimeout(() => navigate('/'), 2000);
    } catch {
      alert('Error al reportar. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">¡Incidencia reportada!</p>
          <p className="text-gray-400 mt-2">La empresa fue notificada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="px-5 pt-12 pb-5 safe-top bg-gray-900">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>
        <h1 className="text-2xl font-bold text-white">Reportar incidencia</h1>
        <p className="text-gray-400 text-sm mt-1">Informá cualquier problema durante el viaje</p>
      </div>

      <div className="flex-1 px-5 py-6 space-y-6">
        {/* Type selection */}
        <div>
          <p className="text-sm font-medium text-gray-300 mb-3">Tipo de incidencia</p>
          <div className="space-y-2">
            {INCIDENT_TYPES.map(inc => (
              <button
                key={inc.value}
                onClick={() => setType(inc.value)}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 text-base font-medium transition-all active:scale-95 ${
                  type === inc.value
                    ? `${inc.color} text-white border-2`
                    : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-600'
                }`}
              >
                {inc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-900 rounded-2xl p-5">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Descripción *
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            rows={5}
            placeholder="Describí detalladamente qué ocurrió, dónde estás y qué necesitás..."
          />
        </div>

        {location && (
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs text-gray-400">Ubicación GPS incluida en el reporte</p>
          </div>
        )}
      </div>

      <div className="px-5 pb-8 safe-bottom">
        <button
          onClick={handleReport}
          disabled={saving}
          className="w-full py-5 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-60 rounded-2xl text-xl font-bold text-white flex items-center justify-center gap-3 transition-all active:scale-95"
        >
          {saving ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <AlertTriangle className="w-6 h-6" />
              Reportar incidencia
            </>
          )}
        </button>
      </div>
    </div>
  );
}
