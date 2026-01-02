// @ts-nocheck
// ============================================================================
// Email Messaging Utilities
// ============================================================================

/**
 * Build email subject from product name
 */
export function buildEmailSubject(productName: string): string {
  return `Inquiry: ${productName}`;
}

/**
 * Build email body from message content (reuse WhatsApp message with minor formatting)
 */
export function buildEmailBody(message: string): string {
  // Convert WhatsApp message to email-friendly format
  // Replace line breaks with HTML line breaks or keep as plain text
  return message.replace(/\n/g, "\n");
}

/**
 * Build mailto URL with email, subject, and body
 */
export function buildMailtoUrl(email: string, subject: string, body: string): string {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
}

/**
 * Open email draft - opens supplier email if available, else requester email
 */
export function openEmailDraft({
  supplierEmail,
  requesterEmail,
  subject,
  body,
}: {
  supplierEmail?: string | null;
  requesterEmail: string;
  subject: string;
  body: string;
}): void {
  const emailToUse = supplierEmail || requesterEmail;
  const url = buildMailtoUrl(emailToUse, subject, body);
  window.location.href = url;
}

/**
 * Build mailto URL for template - same fallback logic
 */
export function buildMailtoUrlForTemplate({
  supplierEmail,
  requesterEmail,
  subject,
  body,
}: {
  supplierEmail?: string | null;
  requesterEmail: string;
  subject: string;
  body: string;
}): string {
  const emailToUse = supplierEmail || requesterEmail;
  return buildMailtoUrl(emailToUse, subject, body);
}

