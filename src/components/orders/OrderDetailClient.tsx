"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, FileText, ExternalLink, MessageCircle, Send } from "lucide-react";
import { getOrderDetail, updateOrderContact } from "@/server/actions/orders";
import { requestInvoice, getOrderInvoice } from "@/server/actions/invoices";
import { sendUserMessage } from "@/server/actions/messages";
import OrderTimeline from "@/components/orders/OrderTimeline";
import OrderDocumentsPanel from "@/components/orders/OrderDocumentsPanel";

interface OrderDetailData {
  id: string;
  order_number: string;
  product_name: string;
  supplier_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: string;
  payment_status: string;
  destination_country: string;
  incoterm: string;
  estimated_delivery?: string;
  created_at: string;
  notes?: string;
  type?: string;
  contact_email?: string | null;
  contact_whatsapp?: string | null;
  report_snapshot_json?: any;
  events?: any[];
  messages?: any[];
  milestones: any[];
  documents: any[];
}

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequestingInvoice, setIsRequestingInvoice] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactWhatsapp, setContactWhatsapp] = useState("");

  useEffect(() => {
    async function loadOrder() {
      try {
        const result = await getOrderDetail(orderId);
        if (result.error) {
          setError(result.error);
        } else {
          setOrder(result.order as OrderDetailData);
          setContactWhatsapp((result.order as any)?.contact_whatsapp || "");

          const invoiceResult = await getOrderInvoice(orderId);
          if (!invoiceResult.error && invoiceResult.invoice) {
            setInvoice(invoiceResult.invoice);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    setIsSending(true);
    const res = await sendUserMessage(orderId, messageInput.trim());
    if (!res.success) {
      setError(res.error || "Failed to send message");
    }
    setMessageInput("");
    const refreshed = await getOrderDetail(orderId);
    if (refreshed.success && refreshed.order) {
      setOrder(refreshed.order as OrderDetailData);
    }
    setIsSending(false);
  };

  const handleSaveContact = async () => {
    setIsSavingContact(true);
    const res = await updateOrderContact(orderId, { contactWhatsapp });
    if (!res.success) {
      setError(res.error || "Failed to save contact");
    }
    const refreshed = await getOrderDetail(orderId);
    if (refreshed.success && refreshed.order) {
      setOrder(refreshed.order as OrderDetailData);
    }
    setIsSavingContact(false);
  };

  const handleRequestInvoice = async () => {
    setIsRequestingInvoice(true);
    setError(null);

    try {
      const result = await requestInvoice(orderId);
      if (result.success) {
        window.location.reload();
      } else {
        setError(result.error || "Failed to request invoice");
      }
    } catch (err: any) {
      setError(err.message || "Failed to request invoice");
    } finally {
      setIsRequestingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-electric-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading order...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/app/orders" className="inline-flex items-center gap-2 text-electric-blue-600 hover:text-electric-blue-700 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to orders
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h2 className="font-bold text-red-900 mb-1">Error Loading Order</h2>
                <p className="text-red-700 text-sm">{error || "Order not found"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/app/orders" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div>
              <p className="text-sm text-slate-500">Order #{order.order_number}</p>
              <h1 className="text-2xl font-bold text-slate-900">{order.product_name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
              {order.status}
            </span>
            {order.type && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                {order.type}
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {order.payment_status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Order Details</h2>
                <p className="text-sm text-slate-500 mt-1">Shipment and product information</p>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-slate-500">Supplier</p>
                  <p className="font-medium text-slate-900">{order.supplier_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">Quantity</p>
                  <p className="font-medium text-slate-900">{(order.quantity ?? 0).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">Unit Price</p>
                  <p className="font-medium text-slate-900">${(order.unit_price ?? 0).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">Total Amount</p>
                  <p className="font-medium text-slate-900">${(order.total_amount ?? 0).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">Destination Country</p>
                  <p className="font-medium text-slate-900">{order.destination_country}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">Incoterm</p>
                  <p className="font-medium text-slate-900">{order.incoterm}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">Created</p>
                  <p className="font-medium text-slate-900">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                {order.estimated_delivery && (
                  <div className="space-y-1">
                    <p className="text-slate-500">Estimated Delivery</p>
                    <p className="font-medium text-slate-900">{new Date(order.estimated_delivery).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Messages</h2>
                  <p className="text-sm text-slate-500 mt-1">Communicate with your concierge team</p>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <MessageCircle className="w-4 h-4" />
                  Real-time updates
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 space-y-3 h-64 overflow-y-auto">
                  {order.messages && order.messages.length > 0 ? (
                    order.messages.map((message: any) => (
                      <div key={message.id} className="bg-white rounded-lg border border-slate-200 p-3">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-900">{message.sender_role === "user" ? "You" : "Concierge"}</span>
                          <span className="text-slate-500">{new Date(message.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700 mt-2 whitespace-pre-wrap">{message.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <MessageCircle className="w-5 h-5 mx-auto mb-3" />
                      <p>No messages yet</p>
                      <p className="text-sm">Start the conversation below</p>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message to your concierge team"
                    className="flex-1 min-h-[80px] rounded-xl border border-slate-200 focus:ring-2 focus:ring-electric-blue-500 focus:border-transparent p-3 text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || !messageInput.trim()}
                    className="inline-flex items-center justify-center h-[80px] px-4 rounded-xl bg-electric-blue-600 hover:bg-electric-blue-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </button>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Payment & Invoices</h2>
                  <p className="text-sm text-slate-500 mt-1">Billing information and actions</p>
                </div>
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Total Amount</p>
                    <p className="text-xl font-bold text-slate-900">${(order.total_amount ?? 0).toLocaleString()}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {order.payment_status}
                  </span>
                </div>

                {invoice ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Invoice Available</p>
                        <p className="text-xs text-slate-500">Issued {new Date(invoice.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-100">
                        {invoice.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href={invoice.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:border-slate-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Invoice
                      </a>
                      <a
                        href={invoice.payment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-electric-blue-600 text-white text-sm font-medium hover:bg-electric-blue-700"
                      >
                        <FileText className="w-4 h-4" />
                        Pay Now
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">No invoice available yet. Request one to proceed with payment.</p>
                    <button
                      onClick={handleRequestInvoice}
                      disabled={isRequestingInvoice}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-electric-blue-600 hover:bg-electric-blue-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRequestingInvoice ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                          Requesting...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          Request Invoice
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Contact Information</h2>
                <p className="text-sm text-slate-500 mt-1">Where we should reach you</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm text-slate-600">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={contactWhatsapp}
                    onChange={(e) => setContactWhatsapp(e.target.value)}
                    placeholder="e.g. +1 415 555 1234"
                    className="mt-1 w-full rounded-xl border border-slate-200 focus:ring-2 focus:ring-electric-blue-500 focus:border-transparent p-3 text-sm"
                  />
                </div>

                <button
                  onClick={handleSaveContact}
                  disabled={isSavingContact}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingContact ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Save Contact
                    </>
                  )}
                </button>
              </div>
            </div>

            <OrderDocumentsPanel documents={order.documents || []} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
              <p className="text-sm text-slate-500 mt-1">Track progress and milestones</p>
            </div>
          </div>
          <div className="p-6">
            <OrderTimeline events={order.events || []} milestones={order.milestones || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
