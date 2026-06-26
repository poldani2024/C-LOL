import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, FileText, Check, Loader2 } from 'lucide-react';
import { addEvent } from '../services/api';

export default function EvidencePage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) {
          setPhotos(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleSave() {
    if (!notes && photos.length === 0) {
      alert('Agregá una foto o comentario');
      return;
    }
    setSaving(true);
    try {
      await addEvent(notes, undefined, undefined, photos);
      setDone(true);
      setTimeout(() => navigate('/'), 1500);
    } catch {
      alert('Error al guardar. Intentá de nuevo.');
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
          <p className="text-2xl font-bold text-white">¡Guardado!</p>
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
        <h1 className="text-2xl font-bold text-white">Evidencias</h1>
        <p className="text-gray-400 text-sm mt-1">Fotos y observaciones del viaje</p>
      </div>

      <div className="flex-1 px-5 py-6 space-y-6">
        {/* Photo capture */}
        <div className="bg-gray-900 rounded-2xl p-5">
          <p className="text-sm font-medium text-gray-300 mb-3">Fotos</p>
          <label className="block w-full">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={handlePhotoCapture}
            />
            <div className="w-full py-8 bg-gray-800 hover:bg-gray-750 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center gap-3 cursor-pointer transition-colors active:bg-gray-700">
              <Camera className="w-10 h-10 text-gray-500" />
              <p className="text-gray-400 font-medium">Tomar foto</p>
              <p className="text-xs text-gray-600">Cargue, descarga, documentos...</p>
            </div>
          </label>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square">
                  <img src={p} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button
                    onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-gray-900 rounded-2xl p-5">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            <FileText className="w-4 h-4 inline mr-2 text-gray-400" />
            Observaciones
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            rows={5}
            placeholder="Describí el estado de la carga, condiciones de entrega, etc."
          />
        </div>
      </div>

      <div className="px-5 pb-8 safe-bottom">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-5 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 disabled:opacity-60 rounded-2xl text-xl font-bold text-white flex items-center justify-center gap-3 transition-all active:scale-95"
        >
          {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Guardar evidencia'}
        </button>
      </div>
    </div>
  );
}
