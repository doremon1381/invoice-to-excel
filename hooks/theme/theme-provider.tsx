import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { Storage, type ThemeMode } from '@/lib/storage';

type ThemeContextValue = {
  colorScheme: ThemeMode;
  isLoaded: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadThemeMode() {
      const storedMode = await Storage.getThemeMode();

      if (!isMounted) {
        return;
      }

      setThemeModeState(storedMode ?? (systemColorScheme === 'dark' ? 'dark' : 'light'));
      setIsLoaded(true);
    }

    void loadThemeMode();

    return () => {
      isMounted = false;
    };
  }, [systemColorScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme: themeMode,
      isLoaded,
      setThemeMode: async (mode: ThemeMode) => {
        setThemeModeState(mode);
        await Storage.setThemeMode(mode);
      },
    }),
    [isLoaded, themeMode],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useAppTheme() {
  const value = use(ThemeContext);

  if (!value) {
    throw new Error('useAppTheme must be used within AppThemeProvider.');
  }

  return value;
}
