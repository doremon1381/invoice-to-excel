import { GOOGLE_DRIVE_API_BASE } from "@/lib/constants";
import { assertGoogleResponseOk, fetchGoogleApi } from "@/lib/googleApi";

export type GoogleSpreadsheetFile = {
  id: string;
  modifiedTime?: string;
  name: string;
  webViewLink?: string;
};

export async function listGoogleSpreadsheets(
  accessToken: string,
): Promise<GoogleSpreadsheetFile[]> {
  const params = [
    [
      "q",
      "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
    ],
    ["fields", "files(id,name,modifiedTime,webViewLink)"],
    ["orderBy", "modifiedTime desc"],
  ]
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  const response = await fetchGoogleApi(
    `${GOOGLE_DRIVE_API_BASE}/files?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  await assertGoogleResponseOk(response);

  const payload = (await response.json()) as {
    files?: Array<Partial<GoogleSpreadsheetFile>>;
  };

  return (payload.files ?? [])
    .filter((file): file is GoogleSpreadsheetFile => {
      return typeof file.id === "string" && typeof file.name === "string";
    })
    .map((file) => ({
      id: file.id,
      modifiedTime:
        typeof file.modifiedTime === "string" ? file.modifiedTime : undefined,
      name: file.name,
      webViewLink:
        typeof file.webViewLink === "string" ? file.webViewLink : undefined,
    }));
}
