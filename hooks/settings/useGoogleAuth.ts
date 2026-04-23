import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import {
  GOOGLE_CLIENT_IDS,
  GOOGLE_OAUTH_SCOPES,
  GOOGLE_REDIRECT_SCHEME,
} from "@/lib/constants";
import {
  type GoogleAccount,
  GOOGLE_DISCOVERY,
  loadStoredAccount,
  persistTokensFromCodeExchange,
  signOutGoogle,
} from "@/lib/googleAuth";

void WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [account, setAccount] = useState<GoogleAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientId = useMemo(() => {
    if (Platform.OS === "ios") {
      return GOOGLE_CLIENT_IDS.ios;
    }

    if (Platform.OS === "android") {
      return GOOGLE_CLIENT_IDS.android;
    }

    return GOOGLE_CLIENT_IDS.web;
  }, []);

  const redirectUri = useMemo(
    () =>
      AuthSession.makeRedirectUri({
        path: "oauth",
        scheme: GOOGLE_REDIRECT_SCHEME,
      }),
    [],
  );

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      extraParams: {
        access_type: "offline",
        prompt: "consent",
      },
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      scopes: [...GOOGLE_OAUTH_SCOPES],
    },
    GOOGLE_DISCOVERY,
  );

  const refreshAccount = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextAccount = await loadStoredAccount();
      setAccount(nextAccount);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAccount();
  }, [refreshAccount]);

  useEffect(() => {
    if (response?.type !== "success") {
      if (response?.type === "error") {
        setError(response.error?.message ?? "Google sign-in failed.");
      }
      return;
    }

    const code = response.params.code;
    const codeVerifier = request?.codeVerifier;

    if (!code || !codeVerifier) {
      setError("Google sign-in did not return a valid authorization code.");
      return;
    }

    void (async () => {
      try {
        const nextAccount = await persistTokensFromCodeExchange({
          code,
          codeVerifier,
          redirectUri,
        });
        setAccount(nextAccount);
        setError(null);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Google sign-in failed.",
        );
      } finally {
        setIsSigningIn(false);
      }
    })();
  }, [redirectUri, request?.codeVerifier, response]);

  const signIn = useCallback(async () => {
    if (!clientId) {
      setError("Google OAuth client ID is missing.");
      return;
    }

    if (!request) {
      setError("Google sign-in is still initializing.");
      return;
    }

    setIsSigningIn(true);
    setError(null);

    const promptResult = await promptAsync();

    if (promptResult.type !== "success") {
      setIsSigningIn(false);
      if (promptResult.type !== "cancel" && promptResult.type !== "dismiss") {
        setError("Google sign-in was not completed.");
      }
    }
  }, [clientId, promptAsync, request]);

  const signOut = useCallback(async () => {
    await signOutGoogle();
    setAccount(null);
    setError(null);
  }, []);

  return {
    account,
    error,
    isLoading,
    isSigningIn,
    refreshAccount,
    signIn,
    signOut,
  };
}
