import { useEffect, useState } from 'react';
import { Users, Plus, Search, Phone, FileText, Edit, Trash2, X } from 'lucide-react';
import { get, post, put, del } from '../services/api';
import { Driver, Vehicle } from '@shared/types';

interface DriverWithDetails extends Driver {
  vehicle?: Vehicle;
  tripsCount?: number;
}

const emptyForm = {
  name: '', phone: '', email: '', nationalId: '', licenseNumber: '',
  licenseExpiry: '', licenseType: 'A1', address: '', emergencyContact: '',
  emergencyPhone: '', notes: '', defaultVehicleId: '',
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverWithDetails[]>([]);
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
      const [driversRes, vehiclesRes] = await Promise.all([
        get<DriverWithDetails[]>('/drivers'),
        get<Vehicle[]>('/vehicles?active=true'),
      ]);
      setDrivers((driversRes as unknown as { data?: DriverWithDetails[] }).data || driversRes as unknown as DriverWithDetails[]);
      setVehicles((vehiclesRes as unknown as { data?: Vehicle[] }).data || vehiclesRes as unknown as Vehicle[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = drivers.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search)
  );

  function openNew() {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(d: DriverWithDetails) {
    setEditId(d.id);
    setForm({
      name: d.name, phone: d.phone, email: d.email || '', nationalId: d.nationalId,
      licenseNumber: d.licenseNumber, licenseExpiry: d.licenseExpiry, licenseType: d.licenseType,
      address: d.address || '', emergencyContact: d.emergencyContact || '',
      emergencyPhone: d.emergencyPhone || '', notes: d.notes || '',
      defaultVehicleId: d.defaultVehicleId || '',
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await put(`/drivers/${editId}`, form);
      } else {
        await post('/drivers', form);
      }
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Desactivar este chofer?')) return;
    await del(`/drivers/${id}`);
    await load();
  }

  const fieldClass = "w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";
  const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Choferes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{drivers.filter(d => d.active).length} activos</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors text-sm">
          <Plus className="w-4 h-4" /> Nuevo chofer
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(driver => (
            <div key={driver.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-lg">
                    {driver.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{driver.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${driver.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500'}`}>
                      {driver.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(driver)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(driver.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> {driver.phone}
                </p>
                <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <FileText className="w-3.5 h-3.5 text-gray-400" /> {driver.licenseNumber} ({driver.licenseType})
                </p>
                {driver.vehicle && (
                  <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <span className="text-gray-400">🚛</span> {driver.vehicle.plate} — {driver.vehicle.brand} {driver.vehicle.model}
                  </p>
                )}
                {driver.tripsCount !== undefined && (
                  <p className="text-xs text-gray-400">{driver.tripsCount} viajes realizados</p>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No hay choferes registrados</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editId ? 'Editar chofer' : 'Nuevo chofer'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>Nombre completo *</label>
                  <input className={fieldClass} required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Teléfono *</label>
                  <input className={fieldClass} required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+54 9 11..." />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" className={fieldClass} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>DNI *</label>
                  <input className={fieldClass} required value={form.nationalId} onChange={e => setForm(f => ({ ...f, nationalId: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>N° Licencia *</label>
                  <input className={fieldClass} required value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Tipo licencia</label>
                  <select className={fieldClass} value={form.licenseType} onChange={e => setForm(f => ({ ...f, licenseType: e.target.value }))}>
                    {['A1', 'A2', 'A3', 'B1', 'B2', 'C', 'D', 'E'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Vencimiento licencia *</label>
                  <input type="date" className={fieldClass} required value={form.licenseExpiry} onChange={e => setForm(f => ({ ...f, licenseExpiry: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Vehículo asignado</label>
                  <select className={fieldClass} value={form.defaultVehicleId} onChange={e => setForm(f => ({ ...f, defaultVehicleId: e.target.value }))}>
                    <option value="">Sin asignar</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Dirección</label>
                  <input className={fieldClass} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Contacto de emergencia</label>
                  <input className={fieldClass} value={form.emergencyContact} onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Teléfono de emergencia</label>
                  <input className={fieldClass} value={form.emergencyPhone} onChange={e => setForm(f => ({ ...f, emergencyPhone: e.target.value }))} />
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
