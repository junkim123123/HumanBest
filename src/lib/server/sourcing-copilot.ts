// @ts-nocheck
"server-only";

import { SupabaseClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface OutreachPack {
  outreach_message: string;
  questions_checklist: string[]; // 6 items
  spec_summary: string[]; // 8 lines
  red_flags: string[]; // 6 items
}

export interface ParsedReply {
  price_per_unit: number | null;
  currency: string | null;
  incoterm: string | null;
  moq: number | null;
  lead_time_days: number | null;
  payment_terms: string | null;
  packaging_notes: string | null;
  missing_fields: string[];
  followup_message: string | null;
}

/**
 * Generate outreach pack for a supplier lead using AI
 * This is a free action that generates content but doesn't send emails
 */
export async function generateOutreachPack(
  supplier: any,
  report: any
): Promise<OutreachPack> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const productName = report.productName || "product";
    const category = report.category || "product category";
    const supplierName = supplier.supplier_name || "supplier";
    const supplierCountry = supplier.country || "unknown";
    const supplierRole = supplier.role || "unknown";
    const shipmentCount = supplier.shipment_count_12m || 0;
    const topHsCodes = supplier.top_hs_codes?.slice(0, 3).join(", ") || "unknown";
    
    const baseline = report.baseline;
    const priceRange = baseline?.costRange?.standard?.unitPrice && baseline?.costRange?.conservative?.unitPrice
      ? `$${baseline.costRange.standard.unitPrice.toFixed(2)} - $${baseline.costRange.conservative.unitPrice.toFixed(2)}`
      : "To be confirmed";
    
    const prompt = `You are a sourcing agent helping a buyer reach out to a supplier. Generate an outreach pack with the following JSON structure:

{
  "outreach_message": "Professional email message (2-3 paragraphs, friendly but direct)",
  "questions_checklist": ["question 1", "question 2", "question 3", "question 4", "question 5", "question 6"],
  "spec_summary": ["line 1", "line 2", "line 3", "line 4", "line 5", "line 6", "line 7", "line 8"],
  "red_flags": ["flag 1", "flag 2", "flag 3", "flag 4", "flag 5", "flag 6"]
}

Product details:
- Product: ${productName}
- Category: ${category}
- Estimated FOB price range: ${priceRange}

Supplier details:
- Name: ${supplierName}
- Country: ${supplierCountry}
- Role type: ${supplierRole}
- Shipments (12m): ${shipmentCount}
- Top HS codes: ${topHsCodes}

Requirements:
1. outreach_message: Professional email asking if they can manufacture or supply the product. Request: unit price at MOQ, MOQ, lead time, packaging specs, material composition, certifications. Keep it concise (2-3 paragraphs).
2. questions_checklist: Exactly 6 questions to verify: manufacturer status, pricing tiers, lead time/capacity, packaging, materials/testing, Incoterms.
3. spec_summary: Exactly 8 lines covering: product name, category, price range, shipping estimate, duty estimate, quantity needed, destination, certifications.
4. red_flags: Exactly 6 potential concerns based on supplier profile (e.g., logistics company risk, unconfirmed manufacturer, no import history, unclear HS alignment, trading company risk, certification verification).

Return ONLY valid JSON, no markdown, no code blocks.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonString = text
      .replace(/```json|```/g, "")
      .replace(/^[\s\n]*\{/, "{")
      .replace(/\}[\s\n]*$/, "}")
      .trim();

    const parsed = JSON.parse(jsonString) as OutreachPack;

    // Validate and ensure correct lengths
    return {
      outreach_message: parsed.outreach_message || generateFallbackMessage(productName, category, supplierName),
      questions_checklist: (() => {
        const safe = Array.isArray(parsed.questions_checklist) ? parsed.questions_checklist : [];
        return safe.slice(0, 6).length === 6 ? safe.slice(0, 6) : generateFallbackQuestions();
      })(),
      spec_summary: (() => {
        const safe = Array.isArray(parsed.spec_summary) ? parsed.spec_summary : [];
        return safe.slice(0, 8).length === 8 ? safe.slice(0, 8) : generateFallbackSpec(productName, category, report);
      })(),
      red_flags: (() => {
        const safe = Array.isArray(parsed.red_flags) ? parsed.red_flags : [];
        return safe.slice(0, 6).length === 6 ? safe.slice(0, 6) : generateFallbackFlags(supplier);
      })(),
    };
  } catch (error) {
    console.error("[SourcingCopilot] AI generation failed, using fallback:", error);
    // Fallback to template-based generation
    return generateFallbackPack(supplier, report);
  }
}

function generateFallbackMessage(productName: string, category: string, supplierName: string): string {
  return `Hello ${supplierName} team,

We are reviewing ${productName} (${category}) and would like to confirm whether you can manufacture this item or a close equivalent.

Could you please share:
1. Unit price range at MOQ
2. MOQ and lead time
3. Packaging specs and carton details
4. Material composition and key specs
5. Certifications and compliance documents available for export
6. Any similar items you currently produce

Thank you for your time.`;
}

function generateFallbackQuestions(): string[] {
  return [
    "Confirm manufacturer status (not a trader or logistics company)",
    "Confirm unit price at MOQ and price break tiers",
    "Confirm lead time and production capacity per month",
    "Confirm packaging details and carton dimensions",
    "Confirm material composition and required testing",
    "Confirm Incoterms and what is included in price"
  ];
}

function generateFallbackSpec(productName: string, category: string, report: any): string[] {
  const baseline = report.baseline;
  return [
    `Product: ${productName}`,
    `Category: ${category}`,
    baseline?.costRange?.standard?.unitPrice ? `Estimated FOB range: $${baseline.costRange.standard.unitPrice.toFixed(2)} - $${baseline.costRange.conservative.unitPrice.toFixed(2)}` : "Price range: To be confirmed",
    baseline?.costRange?.standard?.shippingPerUnit ? `Estimated shipping: $${baseline.costRange.standard.shippingPerUnit.toFixed(2)} per unit` : "Shipping: To be confirmed",
    baseline?.costRange?.standard?.dutyPerUnit ? `Estimated duty: $${baseline.costRange.standard.dutyPerUnit.toFixed(2)} per unit` : "Duty: To be confirmed",
    `Quantity needed: ${report.quantity || "TBD"}`,
    `Destination: ${report.destination || "TBD"}`,
    `Certifications required: ${category} category standards`
  ];
}

function generateFallbackFlags(supplier: any): string[] {
  const flags = [
    supplier.role === "logistics" ? "May be logistics company, not manufacturer" : null,
    !supplier.shipment_count_12m ? "No import history found in our dataset" : null,
    supplier.role === "unknown" ? "Manufacturer status not confirmed" : null,
    !supplier.top_hs_codes || supplier.top_hs_codes.length === 0 ? "HS code alignment unclear" : null,
    supplier.role_reason?.includes("trading") ? "May be trading company, not direct manufacturer" : null,
    "Verify certifications match your destination country requirements"
  ].filter(Boolean) as string[];
  
  // Ensure exactly 6 items
  while (flags.length < 6) {
    flags.push("Standard due diligence recommended");
  }
  return flags.slice(0, 6);
}

function generateFallbackPack(supplier: any, report: any): OutreachPack {
  const productName = report.productName || "product";
  const category = report.category || "product category";
  const supplierName = supplier.supplier_name || "supplier";

  return {
    outreach_message: generateFallbackMessage(productName, category, supplierName),
    questions_checklist: generateFallbackQuestions(),
    spec_summary: generateFallbackSpec(productName, category, report),
    red_flags: generateFallbackFlags(supplier),
  };
}

/**
 * Parse supplier reply into structured quote data using AI
 */
export async function parseSupplierReply(
  messageBody: string,
  supplier: any,
  report: any
): Promise<ParsedReply> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const productName = report.productName || "product";
    const category = report.category || "product category";
    const supplierName = supplier.supplier_name || "supplier";

    const prompt = `You are parsing a supplier's email reply to extract quote information. Extract the following fields from the message and return as JSON:

{
  "price_per_unit": number or null,
  "currency": "USD" | "CNY" | "EUR" | etc. or null,
  "incoterm": "FOB" | "CIF" | "EXW" | "DDP" | "DDU" | null,
  "moq": number (minimum order quantity) or null,
  "lead_time_days": number or null,
  "payment_terms": string or null,
  "packaging_notes": string or null,
  "missing_fields": ["field1", "field2", ...] (list of fields that were NOT mentioned),
  "followup_message": string or null (suggested followup message if fields are missing, otherwise null)
}

Supplier reply message:
${messageBody.substring(0, 2000)}

Product context:
- Product: ${productName}
- Category: ${category}
- Supplier: ${supplierName}

Extraction rules:
1. Extract price_per_unit as a number (remove currency symbols, commas)
2. Extract currency code if mentioned (USD, CNY, EUR, etc.)
3. Extract incoterm if mentioned (FOB, CIF, EXW, DDP, DDU)
4. Extract moq as an integer (minimum order quantity)
5. Extract lead_time_days as an integer (convert weeks/months to days if needed: 1 week = 7 days, 1 month = 30 days)
6. Extract payment_terms as a string (e.g., "30% deposit, 70% before shipment")
7. Extract packaging_notes as a string (any packaging information)
8. List all missing fields in missing_fields array (from: price_per_unit, currency, incoterm, moq, lead_time_days, payment_terms, packaging_notes)
9. If missing_fields.length > 0, generate a friendly followup_message asking for clarification. Otherwise set to null.

Return ONLY valid JSON, no markdown, no code blocks.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonString = text
      .replace(/```json|```/g, "")
      .replace(/^[\s\n]*\{/, "{")
      .replace(/\}[\s\n]*$/, "}")
      .trim();

    const parsed = JSON.parse(jsonString) as ParsedReply;

    // Validate and normalize
    return {
      price_per_unit: parsed.price_per_unit !== null && !isNaN(parsed.price_per_unit) ? Number(parsed.price_per_unit) : null,
      currency: parsed.currency || null,
      incoterm: parsed.incoterm || null,
      moq: parsed.moq !== null && !isNaN(parsed.moq) ? Number(parsed.moq) : null,
      lead_time_days: parsed.lead_time_days !== null && !isNaN(parsed.lead_time_days) ? Number(parsed.lead_time_days) : null,
      payment_terms: parsed.payment_terms || null,
      packaging_notes: parsed.packaging_notes || null,
      missing_fields: Array.isArray(parsed.missing_fields) ? parsed.missing_fields : [],
      followup_message: parsed.followup_message || null,
    };
  } catch (error) {
    console.error("[SourcingCopilot] AI parsing failed, using fallback:", error);
    // Fallback to regex-based parsing
    return parseFallbackReply(messageBody);
  }
}

