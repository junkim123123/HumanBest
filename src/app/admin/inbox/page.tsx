import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { listAdminInbox } from '@/server/actions/admin'
import { requireAdminUser } from '@/lib/auth/admin'

export default async function InboxPage() {
  await requireAdminUser()
  const result = await listAdminInbox()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Inbox</h1>
        <p className="text-slate-600 mt-2">Recent user messages across orders</p>
      </div>

      {!result.success && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {result.error || 'Failed to load inbox'}
        </div>
      )}

      {result.success && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Latest message</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">When</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {(result.threads || []).map((thread: any) => (
                  <tr key={thread.order_id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      <div>{thread.orders?.order_number || thread.order_id}</div>
                      <div className="text-xs text-slate-500">{thread.orders?.product_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {(thread.orders?.profiles as any)?.email || thread.orders?.user_id || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <div className="max-w-md truncate">{thread.body}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/orders/${thread.order_id}?tab=messages`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(result.threads || []).length === 0 && (
              <div className="text-center py-12 text-slate-500">No user messages yet</div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
