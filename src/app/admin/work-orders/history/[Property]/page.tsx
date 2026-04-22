import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import LogoutButton from '@/components/LogoutButton';
import StatusBadge from '@/components/StatusBadge';
import { MaintenanceRequest } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function PropertyHistoryPage(props: {
  params: { property: string };
  searchParams: { q?: string };
}) {
  const { params, searchParams } = props;

  const propertyName = decodeURIComponent(params.property || '');
  const query = (searchParams.q || '').toLowerCase();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data } = await supabase
    .from('maintenance_requests')
    .select('*')
    .eq('property_name', propertyName)
    .in('status', ['Completed', 'Closed'])
    .order('completed_at', { ascending: false });

  const orders = (data || []) as MaintenanceRequest[];

  const filtered = query
    ? orders.filter((o) =>
        [
          o.title,
          o.category,
          o.priority,
          o.status,
          o.description,
          o.property_name,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      )
    : orders;

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <Link
              href="/admin/work-orders/history"
              className="text-black font-semibold"
            >
              ← Back to Historical Properties
            </Link>

            <h1 className="text-3xl font-bold text-black mt-2">
              {propertyName}
            </h1>

            <p className="text-black">
              Historical work orders for this property
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/requests"
              className="border px-4 py-2 text-black"
            >
              Maintenance Requests
            </Link>

            <Link
              href="/admin/work-orders"
              className="border px-4 py-2 text-black"
            >
              Open Work Orders
            </Link>

            <LogoutButton />
          </div>
        </div>

        <div className="mb-6 bg-white p-4 shadow border">
          <form className="flex gap-2">
            <input
              name="q"
              defaultValue={searchParams.q}
              placeholder="Search..."
              className="flex-1 border rounded px-3 py-2 text-black"
            />

            <button className="bg-black text-white px-4 py-2 rounded">
              Search
            </button>

            <Link
              href={`/admin/work-orders/history/${encodeURIComponent(
                propertyName
              )}`}
              className="border px-4 py-2 text-black"
            >
              Clear
            </Link>
          </form>
        </div>

        <div className="bg-white shadow border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white border-b">
              <tr>
                <th className="p-3 text-left text-black">#</th>
                <th className="p-3 text-left text-black">Title</th>
                <th className="p-3 text-left text-black">Category</th>
                <th className="p-3 text-left text-black">Priority</th>
                <th className="p-3 text-left text-black">Status</th>
                <th className="p-3 text-left text-black">Completed</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-black">
                    No historical work orders found for this property.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="p-3 text-black">
                      {order.request_number}
                    </td>
                    <td className="p-3 text-black">{order.title}</td>
                    <td className="p-3 text-black">{order.category}</td>
                    <td className="p-3 text-black">{order.priority}</td>
                    <td className="p-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-3 text-black">
                      {order.completed_at
                        ? new Date(order.completed_at).toLocaleString()
                        : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}