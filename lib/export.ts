import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

import { getAllInvoicesWithData, getInvoiceById, getLineItems } from '@/lib/db';
import { Storage } from '@/lib/storage';
import type { ExportHistoryEntry } from '@/lib/types';

export async function exportAllInvoicesToExcel(): Promise<void> {
  const invoices = await getAllInvoicesWithData();

  const summaryRows = invoices.map((invoice) => ({
    'Invoice No.': invoice.invoice_number ?? '—',
    Vendor: invoice.vendor_name ?? '—',
    'Invoice Date': invoice.invoice_date ?? '—',
    Subtotal: 0,
    Tax: 0,
    Discount: 0,
    Total: invoice.total_amount ?? 0,
    Currency: invoice.currency ?? 'VND',
    'Scanned At': invoice.scanned_at,
  }));

  const worksheet = XLSX.utils.json_to_sheet(summaryRows);
  worksheet['!cols'] = Object.keys(summaryRows[0] ?? { empty: true }).map(() => ({ wch: 20 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');

  await writeAndShare(workbook, `invoices_export_${dateStamp()}.xlsx`, invoices.length);
}

export async function exportSingleInvoiceToExcel(invoiceId: number): Promise<void> {
  const invoice = await getInvoiceById(invoiceId);
  const items = await getLineItems(invoiceId);

  const headerRows = [
    { Field: 'Invoice No.', Value: invoice.invoice_number ?? '—' },
    { Field: 'Vendor', Value: invoice.vendor_name ?? '—' },
    { Field: 'Vendor Address', Value: invoice.vendor_address ?? '—' },
    { Field: 'Invoice Date', Value: invoice.invoice_date ?? '—' },
    { Field: 'Due Date', Value: invoice.due_date ?? '—' },
    { Field: 'Subtotal', Value: invoice.subtotal ?? 0 },
    { Field: 'Tax', Value: invoice.tax_amount ?? 0 },
    { Field: 'Discount', Value: invoice.discount_amount ?? 0 },
    { Field: 'Total', Value: invoice.total_amount ?? 0 },
    { Field: 'Currency', Value: invoice.currency ?? 'VND' },
    { Field: 'Payment Method', Value: invoice.payment_method ?? '—' },
    { Field: 'Notes', Value: invoice.notes ?? '' },
  ];

  const lineRows = items.map((item) => ({
    Description: item.description,
    Quantity: item.quantity,
    Unit: item.unit,
    'Unit Price': item.unit_price,
    'Total Price': item.total_price,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(headerRows), 'Invoice');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(lineRows), 'Line Items');

  await writeAndShare(workbook, `invoice_${invoice.invoice_number ?? invoiceId}_${dateStamp()}.xlsx`, 1);
}

async function writeAndShare(workbook: XLSX.WorkBook, filename: string, recordCount: number): Promise<void> {
  const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
  const documentDirectory = FileSystem.documentDirectory;

  if (!documentDirectory) {
    throw new Error('Document directory is not available on this device.');
  }

  const fileUri = `${documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: 'Export Invoice',
    UTI: 'com.microsoft.excel.xlsx',
  });

  const historyEntry: ExportHistoryEntry = {
    id: `${filename}-${Date.now()}`,
    created_at: new Date().toISOString(),
    file_type: 'xlsx',
    record_count: recordCount,
    status: 'success',
  };

  await Storage.addExportHistoryEntry(historyEntry);
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
