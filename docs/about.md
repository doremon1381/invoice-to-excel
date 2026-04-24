App này làm gì
Đây là app Expo/React Native để quét hóa đơn. Người dùng chụp ảnh hoặc chọn ảnh hóa đơn, app nén ảnh, gửi ảnh lên API chat/vision tương thích OpenAI, nhận JSON hóa đơn, cho người dùng kiểm tra/chỉnh sửa, lưu vào SQLite cục bộ, rồi xuất Excel hoặc đẩy một dòng sang Google Sheets.

Đã làm được

Có navigation đầy đủ: Home, Scan, Settings, Database Management, Invoice Detail.
Có quét hóa đơn bằng camera hoặc import ảnh từ thư viện.
Có nén ảnh, base64 ảnh và gọi AI extraction ở lib/openai.ts.
Có parse JSON hóa đơn thành cấu trúc chuẩn: vendor, ngày, tổng tiền, thuế, line items, currency.
Có SQLite local với bảng invoices, invoice_data, line_items, migration và CRUD ở lib/db.ts.
Home hiển thị danh sách hóa đơn, tổng chi trong tháng, filter, xóa hóa đơn, refresh.
Detail cho xem/chỉnh sửa tên hóa đơn, vendor, nội dung, ngày, tổng tiền, thuế, người thanh toán; có xác nhận lưu, quét lại, xóa.
Có xem raw AI output, line items và financial summary.
Có export Excel:
Export toàn bộ trong Database Management.
Export từng hóa đơn trong Invoice Detail.
Có lưu lịch sử export.
Có tích hợp Google Sheets:
Đăng nhập Google OAuth.
Lưu Spreadsheet ID và tab.
Test connection.
Đẩy một dòng hóa đơn vào range A:F.
Có dark/light mode, tiếng Anh/tiếng Việt, SecureStorage wrapper, UI component layer khá đầy đủ.
npm run lint và npx tsc --noEmit đều pass.
Chưa làm / đang lệch so với spec

Vấn đề lớn nhất: API key đang bị hardcode trong lib/constants.ts (line 27). Có hook useStoredApiKey, nhưng Settings UI lưu API key đang bị bỏ/không dùng. Cần chuyển sang SecureStore đúng nghĩa.
README vẫn là README mặc định của Expo, chưa mô tả app thật, cách cấu hình AI key, Google Sheets, export.
Docs/spec đang lệch: nhiều tài liệu nói Anthropic/PaddleOCR, nhưng code thật đang dùng OpenAI-compatible endpoint platform.beeknoee.com và model gemini-3-flash.
Scan screen có TODO chưa bật: extraction summary card, nút close trong header, AI extraction settings card.
Home filter “Đã xuất/Exported” thực tế chỉ lọc hóa đơn success, chưa tracking hóa đơn nào đã export thật.
Export all hiện chỉ xuất summary cơ bản; subtotal/tax/discount đang để 0 vì list query chưa lấy các field đó.
Google Sheets mới hỗ trợ đẩy từng hóa đơn, chưa có bulk push, chưa tracking hóa đơn nào đã push, payer không tự map từ invoice mà để nhập trong modal.
Chưa có edit line items; updateInvoice cũng chưa cập nhật lại line_items.
Web gần như không dùng được đầy đủ vì SQLite trả về unavailable trên web.
Chưa thấy test tự động ngoài lint/typecheck; chưa có test runtime trên thiết bị/simulator trong repo.