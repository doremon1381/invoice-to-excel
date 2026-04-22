export type InvoiceStatus = 'pending' | 'success' | 'error';

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
  payment_method: string | null;
  notes: string | null;
  line_items: LineItem[];
}

export interface InvoiceRow {
  id: number;
  image_uri: string;
  image_base64: string | null;
  image_mime: string | null;
  raw_text: string | null;
  scanned_at: string;
  status: InvoiceStatus;
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
  payment_method: string | null;
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
  imageUri: string;
  imageBase64?: string | null;
  imageMime?: string | null;
  rawText: string;
  status: InvoiceStatus;
  extracted: ExtractedInvoice;
}

export interface ExportHistoryEntry {
  id: string;
  created_at: string;
  file_type: 'xlsx';
  record_count: number;
  status: 'success' | 'error';
}
