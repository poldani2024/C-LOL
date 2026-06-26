import { useEffect, useState } from 'react';
import { Truck, Plus, Search, Edit, Trash2, X, AlertTriangle } from 'lucide-react';
import { get, post, put, del } from '../services/api';
import { Vehicle, VehicleType } from '@shared/types';

const emptyForm = {
  type: 'truck' as VehicleType,
  brand: '', model: '', year: new Date().getFullYear(), plate: '', vin: '',
  color: '', maxWeightKg: 25000, maxVolumeM3: 85,
  insuranceCompany: '', insurancePolicyNumber: '', insuranceExpiry: '', vtExpiry: '', notes: '',
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await get<Vehicle[]>('/vehicles');
      setVehicles((res as unknown as { data?: Vehicle[] }).data || res as unknown as Vehicle[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = vehicles.filter(v =>
    !search || v.plate.toLowerCase().includes(search.toLowerCase()) ||
    v.brand.toLowerCase().includes(search.toLowerCase())
  );

  function isExpiringSoon(dateStr?: string): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff < 30 && diff > 0;
  }

  function isExpired(dateStr?: string): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }

  function openEdit(v: Vehicle) {
    setEditId(v.id);
    setForm({
      type: v.type, brand: v.brand, model: v.model, year: v.year, plate: v.plate,
      vin: v.vin || '', color: v.color || '', maxWeightKg: v.maxWeightKg, maxVolumeM3: v.maxVolumeM3,
      insuranceCompany: v.insuranceCompany || '', insurancePolicyNumber: v.insurancePolicyNumber || '',
      insuranceExpiry: v.insuranceExpiry || '', vtExpiry: v.vtExpiry || '', notes: v.notes || '',
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) await put(`/vehicles/${editId}`, form);
      else await post('/vehicles', form);
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Desactivar este vehículo?')) return;
    await del(`/vehicles/${id}`);
    await load();
  }

  const fieldClass = "w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";
  const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1";

  const typeLabels: Record<VehicleType, string> = {
    truck: 'Camión', trailer: 'Acoplado', semi: 'Semi'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vehículos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{vehicles.filter(v => v.active).length} activos</p>
        </div>
        <button onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors text-sm">
          <Plus className="w-4 h-4" /> Nuevo vehículo
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Buscar por patente o marca..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(v => (
            <div key={v.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      {typeLabels[v.type]}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${v.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500'}`}>
                      {v.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white font-mono tracking-wider">{v.plate}</p>
                  <p className="text-sm text-gray-500">{v.brand} {v.model} {v.year}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(v)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(v.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <p className="font-semibold text-gray-900 dark:text-white">{(v.maxWeightKg / 1000).toFixed(0)}t</p>
                  <p className="text-xs text-gray-400">Peso máx</p>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <p className="font-semibold text-gray-900 dark:text-white">{v.maxVolumeM3}m³</p>
                  <p className="text-xs text-gray-400">Volumen</p>
                </div>
              </div>
              {(v.insuranceExpiry || v.vtExpiry) && (
                <div className="mt-3 space-y-1">
                  {v.insuranceExpiry && (
                    <div className={`flex items-center justify-between text-xs px-2 py-1 rounded ${isExpired(v.insuranceExpiry) ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : isExpiringSoon(v.insuranceExpiry) ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'text-gray-500'}`}>
                      <span>Seguro</span>
                      <span className="flex items-center gap-1">
                        {(isExpired(v.insuranceExpiry) || isExpiringSoon(v.insuranceExpiry)) && <AlertTriangle className="w-3 h-3" />}
                        {v.insuranceExpiry}
                      </span>
                    </div>
                  )}
                  {v.vtExpiry && (
                    <div className={`flex items-center justify-between text-xs px-2 py-1 rounded ${isExpired(v.vtExpiry) ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : isExpiringSoon(v.vtExpiry) ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'text-gray-500'}`}>
                      <span>VTV</span>
                      <span className="flex items-center gap-1">
                        {(isExpired(v.vtExpiry) || isExpiringSoon(v.vtExpiry)) && <AlertTriangle className="w-3 h-3" />}
                        {v.vtExpiry}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No hay vehículos registrados</p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editId ? 'Editar vehículo' : 'Nuevo vehículo'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tipo *</label>
                  <select className={fieldClass} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as VehicleType }))}>
                    <option value="truck">Camión</option>
                    <option value="trailer">Acoplado</option>
                    <option value="semi">Semi</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Patente *</label>
                  <input className={fieldClass} required value={form.plate} onChange={e => setForm(f => ({ ...f, plate: e.target.value.toUpperCase() }))} placeholder="AB 123 CD" />
                </div>
                <div>
                  <label className={labelClass}>Marca *</label>
                  <input className={fieldClass} required value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Modelo *</label>
                  <input className={fieldClass} required value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Año</label>
                  <input type="number" className={fieldClass} value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} min="1990" max="2030" />
                </div>
                <div>
                  <label className={labelClass}>Color</label>
                  <input className={fieldClass} value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Peso máx (kg)</label>
                  <input type="number" className={fieldClass} value={form.maxWeightKg} onChange={e => setForm(f => ({ ...f, maxWeightKg: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className={labelClass}>Volumen máx (m³)</label>
                  <input type="number" className={fieldClass} value={form.maxVolumeM3} onChange={e => setForm(f => ({ ...f, maxVolumeM3: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className={labelClass}>Aseguradora</label>
                  <input className={fieldClass} value={form.insuranceCompany} onChange={e => setForm(f => ({ ...f, insuranceCompany: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>N° Póliza</label>
                  <input className={fieldClass} value={form.insurancePolicyNumber} onChange={e => setForm(f => ({ ...f, insurancePolicyNumber: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Venc. Seguro</label>
                  <input type="date" className={fieldClass} value={form.insuranceExpiry} onChange={e => setForm(f => ({ ...f, insuranceExpiry: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Venc. VTV</label>
                  <input type="date" className={fieldClass} value={form.vtExpiry} onChange={e => setForm(f => ({ ...f, vtExpiry: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Notas</label>
                  <textarea className={`${fieldClass} resize-none`} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">Cancelar</button>
                <button type="submit" disabled={saving} className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-sm disabled:opacity-60">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
