import { getGoogleAccessToken } from "@/lib/googleAuth";
import { translate } from "@/lib/i18n";
import { syncInvoiceSummaryToSpreadsheet } from "@/lib/googleSheets";
import { getSelectedSpreadsheet } from "@/lib/googleSheetSelection";
import type { InvoiceDetail } from "@/lib/types";

export class GoogleSheetConfigRequiredError extends Error {
  constructor(message = translate("invoice.pushToSheetConfigRequiredMessage")) {
    super(message);
    this.name = "GoogleSheetConfigRequiredError";
  }
}

export class InvoiceAlreadySyncedError extends Error {
  constructor(message = translate("invoice.alreadySyncedMessage")) {
    super(message);
    this.name = "InvoiceAlreadySyncedError";
  }
}

export async function syncInvoiceToConfiguredSheet(
  invoice: InvoiceDetail,
): Promise<void> {
  if (invoice.sheet_sync_status === "synced") {
    throw new InvoiceAlreadySyncedError();
  }

  const selection = await getSelectedSpreadsheet();

  if (!selection) {
    throw new GoogleSheetConfigRequiredError();
  }

  const accessToken = await getGoogleAccessToken();
  await syncInvoiceSummaryToSpreadsheet(
    accessToken,
    selection.spreadsheetId,
    invoice,
  );
}