function parseFallbackReply(messageBody: string): ParsedReply {
  // Extract basic patterns
  const priceMatch = messageBody.match(/(?:price|cost|unit|per\s+unit)[\s:]*\$?[\s]*([\d,]+\.?\d*)/i);
  const moqMatch = messageBody.match(/(?:moq|minimum\s+order)[\s:]*([\d,]+)/i);
  const leadTimeMatch = messageBody.match(/(?:lead\s+time|delivery)[\s:]*([\d]+)\s*(?:days?|weeks?|months?)/i);
  
  const missing_fields: string[] = [];
  if (!priceMatch) missing_fields.push("price_per_unit");
  if (!moqMatch) missing_fields.push("moq");
  if (!leadTimeMatch) missing_fields.push("lead_time_days");
  
  const followup_message = missing_fields.length > 0
    ? `Thank you for your response. Could you please clarify: ${missing_fields.join(", ")}?`
    : null;

  return {
    price_per_unit: priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) : null,
    currency: priceMatch ? "USD" : null,
    incoterm: messageBody.match(/\b(FOB|CIF|EXW|DDP|DDU)\b/i)?.[1]?.toUpperCase() || null,
    moq: moqMatch ? parseInt(moqMatch[1].replace(/,/g, "")) : null,
    lead_time_days: leadTimeMatch ? parseInt(leadTimeMatch[1]) : null,
    payment_terms: messageBody.match(/(?:payment|terms)[\s:]*([^.\n]+)/i)?.[1]?.trim() || null,
    packaging_notes: messageBody.match(/(?:packaging|carton)[\s:]*([^.\n]+)/i)?.[1]?.trim() || null,
    missing_fields,
    followup_message
  };
}

