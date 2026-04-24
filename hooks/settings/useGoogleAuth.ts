import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getGoogleAuthErrorMessage,
  type GoogleAccount,
  isGoogleSignInCancelledError,
  loadStoredAccount,
  signInWithGoogle,
  signOutGoogle,
} from "@/lib/googleAuth";

export function useGoogleAuth() {
  const { i18n } = useTranslation();
  const [account, setAccount] = useState<GoogleAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const language = i18n.resolvedLanguage ?? i18n.language;
  const errorMessage = useMemo(
    () => (error ? getGoogleAuthErrorMessage(error) : null),
    [error, language],
  );

  const refreshAccount = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextAccount = await loadStoredAccount();
      setAccount(nextAccount);
      setError(null);
    } catch (caughtError) {
      setAccount(null);
      setError(caughtError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAccount();
  }, [refreshAccount]);

  const signIn = useCallback(async (): Promise<GoogleAccount | null> => {
    setIsSigningIn(true);
    setError(null);

    try {
      const { account: nextAccount } = await signInWithGoogle();
      setAccount(nextAccount);
      return nextAccount;
    } catch (caughtError) {
      if (isGoogleSignInCancelledError(caughtError)) {
        return null;
      }

      setError(caughtError);
      return null;
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await signOutGoogle();
    setAccount(null);
    setError(null);
  }, []);

  return {
    account,
    error: errorMessage,
    isLoading,
    isSigningIn,
    refreshAccount,
    signIn,
    signOut,
  };
}
