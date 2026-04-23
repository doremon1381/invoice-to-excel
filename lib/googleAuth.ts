import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import {
  GOOGLE_AUTH_TOKENS_STORAGE_KEY,
  GOOGLE_CLIENT_IDS,
} from "@/lib/constants";

type StoredGoogleAuthTokens = {
  accessToken: string;
  email: string | null;
  expiresAt: number;
  refreshToken: string | null;
};

export type GoogleAccount = {
  accessToken: string;
  email: string | null;
};

export class GoogleAuthRequiredError extends Error {
  constructor(message = "Google authorization is required.") {
    super(message);
    this.name = "GoogleAuthRequiredError";
  }
}

export const GOOGLE_DISCOVERY = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  userInfoEndpoint: "https://openidconnect.googleapis.com/v1/userinfo",
} as const;

export function getGoogleClientId(): string {
  if (Platform.OS === "ios") {
    return GOOGLE_CLIENT_IDS.ios;
  }

  if (Platform.OS === "android") {
    return GOOGLE_CLIENT_IDS.android;
  }

  return GOOGLE_CLIENT_IDS.web;
}

async function readStoredTokens(): Promise<StoredGoogleAuthTokens | null> {
  const rawValue = await SecureStore.getItemAsync(GOOGLE_AUTH_TOKENS_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredGoogleAuthTokens>;
    if (
      typeof parsed.accessToken !== "string" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      email:
        typeof parsed.email === "string" && parsed.email.length > 0
          ? parsed.email
          : null,
      expiresAt: parsed.expiresAt,
      refreshToken:
        typeof parsed.refreshToken === "string" && parsed.refreshToken.length > 0
          ? parsed.refreshToken
          : null,
    };
  } catch {
    return null;
  }
}

async function writeStoredTokens(tokens: StoredGoogleAuthTokens): Promise<void> {
  await SecureStore.setItemAsync(
    GOOGLE_AUTH_TOKENS_STORAGE_KEY,
    JSON.stringify(tokens),
  );
}

export async function clearGoogleAuthTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(GOOGLE_AUTH_TOKENS_STORAGE_KEY);
}

function isTokenFresh(tokens: StoredGoogleAuthTokens): boolean {
  return tokens.expiresAt > Date.now() + 60_000;
}

async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(GOOGLE_DISCOVERY.userInfoEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { email?: unknown };
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export async function loadStoredAccount(): Promise<GoogleAccount | null> {
  const tokens = await readStoredTokens();
  if (!tokens) {
    return null;
  }

  return {
    accessToken: tokens.accessToken,
    email: tokens.email,
  };
}

function resolveExpiresAt(expiresIn: number | undefined): number {
  const expiresInMs = (expiresIn ?? 3600) * 1000;
  return Date.now() + expiresInMs;
}

export async function persistTokensFromCodeExchange(input: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<GoogleAccount> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error("Google OAuth client ID is not configured.");
  }

  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code: input.code,
      extraParams: {
        code_verifier: input.codeVerifier,
      },
      redirectUri: input.redirectUri,
    },
    GOOGLE_DISCOVERY,
  );

  const email = await fetchGoogleEmail(tokenResponse.accessToken);
  const tokens: StoredGoogleAuthTokens = {
    accessToken: tokenResponse.accessToken,
    email,
    expiresAt: resolveExpiresAt(tokenResponse.expiresIn),
    refreshToken: tokenResponse.refreshToken ?? null,
  };

  await writeStoredTokens(tokens);
  return { accessToken: tokens.accessToken, email: tokens.email };
}

export async function getValidAccessToken(forceRefresh = false): Promise<string | null> {
  const stored = await readStoredTokens();

  if (!stored) {
    return null;
  }

  if (!forceRefresh && isTokenFresh(stored)) {
    return stored.accessToken;
  }

  if (!stored.refreshToken) {
    await clearGoogleAuthTokens();
    return null;
  }

  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error("Google OAuth client ID is not configured.");
  }

  try {
    const refreshed = await AuthSession.refreshAsync(
      {
        clientId,
        refreshToken: stored.refreshToken,
      },
      GOOGLE_DISCOVERY,
    );

    const nextTokens: StoredGoogleAuthTokens = {
      accessToken: refreshed.accessToken,
      email: stored.email,
      expiresAt: resolveExpiresAt(refreshed.expiresIn),
      refreshToken: refreshed.refreshToken ?? stored.refreshToken,
    };

    await writeStoredTokens(nextTokens);
    return nextTokens.accessToken;
  } catch {
    await clearGoogleAuthTokens();
    return null;
  }
}

export async function signOutGoogle(): Promise<void> {
  const stored = await readStoredTokens();

  if (!stored) {
    return;
  }

  try {
    await AuthSession.revokeAsync(
      {
        clientId: getGoogleClientId(),
        token: stored.accessToken,
      },
      GOOGLE_DISCOVERY,
    );
  } catch {
    // Best-effort revoke. Local token cleanup is what guarantees sign-out in app.
  } finally {
    await clearGoogleAuthTokens();
  }
}
