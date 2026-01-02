'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Clock, Sparkles } from 'lucide-react';
import { getOrCreateVerification, startVerification, createMockQuotes } from '@/server/actions/verification';

interface NextStepCardProps {
  reportId: string;
  productName: string;
  verification: any;
  quotes: any[];
}

export default function NextStepCard({ reportId, productName, verification, quotes }: NextStepCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeQuotes = quotes.filter(q => {
    if (!q.expiration_at) return q.status === 'accepted';
    return new Date(q.expiration_at) > new Date() && q.status === 'accepted';
  });

  const hasActiveQuotes = activeQuotes.length > 0;

  const handleStartVerification = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create or get existing verification
      let verificationId = verification?.id;
      if (!verificationId) {
        const verificationResult = await getOrCreateVerification(reportId);
        if (verificationResult.error || !verificationResult.verification) {
          setError(verificationResult.error || 'Failed to create verification request');
          return;
        }
        verificationId = verificationResult.verification.id;
      }

      // Start verification
      const result = await startVerification(verificationId);
      if (result.success) {
        // Create mock quotes for development
        await createMockQuotes(verificationId, reportId, productName);
        window.location.reload();
      } else {
        setError(result.error || 'Failed to start verification');
      }
    } catch (err) {
      setError('Unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // No verification exists
  if (!verification) {
    return (
      <div className="bg-gradient-to-br from-electric-blue-50 to-white border-2 border-electric-blue-200 rounded-2xl p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-electric-blue-100">
            <Sparkles className="w-6 h-6 text-electric-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Ready for Next Step</h3>
            <p className="text-slate-600">
              Start verification to get supplier quotes and move towards execution
            </p>
          </div>
        </div>

        <button
          onClick={handleStartVerification}
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-r from-electric-blue-600 to-electric-blue-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? 'Starting...' : 'Start Verification'}
          <ArrowRight className="w-5 h-5" />
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Verification in progress
  if (verification.status === 'in_progress' || verification.status === 'pending') {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 rounded-2xl p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-100">
            <Clock className="w-6 h-6 text-amber-600 animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Verification in Progress</h3>
            <p className="text-slate-600 mb-4">
              We're working on getting quotes from verified suppliers. This typically takes 24-48 hours.
            </p>
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              <span>Expected completion: 1-2 business days</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verification completed with quotes
  if (verification.status === 'completed' && hasActiveQuotes) {
    const bestQuote = activeQuotes.reduce((best, q) => {
      return q.unit_price < best.unit_price ? q : best;
    }, activeQuotes[0]);

    return (
      <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 rounded-2xl p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-emerald-100">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Quotes Ready!</h3>
            <p className="text-slate-600 mb-4">
              We've received {activeQuotes.length} verified {activeQuotes.length === 1 ? 'quote' : 'quotes'} from trusted suppliers
            </p>
            <div className="flex items-center gap-3 text-sm">
              <div className="px-3 py-1.5 bg-emerald-100 rounded-full text-emerald-700 font-semibold">
                Best price: ${bestQuote.unit_price.toFixed(2)} / unit
              </div>
              <div className="px-3 py-1.5 bg-slate-100 rounded-full text-slate-700 font-semibold">
                MOQ from {Math.min(...activeQuotes.map(q => q.moq))} units
              </div>
            </div>
          </div>
        </div>

        <Link
          href={`/app/orders/new?verificationId=${verification.id}&reportId=${reportId}`}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          Start Execution
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  // Verification completed but no active quotes
  return (
    <div className="bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 rounded-2xl p-8">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-slate-100">
          <CheckCircle className="w-6 h-6 text-slate-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Verification Complete</h3>
          <p className="text-slate-600">
            No active quotes available. Please contact support to proceed.
          </p>
        </div>
      </div>
    </div>
  );
}
