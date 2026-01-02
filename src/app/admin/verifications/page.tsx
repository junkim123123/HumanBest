import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { formatDistance } from 'date-fns'
import type { Verification } from '@/types/database'

async function getVerifications(): Promise<Verification[]> {
  const supabase = getSupabaseAdmin()
  const { data: verifications } = await supabase
    .from('verifications')
    .select(`
      *,
      profiles!verifications_user_id_fkey(email),
      reports(product_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (verifications as Verification[]) || []
}

export default async function VerificationsPage() {
  const verifications = await getVerifications()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Verifications</h1>
        <p className="text-slate-600 mt-2">Track product verification requests</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {verifications.map((verification) => (
                <tr key={verification.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {(verification.reports as any)?.product_name || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {verification.verification_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {(verification.profiles as any)?.email || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      verification.status === 'completed' ? 'bg-green-100 text-green-800' :
                      verification.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      verification.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {verification.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {formatDistance(new Date(verification.created_at), new Date(), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {verifications.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No verifications found
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
