import { translate } from "@/lib/i18n";

export class GoogleApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "GoogleApiError";
  }
}

function getStatusMessage(status: number): string | null {
  if (status === 401) {
    return translate("settings.googleApiSessionExpired");
  }

  if (status === 403) {
    return translate("settings.googleApiMissingScopes");
  }

  if (status === 404) {
    return translate("settings.googleApiNotFound");
  }

  return null;
}

export async function parseGoogleApiError(response: Response): Promise<string> {
  const mappedMessage = getStatusMessage(response.status);
  if (mappedMessage) {
    return mappedMessage;
  }

  try {
    const payload = (await response.json()) as {
      error?: { message?: string };
    };

    if (payload.error?.message) {
      return payload.error.message;
    }
  } catch {
    // Best-effort parsing.
  }

  return translate("settings.googleApiRequestFailed", {
    status: response.status,
  });
}

export async function assertGoogleResponseOk(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }

  throw new GoogleApiError(
    await parseGoogleApiError(response),
    response.status,
  );
}

export async function fetchGoogleApi(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new GoogleApiError(
      translate("settings.googleApiNetworkFailed"),
    );
  }
}
