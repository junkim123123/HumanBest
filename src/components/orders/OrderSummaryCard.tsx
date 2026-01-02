import { ShoppingCart, ChevronRight } from 'lucide-react';

interface OrderSummaryCardProps {
  selectedQuote: any;
  quantity: number;
  incoterm: string;
  onQuantityChange: (qty: number) => void;
}

export default function OrderSummaryCard({
  selectedQuote,
  quantity,
  incoterm,
  onQuantityChange,
}: OrderSummaryCardProps) {
  if (!selectedQuote) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6 h-fit">
        <p className="text-slate-500 text-sm">Select a quote to see summary</p>
      </div>
    );
  }

  const subtotal = selectedQuote.unit_price * quantity;
  const executionFee = 0;
  const total = subtotal + executionFee;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6 h-fit space-y-6">
      {/* Header */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-2">Order Summary</h3>
        <p className="text-sm text-slate-600">{selectedQuote.supplier_name}</p>
      </div>

      {/* Quote Details */}
      <div className="space-y-3 border-t border-b border-slate-100 py-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Product</span>
          <span className="text-sm font-medium text-slate-900">{selectedQuote.product_name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Unit Price</span>
          <span className="text-sm font-medium text-slate-900">
            {selectedQuote.currency} {selectedQuote.unit_price.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Lead Time</span>
          <span className="text-sm font-medium text-slate-900">{selectedQuote.lead_time_days} days</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Incoterm</span>
          <span className="text-sm font-medium text-slate-900">{incoterm}</span>
        </div>
      </div>

      {/* Quantity Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-900">Quantity</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => onQuantityChange(Math.max(selectedQuote.moq, parseInt(e.target.value) || 1))}
          min={selectedQuote.moq}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-slate-500">Minimum: {selectedQuote.moq} units</p>
      </div>

      {/* Pricing Breakdown */}
      <div className="space-y-2 bg-slate-50 rounded-lg p-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Subtotal</span>
          <span className="font-medium text-slate-900">
            {selectedQuote.currency} {subtotal.toFixed(2)}
          </span>
        </div>
        {executionFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Execution Fee</span>
            <span className="font-medium text-slate-900">
              {selectedQuote.currency} {executionFee.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-2">
          <span className="text-slate-900">Total</span>
          <span className="text-electric-blue-600">
            {selectedQuote.currency} {total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-slate-500 space-y-1">
        <p>• Payment: Not required until PI issued</p>
        <p>• Estimated delivery in {selectedQuote.lead_time_days + 14} days</p>
        <p>• Free escrow protection included</p>
      </div>
    </div>
  );
}
