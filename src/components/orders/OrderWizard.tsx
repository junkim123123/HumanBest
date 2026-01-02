'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { createOrderFromQuote } from '@/server/actions/orders';
import OrderQuotePicker from './OrderQuotePicker';
import OrderSummaryCard from './OrderSummaryCard';

interface OrderWizardProps {
  verificationId: string;
  initialQuotes: any[];
}

type StepType = 1 | 2 | 3 | 4;

const steps = [
  { number: 1, title: 'Pick Quote', description: 'Select a supplier quote' },
  { number: 2, title: 'Confirm Details', description: 'Review quantity and options' },
  { number: 3, title: 'Scope & Fees', description: 'Understand execution details' },
  { number: 4, title: 'Review & Create', description: 'Finalize and create order' },
];

export default function OrderWizard({
  verificationId,
  initialQuotes,
}: OrderWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<StepType>(1);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [destinationCountry, setDestinationCountry] = useState('US');
  const [incoterm, setIncoterm] = useState<'FOB' | 'CIF' | 'DDP'>('FOB');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedQuote = initialQuotes.find(q => q.id === selectedQuoteId);

  const handleNext = () => {
    if (currentStep === 1 && !selectedQuoteId) {
      setError('Please select a quote');
      return;
    }
    if (currentStep === 2 && quantity < (selectedQuote?.moq || 1)) {
      setError(`Quantity must be at least ${selectedQuote?.moq || 1}`);
      return;
    }
    setError(null);
    setCurrentStep((currentStep + 1) as StepType);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((Math.max(1, currentStep - 1) as StepType));
  };

  const handleSubmit = async () => {
    if (!selectedQuoteId) {
      setError('Quote is required');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const result = await createOrderFromQuote(
        selectedQuoteId,
        quantity,
        destinationCountry,
        incoterm
      );
      
      if (result.success && result.orderId) {
        router.push(`/app/orders/${result.orderId}`);
      } else {
        setError(result.error || 'Failed to create order');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-8">
        {/* Stepper */}
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div key={step.number} className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  currentStep >= step.number
                    ? 'bg-electric-blue-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {currentStep > step.number ? '✓' : step.number}
              </div>
              <div className="flex-1">
                <h3
                  className={`font-semibold ${
                    currentStep >= step.number ? 'text-slate-900' : 'text-slate-500'
                  }`}
                >
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">{step.description}</p>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`absolute left-5 top-16 w-0.5 h-12 ${
                    currentStep > step.number ? 'bg-electric-blue-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Select a Quote</h2>
              <p className="text-slate-600 mb-6">Choose one of the quotes from verified suppliers</p>
              <OrderQuotePicker
                quotes={initialQuotes}
                selectedQuoteId={selectedQuoteId}
                onSelectQuote={setSelectedQuoteId}
              />
            </div>
          )}

          {currentStep === 2 && selectedQuote && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Confirm Details</h2>
                <p className="text-slate-600">Review and adjust your order parameters</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Quantity (units)
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(selectedQuote.moq, parseInt(e.target.value) || 1))}
                    min={selectedQuote.moq}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-electric-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Minimum: {selectedQuote.moq} units</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Destination Country
                  </label>
                  <select
                    value={destinationCountry}
                    onChange={(e) => setDestinationCountry(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-electric-blue-500"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="MX">Mexico</option>
                    <option value="GB">United Kingdom</option>
                    <option value="DE">Germany</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Incoterm
                  </label>
                  <select
                    value={incoterm}
                    onChange={(e) => setIncoterm(e.target.value as any)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-electric-blue-500"
                  >
                    <option value="FOB">FOB (Free on Board)</option>
                    <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                    <option value="DDP">DDP (Delivered Duty Paid)</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    FOB: Buyer handles freight | CIF: Seller handles freight | DDP: All-in delivered
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && selectedQuote && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Execution Scope & Fees</h2>
                <p className="text-slate-600">Understand what's included in your order</p>
              </div>

              <div className="space-y-3 bg-electric-blue-50 border border-electric-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 text-sm">NexSupply Execution Service</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>✓ Quote validation and supplier verification</li>
                  <li>✓ Proforma Invoice review and approval</li>
                  <li>✓ Payment coordination and escrow protection</li>
                  <li>✓ Production monitoring and updates</li>
                  <li>✓ Quality inspection and sample review</li>
                  <li>✓ Shipping logistics coordination</li>
                  <li>✓ Customs clearance support</li>
                  <li>✓ Delivery confirmation and support</li>
                </ul>
              </div>

              <div className="bg-slate-50 rounded-lg p-6 space-y-3">
                <h3 className="font-semibold text-slate-900 text-sm">Pricing</h3>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Execution Fee</span>
                  <span className="font-medium text-slate-900">Included</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Escrow Protection</span>
                  <span className="font-medium text-slate-900">Included</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && selectedQuote && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Review & Create Order</h2>
                <p className="text-slate-600">Everything looks good? Create your order now.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 mb-1">Supplier</p>
                    <p className="font-semibold text-slate-900">{selectedQuote.supplier_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Product</p>
                    <p className="font-semibold text-slate-900">{selectedQuote.product_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Quantity</p>
                    <p className="font-semibold text-slate-900">{quantity.toLocaleString()} units</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Unit Price</p>
                    <p className="font-semibold text-slate-900">
                      {selectedQuote.currency} {selectedQuote.unit_price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Destination</p>
                    <p className="font-semibold text-slate-900">{destinationCountry}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Incoterm</p>
                    <p className="font-semibold text-slate-900">{incoterm}</p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-semibold text-slate-900">Total Value</span>
                    <span className="font-bold text-electric-blue-600">
                      {selectedQuote.currency} {(selectedQuote.unit_price * quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>
          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="px-6 py-3 rounded-lg bg-electric-blue-600 text-white font-semibold hover:bg-electric-blue-700 transition-colors flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-8 py-3 rounded-lg bg-electric-blue-600 text-white font-semibold hover:bg-electric-blue-700 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Order'}
            </button>
          )}
        </div>
      </div>

      {/* Sticky Summary */}
      <div>
        <OrderSummaryCard
          selectedQuote={selectedQuote}
          quantity={quantity}
          incoterm={incoterm}
          onQuantityChange={setQuantity}
        />
      </div>
    </div>
  );
}
