import * as SecureStore from 'expo-secure-store';

import { EXPORT_HISTORY_STORAGE_KEY, OCR_SERVER_URL_STORAGE_KEY } from '@/lib/constants';
import type { ExportHistoryEntry } from '@/lib/types';

const KEYS = {
  OCR_SERVER_URL: OCR_SERVER_URL_STORAGE_KEY,
  THEME_MODE: 'theme_mode',
  EXPORT_HISTORY: EXPORT_HISTORY_STORAGE_KEY,
} as const;

export type ThemeMode = 'light' | 'dark';

export const Storage = {
  async getOCRServerUrl(): Promise<string> {
    const value = await SecureStore.getItemAsync(KEYS.OCR_SERVER_URL);
    return value?.trim() ?? '';
  },

  async setOCRServerUrl(url: string): Promise<void> {
    const normalized = url.trim().replace(/\/$/, '');

    if (!normalized) {
      await SecureStore.deleteItemAsync(KEYS.OCR_SERVER_URL);
      return;
    }

    await SecureStore.setItemAsync(KEYS.OCR_SERVER_URL, normalized);
  },

  async getThemeMode(): Promise<ThemeMode | null> {
    const value = await SecureStore.getItemAsync(KEYS.THEME_MODE);

    if (value === 'light' || value === 'dark') {
      return value;
    }

    return null;
  },

  async setThemeMode(mode: ThemeMode): Promise<void> {
    await SecureStore.setItemAsync(KEYS.THEME_MODE, mode);
  },

  async getExportHistory(): Promise<ExportHistoryEntry[]> {
    const value = await SecureStore.getItemAsync(KEYS.EXPORT_HISTORY);

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
    await SecureStore.setItemAsync(KEYS.EXPORT_HISTORY, JSON.stringify(nextHistory));
  },
};
