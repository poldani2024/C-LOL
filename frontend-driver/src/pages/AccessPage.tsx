import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { accessWithToken } from '../services/api';

export default function AccessPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Token no válido');
      return;
    }

    accessWithToken(token)
      .then(data => {
        localStorage.setItem('c-lol-driver-token', data.token);
        localStorage.setItem('c-lol-driver-trip', JSON.stringify(data.trip));
        localStorage.setItem('c-lol-driver', JSON.stringify(data.driver));
        setStatus('success');
        setTimeout(() => navigate('/'), 1500);
      })
      .catch(err => {
        setStatus('error');
        setErrorMsg(err.response?.data?.error || 'Link inválido o expirado');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="text-center max-w-sm w-full">
        <div className="w-20 h-20 bg-brand-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <Truck className="w-10 h-10 text-brand-300" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">C-LOL</h1>
        <p className="text-gray-400 mb-10">Portal del Conductor</p>

        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-brand-400 animate-spin mx-auto" />
            <p className="text-lg text-gray-300">Verificando acceso...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
            <p className="text-xl font-semibold text-white">¡Acceso confirmado!</p>
            <p className="text-gray-400">Cargando tu viaje...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
            <p className="text-xl font-semibold text-white">Link inválido</p>
            <p className="text-gray-400">{errorMsg}</p>
            <p className="text-sm text-gray-500 mt-4">
              Contactá a tu empresa para recibir un nuevo link de acceso.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
