import { listAdminQueue } from '@/server/actions/admin'
import { requireAdminUser } from '@/lib/auth/admin'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function AdminQueuePage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireAdminUser()
  const resolved = await searchParams
  const search = resolved?.q || ''
  const statusFilter = resolved?.status || 'all'
  const result = await listAdminQueue({ search })
  const formatContact = (order: any) => {
    const meta = order?.metadata || {} as any
    return order.contact_email || order.contact_whatsapp || meta.contact_email || meta.contact_whatsapp || meta.contact || '—'
  }

  const statusFilters = [
    { id: 'all', label: 'All', matches: (s: string) => true },
    { id: 'awaiting_contact', label: 'Awaiting contact', matches: (s: string) => s === 'awaiting_contact' },
    { id: 'contacted', label: 'Contacted', matches: (s: string) => s === 'contacted' },
    { id: 'meeting_scheduled', label: 'Meeting scheduled', matches: (s: string) => s === 'meeting_scheduled' },
    { id: 'quotes_received', label: 'Quotes received', matches: (s: string) => ['awaiting_invoice', 'awaiting_payment', 'in_progress', 'pending_shipment', 'shipped'].includes(s) },
    { id: 'closed', label: 'Closed', matches: (s: string) => s === 'closed' },
  ]

  const activeFilter = statusFilters.find((f) => f.id === statusFilter) || statusFilters[0]
  const filteredOrders = (result.orders || []).filter((order: any) => activeFilter.matches(order.status))
  const hasEvidence = filteredOrders.some((order: any) => !!order.report_snapshot_json?.evidence_tier)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ops Queue</h1>
          <p className="text-slate-600">Requests awaiting contact</p>
        </div>
        <form className="flex items-center gap-2" method="get">
          <input
            name="q"
            defaultValue={search}
            placeholder="Search product or email"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Search</button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {statusFilters.map((f) => {
          const url = new URLSearchParams()
          if (search) url.set('q', search)
          if (f.id !== 'all') url.set('status', f.id)
          const href = url.toString() ? `?${url.toString()}` : ''
          const active = f.id === activeFilter.id
          return (
            <Link
              key={f.id}
              href={href}
              className={`rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
                active ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {!result.success && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {result.error || 'Failed to load queue'}
        </div>
      )}

      {result.success && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Customer</th>
                {hasEvidence && <th className="px-4 py-3">Evidence</th>}
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrders.map((order: any) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{order.product_name}</td>
                  <td className="px-4 py-3 text-slate-700">
                    <div className="font-semibold text-slate-900">{(order.profiles as any)?.email || order.user_id || '—'}</div>
                    <div className="text-xs text-slate-600">{formatContact(order)}</div>
                  </td>
                  {hasEvidence && (
                    <td className="px-4 py-3 text-slate-700">{order.report_snapshot_json?.evidence_tier || '—'}</td>
                  )}
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{order.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/orders/${order.id}`} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">Open</Link>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={hasEvidence ? 5 : 4} className="px-4 py-6 text-center text-slate-500">No requests matching this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
