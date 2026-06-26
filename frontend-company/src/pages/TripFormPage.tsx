import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { get, post, put } from '../services/api';
import { Driver, Vehicle, Trip, Product } from '@shared/types';

export default function TripFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    contractingCompany: '',
    destinationClient: '',
    origin: '',
    originAddress: '',
    destination: '',
    destinationAddress: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '08:00',
    driverId: '',
    vehicleId: '',
    observations: '',
    totalWeightKg: 0,
    totalVolumeM3: 0,
    cargoValue: 0,
    cargoCurrency: 'ARS',
    estimatedDurationMinutes: 0,
    distanceKm: 0,
  });
  const [products, setProducts] = useState<Product[]>([{ name: '', quantity: 1, unit: 'unidades' }]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [driversData, vehiclesData] = await Promise.all([
          get<Driver[]>('/drivers?active=true'),
          get<Vehicle[]>('/vehicles?active=true&type=truck'),
        ]);
        setDrivers((driversData as unknown as { data?: Driver[] }).data || driversData as unknown as Driver[]);
        setVehicles((vehiclesData as unknown as { data?: Vehicle[] }).data || vehiclesData as unknown as Vehicle[]);

        if (isEdit) {
          const trip = await get<Trip>(`/trips/${id}`);
          const t = trip as Trip & { products?: Product[] };
          setForm({
            contractingCompany: t.contractingCompany || '',
            destinationClient: t.destinationClient || '',
            origin: t.origin || '',
            originAddress: t.originAddress || '',
            destination: t.destination || '',
            destinationAddress: t.destinationAddress || '',
            scheduledDate: t.scheduledDate || '',
            scheduledTime: t.scheduledTime || '08:00',
            driverId: t.driverId || '',
            vehicleId: t.vehicleId || '',
            observations: t.observations || '',
            totalWeightKg: t.totalWeightKg || 0,
            totalVolumeM3: t.totalVolumeM3 || 0,
            cargoValue: t.cargoValue || 0,
            cargoCurrency: t.cargoCurrency || 'ARS',
            estimatedDurationMinutes: t.estimatedDurationMinutes || 0,
            distanceKm: t.distanceKm || 0,
          });
          if (t.products?.length) setProducts(t.products);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function setField(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function setProduct(i: number, field: keyof Product, value: unknown) {
    setProducts(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }

  function addProduct() {
    setProducts(prev => [...prev, { name: '', quantity: 1, unit: 'unidades' }]);
  }

  function removeProduct(i: number) {
    setProducts(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, products };
      if (isEdit) {
        await put(`/trips/${id}`, body);
        navigate(`/trips/${id}`);
      } else {
        const trip = await post<Trip>('/trips', body);
        navigate(`/trips/${trip.id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" /></div>;
  }

  const fieldClass = "w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to={isEdit ? `/trips/${id}` : '/trips'} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Editar viaje' : 'Nuevo viaje'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Empresas */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Empresas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Empresa contratante *</label>
              <input className={fieldClass} required value={form.contractingCompany} onChange={e => setField('contractingCompany', e.target.value)} placeholder="Ej: Supermercados DIA S.A." />
            </div>
            <div>
              <label className={labelClass}>Cliente destino *</label>
              <input className={fieldClass} required value={form.destinationClient} onChange={e => setField('destinationClient', e.target.value)} placeholder="Ej: DIA CD Norte" />
            </div>
          </div>
        </div>

        {/* Ruta */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Ruta</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Ciudad origen *</label>
              <input className={fieldClass} required value={form.origin} onChange={e => setField('origin', e.target.value)} placeholder="Ej: Buenos Aires" />
            </div>
            <div>
              <label className={labelClass}>Dirección origen</label>
              <input className={fieldClass} value={form.originAddress} onChange={e => setField('originAddress', e.target.value)} placeholder="Av. Corrientes 1234, CABA" />
            </div>
            <div>
              <label className={labelClass}>Ciudad destino *</label>
              <input className={fieldClass} required value={form.destination} onChange={e => setField('destination', e.target.value)} placeholder="Ej: Rosario" />
            </div>
            <div>
              <label className={labelClass}>Dirección destino</label>
              <input className={fieldClass} value={form.destinationAddress} onChange={e => setField('destinationAddress', e.target.value)} placeholder="Av. Pellegrini 567, Rosario" />
            </div>
          </div>
        </div>

        {/* Fecha y asignación */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Programación y Asignación</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>Fecha *</label>
              <input type="date" className={fieldClass} required value={form.scheduledDate} onChange={e => setField('scheduledDate', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Hora</label>
              <input type="time" className={fieldClass} value={form.scheduledTime} onChange={e => setField('scheduledTime', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Distancia (km)</label>
              <input type="number" className={fieldClass} value={form.distanceKm || ''} onChange={e => setField('distanceKm', Number(e.target.value))} min="0" />
            </div>
            <div>
              <label className={labelClass}>Duración estimada (min)</label>
              <input type="number" className={fieldClass} value={form.estimatedDurationMinutes || ''} onChange={e => setField('estimatedDurationMinutes', Number(e.target.value))} min="0" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className={labelClass}>Chofer</label>
              <select className={fieldClass} value={form.driverId} onChange={e => setField('driverId', e.target.value)}>
                <option value="">Sin asignar</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} — {d.phone}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Camión</label>
              <select className={fieldClass} value={form.vehicleId} onChange={e => setField('vehicleId', e.target.value)}>
                <option value="">Sin asignar</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Carga */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Carga</h3>
            <button type="button" onClick={addProduct} className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium">
              <Plus className="w-3.5 h-3.5" /> Agregar producto
            </button>
          </div>
          <div className="space-y-3 mb-4">
            {products.map((p, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <input className={fieldClass} placeholder="Nombre del producto" value={p.name} onChange={e => setProduct(i, 'name', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <input type="number" className={fieldClass} placeholder="Cantidad" value={p.quantity} onChange={e => setProduct(i, 'quantity', Number(e.target.value))} min="1" />
                </div>
                <div className="col-span-3">
                  <input className={fieldClass} placeholder="Unidad" value={p.unit} onChange={e => setProduct(i, 'unit', e.target.value)} />
                </div>
                <div className="col-span-2 flex justify-end">
                  {products.length > 1 && (
                    <button type="button" onClick={() => removeProduct(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Peso total (kg)</label>
              <input type="number" className={fieldClass} value={form.totalWeightKg || ''} onChange={e => setField('totalWeightKg', Number(e.target.value))} min="0" />
            </div>
            <div>
              <label className={labelClass}>Volumen total (m³)</label>
              <input type="number" className={fieldClass} value={form.totalVolumeM3 || ''} onChange={e => setField('totalVolumeM3', Number(e.target.value))} min="0" />
            </div>
            <div>
              <label className={labelClass}>Valor de la carga</label>
              <input type="number" className={fieldClass} value={form.cargoValue || ''} onChange={e => setField('cargoValue', Number(e.target.value))} min="0" />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Observaciones</label>
            <textarea
              className={`${fieldClass} resize-none`}
              rows={3}
              value={form.observations}
              onChange={e => setField('observations', e.target.value)}
              placeholder="Instrucciones especiales, documentos requeridos, etc."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link to={isEdit ? `/trips/${id}` : '/trips'} className="px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear viaje'}
          </button>
        </div>
      </form>
    </div>
  );
}
