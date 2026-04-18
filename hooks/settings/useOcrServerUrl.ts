import { useCallback, useEffect, useState } from 'react';

import { Storage } from '@/lib/storage';

export function useOcrServerUrl() {
  const [serverUrl, setServerUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadServerUrl = useCallback(async () => {
    setIsLoading(true);

    try {
      const storedUrl = await Storage.getOCRServerUrl();
      setServerUrl(storedUrl);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveServerUrl = useCallback(async (value: string) => {
    await Storage.setOCRServerUrl(value);
    setServerUrl(value.trim().replace(/\/$/, ''));
  }, []);

  useEffect(() => {
    void loadServerUrl();
  }, [loadServerUrl]);

  return {
    isLoading,
    loadServerUrl,
    saveServerUrl,
    serverUrl,
  };
}
