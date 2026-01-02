// @ts-nocheck
// ============================================================================
// WhatsApp Messaging Utilities
// ============================================================================

import { DEFAULT_REQUESTER_EMAIL, DEFAULT_REQUESTER_WHATSAPP_RAW } from "@/lib/constants/contact";

export interface WhatsAppMessageParams {
  productName: string;
  category?: string;
  targetMoq: number;
  incoterms: "FOB";
  shippingMode?: string;
  requestedSpecs?: {
    material?: string;
    dimensions?: string;
    packaging?: string;
    printing?: string;
    certifications?: string[];
  };
  notes?: string;
  supplierType?: "manufacturer" | "trading";
  supplierContactName?: string | null;
  requesterEmail?: string | null;
  requesterWhatsApp?: string | null;
}

/**
 * Normalize phone number to E.164 format (digits only, no plus)
 * - Strip non-digits
 * - If length is 10, assume US and prefix "1"
 * - If already length is 11 and starts with "1", keep
 * - Return digits only
 * - Return null if too short (<8) or too long (>15)
 */
export function normalizePhone(phone: string): string | null {
  // Strip non-digits
  const digitsOnly = phone.replace(/\D/g, "");
  
  // Too short or too long
  if (digitsOnly.length < 8 || digitsOnly.length > 15) {
    return null;
  }
  
  // If 10 digits, assume US and prefix "1"
  if (digitsOnly.length === 10) {
    return `1${digitsOnly}`;
  }
  
  // If 11 digits and starts with "1", keep as is
  if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    return digitsOnly;
  }
  
  // Otherwise return as is (for international numbers)
  return digitsOnly;
}

/**
 * Build WhatsApp message template from report and quote context
 * Always includes requester reply contact info at the end
 */
export function buildWhatsAppMessage(params: WhatsAppMessageParams): string {
  const {
    productName,
    category,
    targetMoq,
    incoterms,
    shippingMode,
    requestedSpecs,
    notes,
    supplierType,
    supplierContactName,
    requesterEmail,
    requesterWhatsApp,
  } = params;

  const greeting = supplierContactName
    ? `Hi ${supplierContactName},`
    : "Hi,";

  let message = `${greeting} we're sourcing:\n\n`;
  message += `Product: ${productName}\n`;
  
  if (category) {
    message += `Category: ${category}\n`;
  }
  
  message += `Target MOQ: ${targetMoq.toLocaleString()}\n`;
  message += `Incoterms: ${incoterms}\n`;
  
  if (shippingMode) {
    message += `Shipping: ${shippingMode}\n`;
  }
  
  message += `\nPlease confirm:\n`;
  message += `1) Unit price at MOQ and price breaks\n`;
  message += `2) Lead time + sample availability\n`;
  message += `3) Certifications and labeling requirements\n`;
  
  if (requestedSpecs) {
    const specs: string[] = [];
    if (requestedSpecs.material) specs.push(`Material: ${requestedSpecs.material}`);
    if (requestedSpecs.dimensions) specs.push(`Dimensions: ${requestedSpecs.dimensions}`);
    if (requestedSpecs.packaging) specs.push(`Packaging: ${requestedSpecs.packaging}`);
    if (requestedSpecs.printing) specs.push(`Printing: ${requestedSpecs.printing}`);
    if (requestedSpecs.certifications && requestedSpecs.certifications.length > 0) {
      specs.push(`Certifications: ${requestedSpecs.certifications.join(", ")}`);
    }
    
    if (specs.length > 0) {
      message += `4) ${specs.join(" | ")}\n`;
    } else {
      message += `4) Packaging/printing options\n`;
    }
  } else {
    message += `4) Packaging/printing options\n`;
  }
  
  // Ask about manufacturer vs trading if supplierType is trading
  if (supplierType === "trading") {
    message += `5) Do you own the factory or can you introduce the manufacturer?\n`;
  }
  
  if (notes) {
    message += `\nNotes: ${notes}\n`;
  }
  
  // Always include requester reply contact info
  const email = requesterEmail || DEFAULT_REQUESTER_EMAIL;
  const whatsapp = requesterWhatsApp || DEFAULT_REQUESTER_WHATSAPP_RAW;
  const whatsappFormatted = normalizePhone(whatsapp);
  
  message += `\nReply to:\n`;
  if (whatsappFormatted) {
    // Format as +1 314-657-7892 for display
    const formatted = whatsappFormatted.length === 11 && whatsappFormatted.startsWith("1")
      ? `+1 ${whatsappFormatted.slice(1, 4)}-${whatsappFormatted.slice(4, 7)}-${whatsappFormatted.slice(7)}`
      : `+${whatsappFormatted}`;
    message += `WhatsApp: ${formatted}\n`;
  }
  message += `Email: ${email}`;

  return message;
}

/**
 * Build WhatsApp URL with phone and message
 */
export function buildWhatsAppUrl(phoneDigits: string, message: string): string {
  const normalized = normalizePhone(phoneDigits);
  if (!normalized) {
    throw new Error("Invalid phone number");
  }
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encodedMessage}`;
}

/**
 * Open WhatsApp draft - opens supplier chat if available, else requester self chat
 */
export function openWhatsAppDraft({
  supplierPhoneDigits,
  requesterPhoneDigits,
  message,
}: {
  supplierPhoneDigits?: string | null;
  requesterPhoneDigits?: string | null;
  message: string;
}): void {
  const phoneToUse = supplierPhoneDigits || requesterPhoneDigits || DEFAULT_REQUESTER_WHATSAPP_RAW;
  const url = buildWhatsAppUrl(phoneToUse, message);
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Open WhatsApp draft for template - same fallback logic
 */
export function openWhatsAppDraftForTemplate({
  supplierPhoneDigits,
  requesterPhoneDigits,
  message,
}: {
  supplierPhoneDigits?: string | null;
  requesterPhoneDigits?: string | null;
  message: string;
}): void {
  openWhatsAppDraft({ supplierPhoneDigits, requesterPhoneDigits, message });
}

