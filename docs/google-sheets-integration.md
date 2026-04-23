# Google Sheets Integration Setup

This app writes invoice rows directly to Google Sheets using the Sheets REST API v4.

## 1) Google Cloud setup

1. Create (or reuse) a Google Cloud project.
2. Enable **Google Sheets API**.
3. Configure OAuth consent screen:
   - User type: External
   - Publishing status: Testing (fine for personal use)
   - Add your Google account under Test users
4. Create OAuth client IDs:
   - iOS client (bundle identifier)
   - Android client (package name + SHA-1)
   - Web client (used by Expo web/dev auth flows)

## 2) App config

In `app.json`, fill these values:

```json
"extra": {
  "googleIosClientId": "YOUR_IOS_CLIENT_ID",
  "googleAndroidClientId": "YOUR_ANDROID_CLIENT_ID",
  "googleWebClientId": "YOUR_WEB_CLIENT_ID"
}
```

The app already defines the scheme `invoicetoexcelexpo` for OAuth redirects.

## 3) Spreadsheet values to paste in Settings

Open your Google Sheet URL:

`https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`

Copy `<SPREADSHEET_ID>` and paste it in:

- Settings -> Google Sheets -> Spreadsheet ID
- Tab name (example: `Thu chi mua linh kiện`)

## 4) Runtime flow

1. In app Settings, tap **Sign in with Google**.
2. Enter Spreadsheet ID + tab name.
3. Tap **Test Google connection**.
4. Open an invoice detail and tap **Push to Sheet**.

The app appends one row to range `A:F` with this shape:

- A: Ngày tháng
- B: (blank)
- C: (blank)
- D: Tên hóa đơn
- E: tiền hóa đơn
- F: Người thanh toán

Columns beyond `F` (such as formula columns) are not overwritten.
