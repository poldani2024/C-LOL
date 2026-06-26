import { AlertCircle, Truck } from 'lucide-react';

export default function ExpiredPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Truck className="w-10 h-10 text-gray-600" />
        </div>
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-3">Sesión expirada</h1>
        <p className="text-gray-400 leading-relaxed">
          Tu link de acceso expiró o no es válido.
          Contactá a tu empresa para recibir un nuevo link de acceso al viaje.
        </p>
        <div className="mt-8 p-4 bg-gray-900 rounded-xl text-left">
          <p className="text-xs text-gray-500 mb-1">¿Qué hacer?</p>
          <p className="text-sm text-gray-300">1. Llamá a la empresa</p>
          <p className="text-sm text-gray-300">2. Pedí que te envíen un nuevo link</p>
          <p className="text-sm text-gray-300">3. Hacé clic en el link nuevo</p>
        </div>
      </div>
    </div>
  );
}
