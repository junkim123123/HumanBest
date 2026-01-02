'use client';

import { Package, Clock, MapPin, CheckCircle } from 'lucide-react';

interface QuoteCardsProps {
  quotes: any[];
}

export default function QuoteCards({ quotes }: QuoteCardsProps) {
  const activeQuotes = quotes.filter(q => {
    if (!q.expiration_at) return q.status === 'accepted';
    return new Date(q.expiration_at) > new Date() && q.status === 'accepted';
  });

  if (activeQuotes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900">Verified Quotes ({activeQuotes.length})</h3>
      <div className="grid gap-4">
        {activeQuotes.map((quote, index) => {
          const isExpiringSoon = quote.expiration_at && 
            new Date(quote.expiration_at).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
          
          return (
            <div 
              key={quote.id}
              className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-electric-blue-300 hover:shadow-md transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-900">{quote.supplier_name}</h4>
                    {quote.verified_at && (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    )}
                    {index === 0 && (
                      <span className="px-2 py-0.5 bg-electric-blue-100 text-electric-blue-700 text-xs font-bold rounded-full">
                        BEST PRICE
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{quote.product_name}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-electric-blue-600">
                    ${quote.unit_price.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500">per unit</div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-3 gap-4 py-4 border-t border-slate-100">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                    <Package className="w-3.5 h-3.5" />
                    <span>MOQ</span>
                  </div>
                  <p className="font-semibold text-slate-900">{quote.moq.toLocaleString()} units</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Lead Time</span>
                  </div>
                  <p className="font-semibold text-slate-900">{quote.lead_time_days} days</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Terms</span>
                  </div>
                  <p className="font-semibold text-slate-900">{quote.incoterm}</p>
                </div>
              </div>

              {/* Origin */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Origin: <span className="font-semibold text-slate-700">{quote.origin_country || 'China'}</span>
                </p>
              </div>

              {/* Expiring Soon Warning */}
              {isExpiringSoon && (
                <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  ⚠️ Quote expires {new Date(quote.expiration_at).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
