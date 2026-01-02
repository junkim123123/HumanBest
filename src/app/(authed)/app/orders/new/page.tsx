'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getVerificationQuotes } from '@/server/actions/orders';
import OrderWizard from '@/components/orders/OrderWizard';

export default function OrdersNewPage() {
  const searchParams = useSearchParams();
  const verificationId = searchParams.get('verificationId');
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuotes() {
      if (!verificationId) {
        setError('No verification ID provided');
        setLoading(false);
        return;
      }

      try {
        const result = await getVerificationQuotes(verificationId);
        if (result.error) {
          setError(result.error);
        } else {
          setQuotes(result.quotes || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load quotes');
      } finally {
        setLoading(false);
      }
    }

    loadQuotes();
  }, [verificationId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-electric-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading quotes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Error</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <a href="/app/reports" className="text-electric-blue-600 hover:underline">
            Back to reports
          </a>
        </div>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-lg font-bold text-slate-900 mb-2">No Quotes Available</h2>
          <p className="text-slate-600 mb-4">
            No verified supplier quotes are available for this verification. Please request quotes first.
          </p>
          <a href="/app/reports" className="text-electric-blue-600 hover:underline">
            Back to reports
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Order</h1>
          <p className="text-slate-600">Complete the steps below to create a new purchase order</p>
        </div>

        <OrderWizard verificationId={verificationId!} initialQuotes={quotes} />
      </div>
    </div>
  );
}
