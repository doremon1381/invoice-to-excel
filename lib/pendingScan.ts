import type { ExtractedInvoice, InvoiceStatus } from "@/lib/types";

export interface PendingScanPayload {
  invoiceName: string | null;
  extracted: ExtractedInvoice;
  rawText: string;
  status: InvoiceStatus;
  imageUri: string;
  imageBase64: string | null;
  imageMime: string | null;
}

let pendingScan: PendingScanPayload | null = null;

export function setPendingScan(payload: PendingScanPayload): void {
  pendingScan = payload;
}

export function getPendingScan(): PendingScanPayload | null {
  return pendingScan;
}

export function clearPendingScan(): void {
  pendingScan = null;
}
