// @ts-nocheck
import crypto from "crypto";

/**
 * Generate SHA-256 hash from buffer
 */
export function hashBuffer(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

/**
 * Create stable input key from analysis parameters
 * Used for deduplication and cache lookup
 * Includes all three required images for robust deduplication
 */
export function makeInputKey(params: {
  imageHash: string;
  barcodeHash: string;
  labelHash: string;
  quantity: number;
  dutyRate: number;
  shippingCost: number;
  fee: number;
  destination?: string | null;
  shippingMode?: string | null;
  userId?: string;
  pipelineVersion?: string;
}): string {
  const stable = JSON.stringify({
    imageHash: params.imageHash,
    barcodeHash: params.barcodeHash,
    labelHash: params.labelHash,
    quantity: params.quantity,
    dutyRate: params.dutyRate,
    shippingCost: params.shippingCost,
    fee: params.fee,
    destination: params.destination ?? null,
    shippingMode: params.shippingMode ?? null,
    userId: params.userId ?? null,
    pipelineVersion: params.pipelineVersion ?? null,
  });
  return crypto.createHash("sha256").update(stable).digest("hex");
}

