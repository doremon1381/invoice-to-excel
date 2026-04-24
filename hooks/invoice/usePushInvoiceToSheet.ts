import { useCallback, useEffect, useState } from "react";

import { getInvoiceById, updateInvoiceSheetSyncStatus } from "@/lib/db";
import { translate } from "@/lib/i18n";
import {
  InvoiceAlreadySyncedError,
  syncInvoiceToConfiguredSheet,
} from "@/lib/invoiceSheetSync";
import {
  getSelectedSpreadsheet,
  type SelectedGoogleSpreadsheet,
} from "@/lib/googleSheetSelection";
import type { InvoiceDetail } from "@/lib/types";

export function usePushInvoiceToSheet() {
  const [selectedSpreadsheet, setSelectedSpreadsheet] =
    useState<SelectedGoogleSpreadsheet | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [isPushing, setIsPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setIsConfigLoading(true);
    try {
      setSelectedSpreadsheet(await getSelectedSpreadsheet());
    } finally {
      setIsConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const pushInvoice = useCallback(async (invoice: InvoiceDetail) => {
    if (invoice.sheet_sync_status === "synced") {
      throw new InvoiceAlreadySyncedError();
    }

    const selection = await getSelectedSpreadsheet();
    setSelectedSpreadsheet(selection);
    setIsPushing(true);
    setError(null);

    try {
      await syncInvoiceToConfiguredSheet(invoice);
      await updateInvoiceSheetSyncStatus(invoice.id, {
        status: "synced",
        syncedAt: new Date().toISOString(),
        lastError: null,
      });

      return await getInvoiceById(invoice.id);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : translate("invoice.pushToSheetFailedMessage");

      if (!(caughtError instanceof InvoiceAlreadySyncedError)) {
        await updateInvoiceSheetSyncStatus(invoice.id, {
          status: "failed",
          syncedAt: null,
          lastError: message,
        });
      }

      setError(message);
      throw caughtError;
    } finally {
      setIsPushing(false);
    }
  }, []);

  return {
    error,
    isConfigLoading,
    isConfigured: Boolean(selectedSpreadsheet),
    isPushing,
    loadConfig,
    pushInvoice,
    selectedSpreadsheet,
  };
}
