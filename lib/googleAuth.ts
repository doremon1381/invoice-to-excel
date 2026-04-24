import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
  type User,
} from "@react-native-google-signin/google-signin";
import { Platform } from "react-native";

import {
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_OAUTH_SCOPES,
  GOOGLE_WEB_CLIENT_ID,
} from "@/lib/constants";
import { translate } from "@/lib/i18n";

export type GoogleAccount = {
  email: string | null;
  id: string | null;
  name: string | null;
  photo: string | null;
};

export type GoogleSignInResult = {
  accessToken: string;
  account: GoogleAccount;
  idToken: string | null;
};

type GoogleConfigurationErrorCode =
  | "missing_web_client_id"
  | "missing_ios_client_id";
type GoogleAuthErrorCode =
  | "generic"
  | "web_unsupported"
  | "missing_access_token"
  | "missing_user"
  | "session_expired";

export class GoogleConfigurationError extends Error {
  constructor(public readonly code: GoogleConfigurationErrorCode) {
    super(code);
    this.name = "GoogleConfigurationError";
  }
}

export class GoogleAuthRequiredError extends Error {
  constructor(public readonly code: GoogleAuthErrorCode = "generic") {
    super(code);
    this.name = "GoogleAuthRequiredError";
  }
}

export class GoogleSignInCancelledError extends Error {
  constructor() {
    super("cancelled");
    this.name = "GoogleSignInCancelledError";
  }
}

let isGoogleSigninConfigured = false;

export function configureGoogleSignIn(): void {
  if (isGoogleSigninConfigured) {
    return;
  }

  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new GoogleConfigurationError("missing_web_client_id");
  }

  const baseConfig = {
    scopes: [...GOOGLE_OAUTH_SCOPES],
    webClientId: GOOGLE_WEB_CLIENT_ID,
  };

  if (Platform.OS === "ios") {
    if (!GOOGLE_IOS_CLIENT_ID) {
      throw new GoogleConfigurationError("missing_ios_client_id");
    }

    GoogleSignin.configure({
      ...baseConfig,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
    });
    isGoogleSigninConfigured = true;
    return;
  }

  GoogleSignin.configure(baseConfig);
  isGoogleSigninConfigured = true;
}

export const configureGoogleSignin = configureGoogleSignIn;

function getAccountFromUser(user: User | null): GoogleAccount | null {
  if (!user) {
    return null;
  }

  return {
    email: user.user.email ?? null,
    id: user.user.id ?? null,
    name: user.user.name ?? null,
    photo: user.user.photo ?? null,
  };
}

function isCancelledError(caughtError: unknown): boolean {
  return (
    isErrorWithCode(caughtError) &&
    caughtError.code === statusCodes.SIGN_IN_CANCELLED
  );
}

function getGoogleErrorMessage(caughtError: unknown): string {
  if (caughtError instanceof GoogleConfigurationError) {
    return caughtError.code === "missing_ios_client_id"
      ? translate("settings.googleMissingIosClientId")
      : translate("settings.googleMissingWebClientId");
  }

  if (caughtError instanceof GoogleAuthRequiredError) {
    if (caughtError.code === "missing_access_token") {
      return translate("settings.googleSignInMissingAccessToken");
    }

    if (caughtError.code === "missing_user") {
      return translate("settings.googleSignInMissingUser");
    }

    if (caughtError.code === "session_expired") {
      return translate("settings.googleSessionExpired");
    }

    if (caughtError.code === "web_unsupported") {
      return translate("settings.googleWebUnsupported");
    }

    return translate("settings.googleAuthorizationRequired");
  }

  if (caughtError instanceof GoogleSignInCancelledError) {
    return translate("settings.googleSignInCancelled");
  }

  if (isErrorWithCode(caughtError)) {
    if (caughtError.code === statusCodes.IN_PROGRESS) {
      return translate("settings.googleSignInInProgress");
    }

    if (caughtError.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return translate("settings.googlePlayServicesUnavailable");
    }

    if (caughtError.code === "DEVELOPER_ERROR") {
      return translate("settings.googleDeveloperError");
    }
  }

  return caughtError instanceof Error
    ? caughtError.message
    : translate("settings.googleSignInFailed");
}

export async function getCurrentGoogleUser(): Promise<GoogleAccount | null> {
  if (Platform.OS === "web") {
    return null;
  }

  configureGoogleSignIn();

  const currentUser = GoogleSignin.getCurrentUser();
  if (currentUser) {
    return getAccountFromUser(currentUser);
  }

  if (!GoogleSignin.hasPreviousSignIn()) {
    return null;
  }

  const response = await GoogleSignin.signInSilently();
  if (response.type !== "success") {
    return null;
  }

  return getAccountFromUser(response.data);
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (Platform.OS === "web") {
    throw new GoogleAuthRequiredError("web_unsupported");
  }

  configureGoogleSignIn();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      throw new GoogleSignInCancelledError();
    }

    const tokens = await GoogleSignin.getTokens();
    if (!tokens.accessToken) {
      throw new GoogleAuthRequiredError("missing_access_token");
    }

    const account = getAccountFromUser(response.data);
    if (!account) {
      throw new GoogleAuthRequiredError("missing_user");
    }

    return {
      accessToken: tokens.accessToken,
      account,
      idToken: tokens.idToken ?? response.data.idToken ?? null,
    };
  } catch (caughtError) {
    if (isCancelledError(caughtError)) {
      throw new GoogleSignInCancelledError();
    }

    throw caughtError;
  }
}

export async function getGoogleAccessToken(): Promise<string> {
  if (Platform.OS === "web") {
    throw new GoogleAuthRequiredError("web_unsupported");
  }

  configureGoogleSignIn();

  try {
    const tokens = await GoogleSignin.getTokens();
    if (!tokens.accessToken) {
      throw new GoogleAuthRequiredError();
    }

    return tokens.accessToken;
  } catch {
    throw new GoogleAuthRequiredError("session_expired");
  }
}

export async function revokeGoogleAccess(): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  configureGoogleSignIn();

  if (GoogleSignin.hasPreviousSignIn()) {
    await GoogleSignin.revokeAccess();
  }
}

export async function signOutGoogle(): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  configureGoogleSignIn();

  try {
    if (GoogleSignin.hasPreviousSignIn()) {
      await GoogleSignin.revokeAccess();
    }
  } catch {
    // Best-effort revoke. Local sign-out below is what clears the app session.
  } finally {
    await GoogleSignin.signOut().catch(() => null);
  }
}

export async function loadStoredAccount(): Promise<GoogleAccount | null> {
  return getCurrentGoogleUser();
}

export async function signInGoogle(): Promise<GoogleAccount> {
  const result = await signInWithGoogle();
  return result.account;
}

export async function getValidAccessToken(): Promise<string | null> {
  try {
    return await getGoogleAccessToken();
  } catch {
    return null;
  }
}

export function isGoogleSignInCancelledError(
  caughtError: unknown,
): caughtError is GoogleSignInCancelledError {
  return caughtError instanceof GoogleSignInCancelledError;
}

export function getGoogleAuthErrorMessage(caughtError: unknown): string {
  return getGoogleErrorMessage(caughtError);
}
