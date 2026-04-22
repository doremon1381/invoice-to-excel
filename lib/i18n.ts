import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en.json";
import vi from "@/locales/vi.json";

import { Storage, type AppLocale } from "@/lib/storage";

void i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export function resolveDeviceLocale(): AppLocale {
  const code = Localization.getLocales()[0]?.languageCode ?? "en";
  return code.toLowerCase().startsWith("vi") ? "vi" : "en";
}

export async function hydrateAppLanguage(): Promise<AppLocale> {
  const stored = await Storage.getAppLocale();
  const resolved = stored ?? resolveDeviceLocale();
  await i18n.changeLanguage(resolved);
  return resolved;
}

export { i18n };
