import { useCallback, useState } from "react";

import { useGoogleSheetsConfig } from "@/hooks/settings/useGoogleSheetsConfig";
import { appendInvoiceRow, type SheetRowPayload } from "@/lib/googleSheets";

export function usePushInvoiceToSheet() {
  const {
    isLoading: isConfigLoading,
    loadConfig,
    spreadsheetId,
    tabName,
  } = useGoogleSheetsConfig();
  const [isPushing, setIsPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pushRow = useCallback(
    async (row: SheetRowPayload) => {
      if (!spreadsheetId.trim()) {
        throw new Error("Google Spreadsheet ID is not configured.");
      }

      setIsPushing(true);
      setError(null);

      try {
        await appendInvoiceRow(
          {
            spreadsheetId,
            tab: tabName,
          },
          row,
        );
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to push row to Google Sheets.";
        setError(message);
        throw caughtError;
      } finally {
        setIsPushing(false);
      }
    },
    [spreadsheetId, tabName],
  );

  return {
    error,
    isConfigLoading,
    isConfigured: spreadsheetId.trim().length > 0 && tabName.trim().length > 0,
    isPushing,
    loadConfig,
    pushRow,
    spreadsheetId,
    tabName,
  };
}
