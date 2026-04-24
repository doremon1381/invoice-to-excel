import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { GOOGLE_SELECTED_SPREADSHEET_STORAGE_KEY } from "@/lib/constants";

export type SelectedGoogleSpreadsheet = {
  selectedAt: string;
  spreadsheetId: string;
  spreadsheetName: string;
};

function canUseWebStorage(): boolean {
  return Platform.OS === "web" && typeof window !== "undefined";
}

async function getItem(key: string): Promise<string | null> {
  if (canUseWebStorage()) {
    return window.localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (canUseWebStorage()) {
    window.localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (canUseWebStorage()) {
    window.localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

function parseSelection(value: string | null): SelectedGoogleSpreadsheet | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<SelectedGoogleSpreadsheet>;
    if (
      typeof parsed.spreadsheetId !== "string" ||
      typeof parsed.spreadsheetName !== "string" ||
      typeof parsed.selectedAt !== "string"
    ) {
      return null;
    }

    return {
      selectedAt: parsed.selectedAt,
      spreadsheetId: parsed.spreadsheetId,
      spreadsheetName: parsed.spreadsheetName,
    };
  } catch {
    return null;
  }
}

export async function saveSelectedSpreadsheet(input: {
  spreadsheetId: string;
  spreadsheetName: string;
  selectedAt?: string;
}): Promise<SelectedGoogleSpreadsheet> {
  const selection: SelectedGoogleSpreadsheet = {
    selectedAt: input.selectedAt ?? new Date().toISOString(),
    spreadsheetId: input.spreadsheetId,
    spreadsheetName: input.spreadsheetName,
  };

  await setItem(
    GOOGLE_SELECTED_SPREADSHEET_STORAGE_KEY,
    JSON.stringify(selection),
  );

  return selection;
}

export async function getSelectedSpreadsheet(): Promise<SelectedGoogleSpreadsheet | null> {
  return parseSelection(
    await getItem(GOOGLE_SELECTED_SPREADSHEET_STORAGE_KEY),
  );
}

export async function clearSelectedSpreadsheet(): Promise<void> {
  await deleteItem(GOOGLE_SELECTED_SPREADSHEET_STORAGE_KEY);
}