/**
 * Create a sourcing job (paid service)
 */
export async function createSourcingJob(
  admin: SupabaseClient,
  reportId: string,
  userId: string,
  supplierIds: string[]
): Promise<string> {
  // Create sourcing job
  const { data: job, error: jobError } = await admin
    .from("sourcing_jobs")
    .insert({
      report_id: reportId,
      user_id: userId,
      status: "pending"
    })
    .select("id")
    .single();

  if (jobError || !job) {
    throw new Error(`Failed to create sourcing job: ${jobError?.message}`);
  }

  // Fetch supplier names
  const { data: suppliers } = await admin
    .from("product_supplier_matches")
    .select("supplier_id, supplier_name")
    .eq("report_id", reportId)
    .in("supplier_id", supplierIds);

  // Create job suppliers
  const jobSuppliers = (suppliers || []).map((s: any) => ({
    sourcing_job_id: job.id,
    supplier_id: s.supplier_id,
    supplier_name: s.supplier_name,
    status: "not_started"
  }));

  if (jobSuppliers.length > 0) {
    const { error: suppliersError } = await admin
      .from("sourcing_job_suppliers")
      .insert(jobSuppliers);

    if (suppliersError) {
      throw new Error(`Failed to create job suppliers: ${suppliersError.message}`);
    }
  }

  return job.id;
}

