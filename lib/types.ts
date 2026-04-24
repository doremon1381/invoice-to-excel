export type InvoiceStatus = "pending" | "success" | "error";

export type PaymentMethod = "bank_transfer" | "cash" | null;

export type SheetSyncStatus = "not_synced" | "synced" | "failed";

export interface LineItem {
  id?: number;
  invoice_id?: number;
  description: string;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  total_price: number | null;
}

export interface ExtractedInvoice {
  vendor_name: string | null;
  vendor_address: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  subtotal: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  total_amount: number | null;
  currency: string;
  payer: string | null;
  payment_method: PaymentMethod;
  notes: string | null;
  line_items: LineItem[];
}

export interface InvoiceRow {
  id: number;
  invoiceTitle: string | null;
  image_uri: string;
  image_base64: string | null;
  image_mime: string | null;
  raw_text: string | null;
  scanned_at: string;
  status: InvoiceStatus;
  sheet_sync_status: SheetSyncStatus;
  sheet_synced_at: string | null;
  sheet_last_error: string | null;
}

export interface InvoiceDataRow {
  id: number;
  invoice_id: number;
  vendor_name: string | null;
  vendor_address: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  subtotal: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  total_amount: number | null;
  currency: string;
  payer: string | null;
  payment_method: PaymentMethod;
  notes: string | null;
}

export interface InvoiceListItem extends InvoiceRow {
  vendor_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  total_amount: number | null;
  currency: string;
}

export interface InvoiceDetail extends InvoiceRow, ExtractedInvoice {
  line_items: LineItem[];
}

export interface SaveInvoiceInput {
  invoiceTitle: string | null;
  imageUri: string;
  imageBase64?: string | null;
  imageMime?: string | null;
  rawText: string;
  scannedAt: string;
  status: InvoiceStatus;
  extracted: ExtractedInvoice;
}

export interface ExtractInvoiceResponse {
  extracted: ExtractedInvoice;
  invoiceTitle: string | null;
  rawText: string;
}

export interface ExportHistoryEntry {
  id: string;
  created_at: string;
  file_type: "xlsx";
  record_count: number;
  status: "success" | "error";
}
