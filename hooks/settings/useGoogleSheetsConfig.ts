import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_GOOGLE_SHEET_TAB,
  GOOGLE_SPREADSHEET_ID_STORAGE_KEY,
} from "@/lib/constants";
import { Storage } from "@/lib/storage";

export type GoogleSheetsConfig = {
  spreadsheetId: string;
  tabName: string;
};

export function useGoogleSheetsConfig() {
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [tabName, setTabName] = useState(DEFAULT_GOOGLE_SHEET_TAB);
  const [isLoading, setIsLoading] = useState(true);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const [storedSpreadsheetId, storedTabName] = await Promise.all([
        SecureStore.getItemAsync(GOOGLE_SPREADSHEET_ID_STORAGE_KEY),
        Storage.getGoogleSheetTabName(),
      ]);

      // TODO: debug log. Remove this later.
      console.log("storedSpreadsheetId", storedSpreadsheetId);
      console.log("storedTabName", storedTabName);

      setSpreadsheetId(storedSpreadsheetId ?? "");
      setTabName(storedTabName ?? DEFAULT_GOOGLE_SHEET_TAB);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSpreadsheetId = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      await SecureStore.deleteItemAsync(GOOGLE_SPREADSHEET_ID_STORAGE_KEY);
      setSpreadsheetId("");
      return;
    }

    await SecureStore.setItemAsync(GOOGLE_SPREADSHEET_ID_STORAGE_KEY, trimmed);
    // TODO: debug log. Remove this later.
    console.log("savedSpreadsheetId", trimmed);
    setSpreadsheetId(trimmed);
  }, []);

  const saveTabName = useCallback(async (value: string) => {
    const trimmed = value.trim();
    const resolved = trimmed || DEFAULT_GOOGLE_SHEET_TAB;
    await Storage.setGoogleSheetTabName(resolved);
    setTabName(resolved);
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  return {
    isLoading,
    loadConfig,
    saveSpreadsheetId,
    saveTabName,
    spreadsheetId,
    tabName,
  };
}
