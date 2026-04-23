import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import {
  EXPORT_HISTORY_STORAGE_KEY,
  GOOGLE_SHEET_TAB_STORAGE_KEY,
} from "@/lib/constants";
import type { ExportHistoryEntry } from "@/lib/types";

const KEYS = {
  THEME_MODE: "theme_mode",
  APP_LOCALE: "app_locale",
  EXPORT_HISTORY: EXPORT_HISTORY_STORAGE_KEY,
  GOOGLE_SHEET_TAB: GOOGLE_SHEET_TAB_STORAGE_KEY,
} as const;

export type ThemeMode = "light" | "dark";
export type AppLocale = "en" | "vi";

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

export const Storage = {
  async getThemeMode(): Promise<ThemeMode | null> {
    const value = await getItem(KEYS.THEME_MODE);

    if (value === "light" || value === "dark") {
      return value;
    }

    return null;
  },

  async setThemeMode(mode: ThemeMode): Promise<void> {
    await setItem(KEYS.THEME_MODE, mode);
  },

  async getAppLocale(): Promise<AppLocale | null> {
    const value = await getItem(KEYS.APP_LOCALE);

    if (value === "en" || value === "vi") {
      return value;
    }

    return null;
  },

  async setAppLocale(locale: AppLocale): Promise<void> {
    await setItem(KEYS.APP_LOCALE, locale);
  },

  async getExportHistory(): Promise<ExportHistoryEntry[]> {
    const value = await getItem(KEYS.EXPORT_HISTORY);

    if (!value) {
      return [];
    }

    try {
      return JSON.parse(value) as ExportHistoryEntry[];
    } catch {
      return [];
    }
  },

  async addExportHistoryEntry(entry: ExportHistoryEntry): Promise<void> {
    const history = await Storage.getExportHistory();
    const nextHistory = [entry, ...history].slice(0, 20);
    await setItem(
      KEYS.EXPORT_HISTORY,
      JSON.stringify(nextHistory),
    );
  },

  async getGoogleSheetTabName(): Promise<string | null> {
    const value = await getItem(KEYS.GOOGLE_SHEET_TAB);
    return value?.trim() || null;
  },

  async setGoogleSheetTabName(tabName: string): Promise<void> {
    await setItem(KEYS.GOOGLE_SHEET_TAB, tabName.trim());
  },
};
