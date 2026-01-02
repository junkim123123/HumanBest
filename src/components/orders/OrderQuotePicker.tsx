import { CheckCircle2, Clock } from 'lucide-react';

interface OrderQuotePickerProps {
  quotes: any[];
  selectedQuoteId: string | null;
  onSelectQuote: (quoteId: string) => void;
}

export default function OrderQuotePicker({
  quotes,
  selectedQuoteId,
  onSelectQuote,
}: OrderQuotePickerProps) {
  if (quotes.length === 0) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
        <p className="text-slate-600 mb-2">No quotes available</p>
        <p className="text-sm text-slate-500">Complete verification to receive quotes from suppliers</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quotes.map((quote, idx) => (
        <button
          key={quote.id}
          onClick={() => onSelectQuote(quote.id)}
          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
            selectedQuoteId === quote.id
              ? 'border-electric-blue-600 bg-electric-blue-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-slate-900">Quote {idx + 1}</span>
                {selectedQuoteId === quote.id && (
                  <CheckCircle2 className="w-4 h-4 text-electric-blue-600" />
                )}
              </div>
              <p className="text-sm font-semibold text-slate-900">{quote.supplier_name}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-electric-blue-600">
                {quote.currency} {quote.unit_price.toFixed(2)}/unit
              </p>
              <p className="text-xs text-slate-500">{quote.product_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-1">Lead Time</p>
              <p className="font-medium text-slate-900 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {quote.lead_time_days}d
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">MOQ</p>
              <p className="font-medium text-slate-900">{quote.moq} units</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Incoterm</p>
              <p className="font-medium text-slate-900">{quote.incoterm}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
