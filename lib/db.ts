import * as SQLite from "expo-sqlite";

import { DEFAULT_CURRENCY } from "@/lib/constants";
import type {
  ExtractedInvoice,
  InvoiceDetail,
  InvoiceListItem,
  InvoiceRow,
  InvoiceStatus,
  LineItem,
  SaveInvoiceInput,
} from "@/lib/types";

import { Platform } from "react-native";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initializedPromise: Promise<void> | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (Platform.OS === "web") {
    return null;
  }

  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync("invoices.db").catch((error) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}

async function runSchemaMigrations(
  database: SQLite.SQLiteDatabase,
): Promise<void> {
  await database.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_name TEXT,
      image_uri TEXT NOT NULL,
      image_base64 TEXT,
      image_mime TEXT,
      raw_text TEXT,
      scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS invoice_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      vendor_name TEXT,
      vendor_address TEXT,
      invoice_number TEXT,
      invoice_date TEXT,
      due_date TEXT,
      subtotal REAL,
      tax_amount REAL,
      discount_amount REAL,
      total_amount REAL,
      currency TEXT DEFAULT 'VND',
      payer TEXT,
      payment_method TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS line_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      description TEXT,
      quantity REAL,
      unit_price REAL,
      unit TEXT,
      total_price REAL
    );
  `);

  const versionRow = await database.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version;",
  );
  const userVersion = versionRow?.user_version ?? 0;

  if (userVersion < 1) {
    const tableInfo = await database.getAllAsync<
      Record<string, SQLite.SQLiteBindValue>
    >("PRAGMA table_info(invoices);");
    const invoiceColumns = new Set(
      tableInfo.map((column) => String(column.name)),
    );

    if (!invoiceColumns.has("image_base64")) {
      await database.execAsync(
        "ALTER TABLE invoices ADD COLUMN image_base64 TEXT;",
      );
    }

    if (!invoiceColumns.has("image_mime")) {
      await database.execAsync("ALTER TABLE invoices ADD COLUMN image_mime TEXT;");
    }

    await database.execAsync("PRAGMA user_version = 1;");
  }

  if (userVersion < 2) {
    const tableInfo = await database.getAllAsync<
      Record<string, SQLite.SQLiteBindValue>
    >("PRAGMA table_info(invoice_data);");
    const invoiceDataColumns = new Set(
      tableInfo.map((column) => String(column.name)),
    );

    if (!invoiceDataColumns.has("payer")) {
      await database.execAsync("ALTER TABLE invoice_data ADD COLUMN payer TEXT;");
    }

    await database.execAsync("PRAGMA user_version = 2;");
  }

  if (userVersion < 3) {
    const tableInfo = await database.getAllAsync<
      Record<string, SQLite.SQLiteBindValue>
    >("PRAGMA table_info(invoices);");
    const invoiceColumns = new Set(
      tableInfo.map((column) => String(column.name)),
    );

    if (!invoiceColumns.has("invoice_name")) {
      await database.execAsync(
        "ALTER TABLE invoices ADD COLUMN invoice_name TEXT;",
      );
    }

    await database.execAsync("PRAGMA user_version = 3;");
  }
}

async function getReadyDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  const database = await getDatabase();

  if (!database) {
    return null;
  }

  if (!initializedPromise) {
    initializedPromise = runSchemaMigrations(database).catch((error) => {
      initializedPromise = null;
      throw error;
    });
  }

  await initializedPromise;
  return database;
}

function mapInvoiceListItem(
  row: Record<string, SQLite.SQLiteBindValue>,
): InvoiceListItem {
  return {
    id: Number(row.id),
    invoice_name: row.invoice_name ? String(row.invoice_name) : null,
    image_uri: String(row.image_uri),
    raw_text: row.raw_text ? String(row.raw_text) : null,
    scanned_at: String(row.scanned_at),
    status: String(row.status) as InvoiceListItem["status"],
    image_base64: null,
    image_mime: null,
    vendor_name: row.vendor_name ? String(row.vendor_name) : null,
    invoice_number: row.invoice_number ? String(row.invoice_number) : null,
    invoice_date: row.invoice_date ? String(row.invoice_date) : null,
    total_amount:
      typeof row.total_amount === "number"
        ? row.total_amount
        : row.total_amount
          ? Number(row.total_amount)
          : null,
    currency: row.currency ? String(row.currency) : DEFAULT_CURRENCY,
  };
}

function mapLineItem(row: Record<string, SQLite.SQLiteBindValue>): LineItem {
  return {
    id: Number(row.id),
    invoice_id: Number(row.invoice_id),
    description: row.description ? String(row.description) : "",
    quantity:
      typeof row.quantity === "number"
        ? row.quantity
        : row.quantity
          ? Number(row.quantity)
          : null,
    unit: row.unit ? String(row.unit) : null,
    unit_price:
      typeof row.unit_price === "number"
        ? row.unit_price
        : row.unit_price
          ? Number(row.unit_price)
          : null,
    total_price:
      typeof row.total_price === "number"
        ? row.total_price
        : row.total_price
          ? Number(row.total_price)
          : null,
  };
}

export async function initializeDatabase(): Promise<void> {
  await getReadyDatabase();
}

export async function saveInvoice(input: SaveInvoiceInput): Promise<number> {
  const database = await getReadyDatabase();

  if (!database) {
    throw new Error("SQLite is not available on this platform.");
  }

  const createdInvoice = await database.runAsync(
    "INSERT INTO invoices (invoice_name, image_uri, image_base64, image_mime, raw_text, status) VALUES (?, ?, ?, ?, ?, ?)",
    [
      input.invoiceName,
      input.imageUri,
      input.imageBase64 ?? null,
      input.imageMime ?? null,
      input.rawText,
      input.status,
    ],
  );

  const invoiceId = Number(createdInvoice?.lastInsertRowId);
  const extracted = input.extracted;

  await database.runAsync(
    `INSERT INTO invoice_data (
      invoice_id,
      vendor_name,
      vendor_address,
      invoice_number,
      invoice_date,
      due_date,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      currency,
      payer,
      payment_method,
      notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      invoiceId,
      extracted.vendor_name,
      extracted.vendor_address,
      extracted.invoice_number,
      extracted.invoice_date,
      extracted.due_date,
      extracted.subtotal,
      extracted.tax_amount,
      extracted.discount_amount,
      extracted.total_amount,
      extracted.currency,
      extracted.payer,
      extracted.payment_method,
      extracted.notes,
    ],
  );

  for (const item of extracted.line_items) {
    await database.runAsync(
      "INSERT INTO line_items (invoice_id, description, quantity, unit_price, unit, total_price) VALUES (?, ?, ?, ?, ?, ?)",
      [
        invoiceId,
        item.description,
        item.quantity,
        item.unit_price,
        item.unit,
        item.total_price,
      ],
    );
  }

  return invoiceId;
}

