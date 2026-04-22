import { RequestStatus } from '@/lib/types';

export default function StatusBadge({ status }: { status: RequestStatus }) {
  const styles: Record<RequestStatus, string> = {
    New: 'bg-slate-100 text-slate-900 border-slate-200',
    'In Review': 'bg-blue-50 text-blue-900 border-blue-200',
    Assigned: 'bg-purple-50 text-purple-900 border-purple-200',
    'In Progress': 'bg-amber-50 text-amber-900 border-amber-200',
    'Waiting on Tenant': 'bg-orange-50 text-orange-900 border-orange-200',
    Completed: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    Closed: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}
