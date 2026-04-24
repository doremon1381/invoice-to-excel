import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

import { getAllInvoicesWithData, getInvoiceById, getLineItems } from '@/lib/db';
import { translate } from "@/lib/i18n";
import { Storage } from '@/lib/storage';
import type { ExportHistoryEntry } from '@/lib/types';

export async function exportAllInvoicesToExcel(): Promise<void> {
  const invoices = await getAllInvoicesWithData();

  const summaryRows = invoices.map((invoice) => ({
    [translate("invoice.invoiceNumber")]: invoice.invoice_number ?? '—',
    [translate("invoice.labelVendor")]: invoice.vendor_name ?? '—',
    [translate("invoice.labelDate")]: invoice.invoice_date ?? '—',
    [translate("financial.subtotal")]: 0,
    [translate("financial.tax")]: 0,
    [translate("financial.discount")]: 0,
    [translate("financial.total")]: invoice.total_amount ?? 0,
    [translate("invoice.currency")]: invoice.currency ?? 'VND',
    [translate("invoice.scannedAt")]: invoice.scanned_at,
  }));

  const worksheet = XLSX.utils.json_to_sheet(summaryRows);
  worksheet['!cols'] = Object.keys(summaryRows[0] ?? { empty: true }).map(() => ({ wch: 20 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    translate("export.sheetAllInvoices"),
  );

  await writeAndShare(workbook, `invoices_export_${dateStamp()}.xlsx`, invoices.length);
}

export async function exportSingleInvoiceToExcel(invoiceId: number): Promise<void> {
  const invoice = await getInvoiceById(invoiceId);
  const items = await getLineItems(invoiceId);

  const headerRows = [
    {
      [translate("export.headerField")]: translate("invoice.invoiceNumber"),
      [translate("export.headerValue")]: invoice.invoice_number ?? '—',
    },
    {
      [translate("export.headerField")]: translate("invoice.labelVendor"),
      [translate("export.headerValue")]: invoice.vendor_name ?? '—',
    },
    {
      [translate("export.headerField")]: translate("invoice.labelVendorAddress"),
      [translate("export.headerValue")]: invoice.vendor_address ?? '—',
    },
    {
      [translate("export.headerField")]: translate("invoice.labelDate"),
      [translate("export.headerValue")]: invoice.invoice_date ?? '—',
    },
    {
      [translate("export.headerField")]: translate("invoice.dueDate"),
      [translate("export.headerValue")]: invoice.due_date ?? '—',
    },
    {
      [translate("export.headerField")]: translate("financial.subtotal"),
      [translate("export.headerValue")]: invoice.subtotal ?? 0,
    },
    {
      [translate("export.headerField")]: translate("financial.tax"),
      [translate("export.headerValue")]: invoice.tax_amount ?? 0,
    },
    {
      [translate("export.headerField")]: translate("financial.discount"),
      [translate("export.headerValue")]: invoice.discount_amount ?? 0,
    },
    {
      [translate("export.headerField")]: translate("financial.total"),
      [translate("export.headerValue")]: invoice.total_amount ?? 0,
    },
    {
      [translate("export.headerField")]: translate("invoice.currency"),
      [translate("export.headerValue")]: invoice.currency ?? 'VND',
    },
    {
      [translate("export.headerField")]: translate("invoice.paymentMethod"),
      [translate("export.headerValue")]: invoice.payment_method ?? '—',
    },
    {
      [translate("export.headerField")]: translate("invoice.notes"),
      [translate("export.headerValue")]: invoice.notes ?? '',
    },
  ];

  const lineRows = items.map((item) => ({
    [translate("invoice.lineItemDescription")]: item.description,
    [translate("invoice.lineItemQuantity")]: item.quantity,
    [translate("invoice.lineItemUnit")]: item.unit,
    [translate("invoice.lineItemUnitPrice")]: item.unit_price,
    [translate("invoice.lineItemTotalPrice")]: item.total_price,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(headerRows),
    translate("export.sheetInvoice"),
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(lineRows),
    translate("export.sheetLineItems"),
  );

  await writeAndShare(workbook, `invoice_${invoice.invoice_number ?? invoiceId}_${dateStamp()}.xlsx`, 1);
}

async function writeAndShare(workbook: XLSX.WorkBook, filename: string, recordCount: number): Promise<void> {
  const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
  const documentDirectory = FileSystem.documentDirectory;

  if (!documentDirectory) {
    throw new Error(translate("export.documentDirectoryUnavailable"));
  }

  const fileUri = `${documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error(translate("export.sharingUnavailable"));
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: translate("export.dialogTitle"),
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