export async function updateInvoice(
  invoiceId: number,
  patch: {
    invoiceName?: string | null;
    extracted: ExtractedInvoice;
    rawText?: string | null;
    status?: InvoiceStatus;
  },
): Promise<void> {
  const database = await getReadyDatabase();

  if (!database) {
    return;
  }

  if (patch.rawText !== undefined) {
    await database.runAsync("UPDATE invoices SET raw_text = ? WHERE id = ?", [
      patch.rawText,
      invoiceId,
    ]);
  }

  if (patch.status !== undefined) {
    await database.runAsync("UPDATE invoices SET status = ? WHERE id = ?", [
      patch.status,
      invoiceId,
    ]);
  }

  if (patch.invoiceName !== undefined) {
    await database.runAsync(
      "UPDATE invoices SET invoice_name = ? WHERE id = ?",
      [patch.invoiceName, invoiceId],
    );
  }

  const extracted = patch.extracted;

  await database.runAsync(
    `UPDATE invoice_data SET
      vendor_name = ?,
      vendor_address = ?,
      invoice_number = ?,
      invoice_date = ?,
      due_date = ?,
      subtotal = ?,
      tax_amount = ?,
      discount_amount = ?,
      total_amount = ?,
      currency = ?,
      payer = ?,
      payment_method = ?,
      notes = ?
    WHERE invoice_id = ?`,
    [
      extracted.vendor_name,
      extracted.vendor_address,
      extracted.invoice_number,
      extracted.invoice_date,
      extracted.due_date,
      extracted.subtotal,
      extracted.tax_amount,
      extracted.discount_amount,
      extracted.total_amount,
      extracted.currency,
      extracted.payer,
      extracted.payment_method,
      extracted.notes,
      invoiceId,
    ],
  );
}

export async function getAllInvoicesWithData(): Promise<InvoiceListItem[]> {
  const database = await getReadyDatabase();

  if (!database) {
    return [];
  }

  const rows = await database.getAllAsync<
    Record<string, SQLite.SQLiteBindValue>
  >(`
    SELECT
      invoices.id,
      invoices.invoice_name,
      invoices.image_uri,
      invoices.raw_text,
      invoices.scanned_at,
      invoices.status,
      invoice_data.vendor_name,
      invoice_data.invoice_number,
      invoice_data.invoice_date,
      invoice_data.total_amount,
      invoice_data.currency
    FROM invoices
    LEFT JOIN invoice_data ON invoice_data.invoice_id = invoices.id
    ORDER BY invoices.scanned_at DESC
  `);

  return rows?.map(mapInvoiceListItem) ?? [];
}

