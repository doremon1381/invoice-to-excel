# Google Sheets Integration Setup

App dùng Google Sign-In native qua `@react-native-google-signin/google-signin`, lấy `accessToken` khi cần, dùng Google Drive API để liệt kê spreadsheet và Google Sheets API v4 để tạo spreadsheet, tạo tab `Invoices`, ghi header, rồi append hóa đơn.

Flow này chỉ hỗ trợ native Android/iOS development build. Bản web cần một OAuth web flow riêng nếu muốn hỗ trợ Google Sheets.

## Google Cloud

Project hiện tại: `InvoiceExcel`.

Cần bật API:

- Google Sheets API
- Google Drive API

OAuth consent:

- User type: External
- Publishing status: Testing
- Test user: `khuongduy250900@gmail.com`
- Scopes:
  - `userinfo.email`
  - `userinfo.profile`
  - `https://www.googleapis.com/auth/spreadsheets`
  - `https://www.googleapis.com/auth/drive.metadata.readonly`

OAuth clients:

- Web client: dùng Client ID cho `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
- Android client: package name phải là `com.doremon1380.invoicetoexcelexpo` và SHA-1 phải khớp keystore đang build app.
- iOS client: bundle ID phải là `com.doremon1380.invoicetoexcelexpo`.
- iOS reversed client ID dùng cho `iosUrlScheme`.

Không lưu hoặc dùng Google Client Secret trong app Expo/React Native.

## App Config

`app.json` cần giữ các giá trị native này:

```json
{
  "scheme": "com.doremon1380.invoicetoexcelexpo",
  "android": {
    "package": "com.doremon1380.invoicetoexcelexpo"
  },
  "ios": {
    "bundleIdentifier": "com.doremon1380.invoicetoexcelexpo"
  }
}
```

Google Sign-In plugin:

```json
[
  "@react-native-google-signin/google-signin",
  {
    "iosUrlScheme": "com.googleusercontent.apps.435208614905-t4y2et16fe2mmu4f7meabumjues7k2of"
  }
]
```

`.env` và `.env.example`:

```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=435208614905-1550v87778r39vrb0ncinfdplbqjsm4q.apps.googleusercontent.com
```

`app.json > expo.extra.googleWebClientId` cũng giữ cùng Web Client ID làm fallback cho native build. Đây là public client ID, không phải secret.

## Runtime Flow

1. Vào Settings.
2. Bấm `Đăng nhập Google`.
3. Bấm `Chọn / tạo Google Sheet`.
4. Chọn spreadsheet có sẵn hoặc tạo spreadsheet mới.
5. App đảm bảo tab `Invoices` tồn tại và ghi header `Invoices!A1:K1`.
6. Vào chi tiết hóa đơn và bấm `Đẩy lên Sheet`.
7. App lấy token mới nhất bằng `GoogleSignin.getTokens()` và append vào `Invoices!A:K`.

Header cố định:

```text
Ngày, Nhà cung cấp, Số hóa đơn, Tổng tiền, Thuế, Tiền tệ, Phương thức thanh toán, Ghi chú, Số dòng hàng, Dữ liệu dòng hàng JSON, Ngày xuất
```

## Development Build

Google Sign-In native cần development build:

```bash
npx expo prebuild --clean
npx expo run:android
npx expo start --dev-client
```

Không test flow Google Sign-In native bằng Expo Go. Bản web hiện chỉ hiển thị thông báo không hỗ trợ; nếu cần web thì phải thêm OAuth web flow riêng.

## Android SHA-1

Nếu Android login lỗi `DEVELOPER_ERROR`, kiểm tra Android OAuth client trong Google Cloud:

- Package name: `com.doremon1380.invoicetoexcelexpo`
- SHA-1: đúng với keystore dùng build app

Lấy SHA-1:

```powershell
cd android
.\gradlew signingReport
```

Sau đó cập nhật SHA-1 vào Android OAuth client trên Google Cloud Console và rebuild development build.

Nếu báo Google Play Services không có hoặc quá cũ, dùng máy Android có Google Play Store/Google Play Services hoặc emulator Android Studio image loại Google Play.
