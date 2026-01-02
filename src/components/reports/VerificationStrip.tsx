'use client';

import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface VerificationStripProps {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  quotesCount: number;
}

export default function VerificationStrip({ status, quotesCount }: VerificationStripProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      label: 'Pending',
    },
    in_progress: {
      icon: Clock,
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      label: 'In Progress',
    },
    completed: {
      icon: CheckCircle,
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      label: 'Completed',
    },
    failed: {
      icon: AlertCircle,
      color: 'bg-red-100 text-red-700 border-red-200',
      label: 'Failed',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${config.color}`}>
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <div>
          <p className="font-semibold text-sm">Verification Status: {config.label}</p>
          {status === 'completed' && quotesCount > 0 && (
            <p className="text-xs mt-0.5 opacity-80">
              {quotesCount} {quotesCount === 1 ? 'quote' : 'quotes'} received
            </p>
          )}
        </div>
      </div>
      
      {status === 'in_progress' && (
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
}
