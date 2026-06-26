import { TripStatus, TRIP_STATUS_LABELS } from '@shared/types';

const STATUS_COLORS: Record<TripStatus, string> = {
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  assigned: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  driver_notified: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  heading_to_origin: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  arrived_at_origin: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  loading: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  loading_complete: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  in_transit: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  arrived_at_destination: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  unloading: 'bg-lime-50 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300',
  delivered: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  cancelled: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

interface Props {
  status: TripStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${STATUS_COLORS[status]}`}>
      {TRIP_STATUS_LABELS[status]}
    </span>
  );
}
