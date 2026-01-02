// @ts-nocheck
// ============================================================================
// Message Templates
// ============================================================================

import { DEFAULT_REQUESTER_EMAIL, DEFAULT_REQUESTER_WHATSAPP_RAW } from "@/lib/constants/contact";
import { normalizePhone } from "./whatsapp";

export interface QuoteRequestContext {
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

export interface SamplePlanRequestContext {
  productName: string;
  category?: string;
  targetMoq?: number;
  incoterms: "FOB";
  shippingMode?: string;
  materialsAndDimensions?: string | null;
  packagingAndPrinting?: string | null;
  certificationsNeeded?: string[] | null;
  upc?: string | null;
  hasBackLabelPhoto?: boolean;
  requestedSampleQty?: number;
  sampleDeadlineDays?: number;
  destination?: string;
  requesterEmail?: string | null;
  requesterWhatsApp?: string | null;
  supplierType?: "manufacturer" | "trading";
  supplierContactName?: string | null;
  includePackaging?: boolean;
  includeCerts?: boolean;
  includeUpcAndLabel?: boolean;
  noteToSupplier?: string;
}

/**
 * Build quote request message template
 */
export function buildQuoteRequestMessage(context: QuoteRequestContext): string {
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
  } = context;

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
  
  if (supplierType === "trading") {
    message += `5) Do you own the factory or can you introduce the manufacturer?\n`;
  }
  
  if (notes) {
    message += `\nNotes: ${notes}\n`;
  }
  
  // Reply-to block
  const email = requesterEmail || DEFAULT_REQUESTER_EMAIL;
  const whatsapp = requesterWhatsApp || DEFAULT_REQUESTER_WHATSAPP_RAW;
  const whatsappFormatted = normalizePhone(whatsapp);
  
  message += `\nReply to:\n`;
  if (whatsappFormatted) {
    const formatted = whatsappFormatted.length === 11 && whatsappFormatted.startsWith("1")
      ? `+1 ${whatsappFormatted.slice(1, 4)}-${whatsappFormatted.slice(4, 7)}-${whatsappFormatted.slice(7)}`
      : `+${whatsappFormatted}`;
    message += `WhatsApp: ${formatted}\n`;
  }
  message += `Email: ${email}`;

  return message;
}

/**
 * Build sample plan request message template
 */
export function buildSamplePlanRequestMessage(context: SamplePlanRequestContext): string {
  const {
    productName,
    category,
    targetMoq,
    incoterms,
    shippingMode,
    materialsAndDimensions,
    packagingAndPrinting,
    certificationsNeeded,
    upc,
    hasBackLabelPhoto,
    requestedSampleQty = 3,
    sampleDeadlineDays = 7,
    destination = "USA, Missouri",
    requesterEmail,
    requesterWhatsApp,
    supplierType,
    supplierContactName,
  } = context;

  const greeting = supplierContactName
    ? `Hi ${supplierContactName},`
    : "Hi,";

  let message = `${greeting} we need a sample plan for:\n\n`;
  message += `Product: ${productName}\n`;
  
  if (category) {
    message += `Category: ${category}\n`;
  }
  
  if (targetMoq) {
    message += `Target MOQ: ${targetMoq.toLocaleString()}\n`;
  }
  
  message += `Incoterms: ${incoterms}\n`;
  
  if (shippingMode) {
    message += `Shipping: ${shippingMode}\n`;
  }
  
  // Sample request block
  message += `\nSample Request:\n`;
  message += `- Quantity: ${requestedSampleQty} units\n`;
  message += `- Sample deadline: ${sampleDeadlineDays} days\n`;
  message += `- Destination: ${destination}\n`;
  message += `- Please quote: sample cost, sample lead time, shipping method, payment terms\n`;
  
  // Specs block (conditionally include based on toggles)
  const {
    includePackaging = true,
    includeCerts = true,
    includeUpcAndLabel = true,
    noteToSupplier,
  } = context;

  const shouldIncludePackaging = includePackaging && packagingAndPrinting;
  const shouldIncludeCerts = includeCerts && certificationsNeeded && certificationsNeeded.length > 0;
  const shouldIncludeUpcAndLabel = includeUpcAndLabel && (upc || hasBackLabelPhoto !== undefined);
  const shouldIncludeMaterials = includeUpcAndLabel && materialsAndDimensions;
  
  const hasSpecs = shouldIncludeMaterials || shouldIncludePackaging || shouldIncludeCerts || shouldIncludeUpcAndLabel;
  
  if (hasSpecs) {
    message += `\nSpecs:\n`;
    
    if (shouldIncludeMaterials) {
      message += `- Materials/Dimensions: ${materialsAndDimensions}\n`;
    }
    
    if (shouldIncludePackaging) {
      message += `- Packaging/Printing: ${packagingAndPrinting}\n`;
    }
    
    if (shouldIncludeCerts) {
      message += `- Certifications needed: ${certificationsNeeded.join(", ")}\n`;
    }
    
    if (shouldIncludeUpcAndLabel) {
      if (upc) {
        message += `- UPC: ${upc}\n`;
      }
      
      if (hasBackLabelPhoto !== undefined) {
        message += `- Back label photo: ${hasBackLabelPhoto ? "Available" : "Not provided yet"}\n`;
      }
    }
  }
  
  // Ask for information
  message += `\nPlease provide:\n`;
  message += `1) Sample quotation (cost, lead time, shipping, payment)\n`;
  message += `2) Production lead time after sample approval\n`;
  message += `3) QC options and inspection support\n`;
  message += `4) Any required documents for US import\n`;
  
  if (supplierType === "trading") {
    message += `5) Do you own the factory or can you introduce the manufacturer for verification?\n`;
  }
  
  // Note to supplier (if provided)
  if (noteToSupplier && noteToSupplier.trim()) {
    message += `\nNote: ${noteToSupplier.trim()}\n`;
  }
  
  // Reply-to block
  const email = requesterEmail || DEFAULT_REQUESTER_EMAIL;
  const whatsapp = requesterWhatsApp || DEFAULT_REQUESTER_WHATSAPP_RAW;
  const whatsappFormatted = normalizePhone(whatsapp);
  
  message += `\nReply to:\n`;
  if (whatsappFormatted) {
    const formatted = whatsappFormatted.length === 11 && whatsappFormatted.startsWith("1")
      ? `+1 ${whatsappFormatted.slice(1, 4)}-${whatsappFormatted.slice(4, 7)}-${whatsappFormatted.slice(7)}`
      : `+${whatsappFormatted}`;
    message += `WhatsApp: ${formatted}\n`;
  }
  message += `Email: ${email}`;

  return message;
}

