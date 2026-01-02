"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, MessageCircle, Send, Clock, Mail, Phone } from "lucide-react";
import { getOrderDetail, sendOrderMessage, updateOrderContact } from "@/server/actions/orders";
import OrderTimeline from "@/components/orders/OrderTimeline";

interface OrderDetailData {
  id: string;
  order_number: string;
  product_name: string;
  supplier_name: string;
  quantity: number | null;
  unit_price: number | null;
  total_amount: number | null;
  status: string;
  destination_country: string;
  created_at: string;
  messages?: MessageRecord[];
  contact_email?: string | null;
  contact_whatsapp?: string | null;
  milestones?: any[];
}

interface MessageRecord {
  id: string;
  order_id: string;
  sender_id?: string | null;
  sender_role?: string | null;
  body?: string | null;
  created_at?: string | null;
}

const statusConfig: Record<string, { bg: string; text: string }> = {
  awaiting_contact: { bg: "bg-amber-50", text: "text-amber-700" },
  contacted: { bg: "bg-blue-50", text: "text-blue-700" },
  meeting_scheduled: { bg: "bg-blue-50", text: "text-blue-700" },
  closed: { bg: "bg-slate-100", text: "text-slate-600" },
  awaiting_invoice: { bg: "bg-amber-50", text: "text-amber-700" },
  awaiting_payment: { bg: "bg-amber-50", text: "text-amber-700" },
  in_progress: { bg: "bg-blue-50", text: "text-blue-700" },
  pending_shipment: { bg: "bg-amber-50", text: "text-amber-700" },
  shipped: { bg: "bg-blue-50", text: "text-blue-700" },
  delivered: { bg: "bg-emerald-50", text: "text-emerald-700" },
  cancelled: { bg: "bg-red-50", text: "text-red-700" },
};

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  useEffect(() => {
    async function loadOrder() {
      try {
        const result = await getOrderDetail(orderId);
        if (result.error) {
          setError(result.error);
        } else if (result.order) {
          setOrder(result.order as OrderDetailData);
          setMessages((result.order as any)?.messages || []);
          setMilestones(result.milestones || []);
          setContactEmail((result.order as any)?.contact_email || "");
          setContactPhone((result.order as any)?.contact_whatsapp || "");
          if ((result.order as any)?.contact_email || (result.order as any)?.contact_whatsapp) {
            setContactSaved(true);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    }
    void loadOrder();
  }, [orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSaveContact = async () => {
    if (!contactEmail.trim() && !contactPhone.trim()) return;
    setIsSavingContact(true);
    try {
      const res = await updateOrderContact(orderId, {
        contactEmail: contactEmail.trim() || undefined,
        contactWhatsapp: contactPhone.trim() || undefined,
      });
      if (res.success) {
        setContactSaved(true);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleSendMessage = async () => {
    const body = messageInput.trim();
    if (!body) return;
    setIsSending(true);
    setError(null);
    try {
      const res = await sendOrderMessage(orderId, body, "user");
      if (!res.success) {
        setError(res.detail || res.error || "Failed to send message");
        return;
      }
      const appended = res.message
        ? res.message
        : {
            id: res.messageId || `local-${Date.now()}`,
            order_id: orderId,
            sender_id: null,
            sender_role: "user",
            body,
            created_at: new Date().toISOString(),
          };
      setMessages((prev) => [...prev, appended]);
      setMessageInput("");
    } catch (err: any) {
      setError(err.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const formattedMessages = useMemo(() => {
    return (messages || []).map((m) => {
      const senderRole = m.sender_role || "user";
      const isUser = senderRole === "user";
      const label = isUser ? "You" : "NexSupply";
      const body = (m.body || "").trim() || "Empty message";
      const timestamp = m.created_at ? new Date(m.created_at).toLocaleString() : "";
      return { ...m, senderRole, isUser, label, body, timestamp };
    });
  }, [messages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[14px] text-slate-500">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/app/orders" className="inline-flex items-center gap-2 text-[14px] text-slate-600 hover:text-slate-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to orders
          </Link>
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="flex gap-4">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <h2 className="font-semibold text-red-900 mb-1">Error loading order</h2>
                <p className="text-[14px] text-red-700">{error || "Order not found"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status] || { bg: "bg-slate-100", text: "text-slate-600" };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 bg-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl py-6">
          <Link href="/app/orders" className="inline-flex items-center gap-1 text-[14px] text-slate-500 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[13px] text-slate-400">Order #{order.order_number}</p>
              <h1 className="text-[22px] font-bold text-slate-900 mt-1">{order.product_name}</h1>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${status.bg} ${status.text}`}>
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-3xl py-8 space-y-6">
        {/* Manager Contact Notice */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-[15px] font-semibold text-slate-900">A dedicated manager will contact you within 12 hours</h3>
              <p className="text-[13px] text-slate-600 mt-1">
                Leave your contact info below to get notified, or send a message with any questions.
              </p>
              
              {!contactSaved ? (
                <div className="mt-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="Email (optional)"
                        className="w-full h-10 pl-10 pr-3 rounded-lg border border-slate-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <div className="flex-1 relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="Phone / WhatsApp (optional)"
                        className="w-full h-10 pl-10 pr-3 rounded-lg border border-slate-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSaveContact}
                    disabled={isSavingContact || (!contactEmail.trim() && !contactPhone.trim())}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-[13px] font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    {isSavingContact ? "Saving..." : "Save contact info"}
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-[13px] text-emerald-700 font-medium">
                  Contact info saved. We will reach out soon.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-[16px] font-semibold text-slate-900 mb-4">Order Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wide">Supplier</p>
              <p className="text-[14px] text-slate-900 mt-0.5">{order.supplier_name || "TBD"}</p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wide">Quantity</p>
              <p className="text-[14px] text-slate-900 mt-0.5">{order.quantity ? `${order.quantity} units` : "TBD"}</p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wide">Total</p>
              <p className="text-[14px] text-slate-900 mt-0.5">
                {order.total_amount ? `$${order.total_amount.toLocaleString()}` : "TBD"}
              </p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wide">Created</p>
              <p className="text-[14px] text-slate-900 mt-0.5">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Execution Timeline */}
        <OrderTimeline milestones={milestones} />

        {/* Messages */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-semibold text-slate-900">Messages</h2>
              <p className="text-[13px] text-slate-500 mt-0.5">Ask questions or share details before we call</p>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
              <MessageCircle className="w-4 h-4" />
              Real-time
            </div>
          </div>

          <div className="p-5">
            <div className="bg-slate-50 rounded-lg p-4 space-y-3 h-64 overflow-y-auto mb-4">
              {formattedMessages.length > 0 ? (
                formattedMessages.map((message) => (
                  <div key={message.id || message.created_at} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                      message.isUser
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-900 border border-slate-200"
                    }`}>
                      <div className="flex items-center justify-between gap-3 mb-1 text-[11px] uppercase tracking-wide font-medium">
                        <span className={message.isUser ? "text-white/70" : "text-slate-400"}>{message.label}</span>
                        <span className={message.isUser ? "text-white/50" : "text-slate-300"}>{message.timestamp}</span>
                      </div>
                      <p className="text-[14px] whitespace-pre-wrap leading-relaxed">{message.body}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <MessageCircle className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-[14px]">No messages yet</p>
                  <p className="text-[13px]">Share any questions or preferences</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex items-end gap-3">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="e.g. I prefer Korean-speaking manager, need samples first..."
                rows={2}
                className="flex-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 p-3 text-[14px] resize-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={isSending || !messageInput.trim()}
                className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