export async function getInvoiceById(
  invoiceId: number,
): Promise<InvoiceDetail> {
  const database = await getReadyDatabase();

  if (!database) {
    throw new Error("SQLite is not available on this platform.");
  }

  const row = await database.getFirstAsync<
    Record<string, SQLite.SQLiteBindValue>
  >(
    `SELECT
      invoices.id,
      invoices.invoice_name,
      invoices.image_uri,
      invoices.image_base64,
      invoices.image_mime,
      invoices.raw_text,
      invoices.scanned_at,
      invoices.status,
      invoice_data.vendor_name,
      invoice_data.vendor_address,
      invoice_data.invoice_number,
      invoice_data.invoice_date,
      invoice_data.due_date,
      invoice_data.subtotal,
      invoice_data.tax_amount,
      invoice_data.discount_amount,
      invoice_data.total_amount,
      invoice_data.currency,
      invoice_data.payer,
      invoice_data.payment_method,
      invoice_data.notes
    FROM invoices
    LEFT JOIN invoice_data ON invoice_data.invoice_id = invoices.id
    WHERE invoices.id = ?
    LIMIT 1`,
    [invoiceId],
  );

  if (!row) {
    throw new Error("Invoice not found.");
  }

  const lineItems = await getLineItems(invoiceId);

  return {
    id: Number(row.id),
    invoice_name: row.invoice_name ? String(row.invoice_name) : null,
    image_uri: String(row.image_uri),
    image_base64: row.image_base64 ? String(row.image_base64) : null,
    image_mime: row.image_mime ? String(row.image_mime) : null,
    raw_text: row.raw_text ? String(row.raw_text) : null,
    scanned_at: String(row.scanned_at),
    status: String(row.status) as InvoiceRow["status"],
    vendor_name: row.vendor_name ? String(row.vendor_name) : null,
    vendor_address: row.vendor_address ? String(row.vendor_address) : null,
    invoice_number: row.invoice_number ? String(row.invoice_number) : null,
    invoice_date: row.invoice_date ? String(row.invoice_date) : null,
    due_date: row.due_date ? String(row.due_date) : null,
    subtotal:
      typeof row.subtotal === "number"
        ? row.subtotal
        : row.subtotal
          ? Number(row.subtotal)
          : null,
    tax_amount:
      typeof row.tax_amount === "number"
        ? row.tax_amount
        : row.tax_amount
          ? Number(row.tax_amount)
          : null,
    discount_amount:
      typeof row.discount_amount === "number"
        ? row.discount_amount
        : row.discount_amount
          ? Number(row.discount_amount)
          : null,
    total_amount:
      typeof row.total_amount === "number"
        ? row.total_amount
        : row.total_amount
          ? Number(row.total_amount)
          : null,
    currency: row.currency ? String(row.currency) : DEFAULT_CURRENCY,
    payer: row.payer ? String(row.payer) : null,
    payment_method: row.payment_method ? String(row.payment_method) : null,
    notes: row.notes ? String(row.notes) : null,
    line_items: lineItems,
  };
}

export async function getLineItems(invoiceId: number): Promise<LineItem[]> {
  const database = await getReadyDatabase();

  if (!database) {
    return [];
  }

  const rows = await database.getAllAsync<
    Record<string, SQLite.SQLiteBindValue>
  >(
    "SELECT id, invoice_id, description, quantity, unit_price, unit, total_price FROM line_items WHERE invoice_id = ? ORDER BY id ASC",
    [invoiceId],
  );

  return rows?.map(mapLineItem) ?? [];
}

export async function deleteInvoice(invoiceId: number): Promise<void> {
  const database = await getReadyDatabase();

  if (!database) {
    return;
  }

  await database.runAsync("DELETE FROM invoices WHERE id = ?", [invoiceId]);
}

export async function deleteNonFinalInvoices(): Promise<number> {
  const database = await getReadyDatabase();

  if (!database) {
    return 0;
  }

  const result = await database.runAsync(
    "DELETE FROM invoices WHERE status NOT IN (?, ?)",
    ["success", "error"],
  );

  return result.changes ?? 0;
}

export async function getInvoiceCount(): Promise<number> {
  const database = await getReadyDatabase();

  if (!database) {
    return 0;
  }

  const result = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM invoices",
  );
  return result?.count ?? 0;
}

export function createPendingInvoice(imageUri: string): ExtractedInvoice {
  return {
    vendor_name: null,
    vendor_address: null,
    invoice_number: null,
    invoice_date: null,
    due_date: null,
    subtotal: null,
    tax_amount: null,
    discount_amount: null,
    total_amount: null,
    currency: DEFAULT_CURRENCY,
    payer: null,
    payment_method: null,
    notes: null,
    line_items: [],
  };
}
