import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Clock, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { get } from '../services/api';
import { Trip, TRIP_STATUS_LABELS, TripStatus } from '@shared/types';
import StatusBadge from '../components/ui/StatusBadge';

export default function ReportsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await get<Trip[]>('/trips');
        setTrips((res as unknown as { data?: Trip[] }).data || res as unknown as Trip[]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" /></div>;
  }

  const byStatus = Object.entries(TRIP_STATUS_LABELS).map(([status, label]) => ({
    status: status as TripStatus,
    label,
    count: trips.filter(t => t.status === status).length,
  })).filter(x => x.count > 0);

  const completed = trips.filter(t => t.status === 'completed');
  const cancelled = trips.filter(t => t.status === 'cancelled');

  function exportCSV() {
    const rows = [
      ['Número', 'Empresa', 'Origen', 'Destino', 'Fecha', 'Estado', 'Peso (kg)', 'Valor'].join(','),
      ...trips.map(t => [
        t.tripNumber, `"${t.contractingCompany}"`, t.origin, t.destination,
        t.scheduledDate, t.status, t.totalWeightKg, t.cargoValue
      ].join(',')),
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `c-lol-reportes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Análisis de la operación logística</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total viajes', value: trips.length, icon: BarChart3, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-900/20' },
          { label: 'Completados', value: completed.length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Cancelados', value: cancelled.length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Efectividad', value: `${trips.length ? Math.round(completed.length / trips.length * 100) : 0}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By status */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Distribución por estado</h3>
          <div className="space-y-3">
            {byStatus.map(({ status, count }) => (
              <div key={status} className="flex items-center gap-3">
                <StatusBadge status={status} size="sm" />
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-brand-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.round(count / trips.length * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By company */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Viajes por empresa contratante</h3>
          <div className="space-y-3">
            {Object.entries(
              trips.reduce<Record<string, number>>((acc, t) => {
                acc[t.contractingCompany] = (acc[t.contractingCompany] || 0) + 1;
                return acc;
              }, {})
            ).sort(([, a], [, b]) => b - a).map(([company, count]) => (
              <div key={company} className="flex items-center justify-between">
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{company}</p>
                <div className="flex items-center gap-2 ml-3">
                  <div className="w-24 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-brand-400 h-2 rounded-full"
                      style={{ width: `${Math.round(count / trips.length * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trips table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Detalle de viajes</h3>
          <Clock className="w-4 h-4 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                {['Número', 'Empresa', 'Ruta', 'Fecha', 'Estado', 'Carga (kg)', 'Valor'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {trips.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-2.5 px-4 text-sm font-mono text-gray-900 dark:text-white">{t.tripNumber}</td>
                  <td className="py-2.5 px-4 text-sm text-gray-600 dark:text-gray-300 max-w-[150px] truncate">{t.contractingCompany}</td>
                  <td className="py-2.5 px-4 text-sm text-gray-600 dark:text-gray-300">{t.origin} → {t.destination}</td>
                  <td className="py-2.5 px-4 text-sm text-gray-500">{t.scheduledDate}</td>
                  <td className="py-2.5 px-4"><StatusBadge status={t.status} size="sm" /></td>
                  <td className="py-2.5 px-4 text-sm text-gray-600 dark:text-gray-300">{t.totalWeightKg.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-sm text-gray-600 dark:text-gray-300">${(t.cargoValue / 1000).toFixed(0)}K</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
