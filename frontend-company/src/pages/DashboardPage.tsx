import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PackageOpen, CheckCircle, AlertTriangle, Truck, Calendar, Bell,
  Users, ArrowRight, TrendingUp, Clock
} from 'lucide-react';
import { get } from '../services/api';
import { DashboardStats, Trip } from '@shared/types';
import StatusBadge from '../components/ui/StatusBadge';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsData, tripsData] = await Promise.all([
          get<DashboardStats>('/trips/stats'),
          get<Trip[]>('/trips'),
        ]);
        setStats(statsData);
        setRecentTrips((tripsData as unknown as { data?: Trip[] }).data
          ? (tripsData as unknown as { data: Trip[] }).data.slice(0, 5)
          : (tripsData as unknown as Trip[]).slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    );
  }

  const kpis = [
    {
      label: 'Viajes Activos',
      value: stats?.activeTrips ?? 0,
      icon: PackageOpen,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Finalizados',
      value: stats?.completedTrips ?? 0,
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Demorados',
      value: stats?.delayedTrips ?? 0,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      label: 'En Tránsito',
      value: stats?.trucksInTransit ?? 0,
      icon: Truck,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      label: 'Entregas Hoy',
      value: stats?.todayDeliveries ?? 0,
      icon: Calendar,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Alertas',
      value: stats?.pendingAlerts ?? 0,
      icon: Bell,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'Choferes',
      value: stats?.totalDrivers ?? 0,
      icon: Users,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    {
      label: 'Vehículos',
      value: stats?.totalVehicles ?? 0,
      icon: TrendingUp,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
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

      {/* Recent Trips */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Viajes Recientes</h2>
          <Link
            to="/trips"
            className="flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium"
          >
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {recentTrips.length === 0 ? (
            <div className="py-12 text-center text-gray-400">No hay viajes disponibles</div>
          ) : (
            recentTrips.map((trip: Trip) => (
              <Link
                key={trip.id}
                to={`/trips/${trip.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{trip.tripNumber}</span>
                    <StatusBadge status={trip.status} size="sm" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {trip.origin} → {trip.destination}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{trip.contractingCompany}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">{trip.scheduledDate}</p>
                  <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 mt-1 ml-auto" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
