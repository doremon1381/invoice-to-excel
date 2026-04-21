import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import { OPENAI_API_KEY_STORAGE_KEY } from '@/lib/constants';

export function useStoredApiKey() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadApiKey = useCallback(async () => {
    setIsLoading(true);

    try {
      const storedValue = await SecureStore.getItemAsync(OPENAI_API_KEY_STORAGE_KEY);
      setApiKey(storedValue ?? '');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveApiKey = useCallback(async (value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      await SecureStore.deleteItemAsync(OPENAI_API_KEY_STORAGE_KEY);
      setApiKey('');
      return;
    }

    await SecureStore.setItemAsync(OPENAI_API_KEY_STORAGE_KEY, trimmedValue);
    setApiKey(trimmedValue);
  }, []);

  useEffect(() => {
    void loadApiKey();
  }, [loadApiKey]);

  return {
    apiKey,
    hasStoredKey: apiKey.trim().length > 0,
    isLoading,
    loadApiKey,
    saveApiKey,
  };
}
