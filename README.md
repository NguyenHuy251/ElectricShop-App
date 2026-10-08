# AppElectricShop

Backend Express/TypeScript/MySQL, Admin React/Vite/Ant Design và Mobile Expo/React Native.

## Chạy local

Phạm vi hiện tại: chạy local, kiểm tra nghiệp vụ bán hàng và thanh toán COD. Hosting và dịch vụ ngoài để sau.

Cần Node.js 24, MySQL 8+, database hiện có của dự án. Các file `.env` thật được Git bỏ qua; cấu hình mẫu nằm trong `.env.example` của từng ứng dụng.

Mở ba terminal tại thư mục chứa `BE` và `FE`:

```powershell
cd BE
npm ci
# Với database đã có bảng/thông số của dự án: cập nhật schema, không nạp lại dữ liệu mẫu
npm run migrate:safe
npm run dev
```

```powershell
cd FE/admin
npm ci
npm run dev
```

```powershell
cd FE/Mobile
npm ci
npx expo start --lan
```

Backend: `http://localhost:3000/api/health`. Admin: `http://localhost:5173`. Mobile: mở Expo Go bằng QR hoặc nhấn `w` để kiểm tra trên web.

Admin dùng `VITE_API_URL=http://localhost:3000/api`. Mobile dùng `EXPO_PUBLIC_API_URL=auto`, `EXPO_PUBLIC_BACKEND_PORT=3000` để lấy IP của máy chạy Expo. Điện thoại và máy tính cần cùng Wi-Fi; cho phép Node.js/cổng 3000 qua Windows Firewall trên mạng riêng. Android Emulator có thể đặt `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api`. Khởi động lại Expo sau khi đổi `.env`.

`migrate:safe` yêu cầu database đã có hệ thống thông số chuẩn hóa. Nếu cài trên máy mới, nhập bản backup đầy đủ gồm bảng, dữ liệu, stored procedure và trigger. Không dùng script nạp mẫu để nâng cấp database đang làm việc.

Database hiện có phải được chuyển bằng bản backup có bảng, dữ liệu, stored procedure và trigger. **Không chạy `BE/database/database.sql` trên database đang dùng**: file đó có `DROP DATABASE`.

Xem [QUY_TRINH_NGHIEP_VU.md](QUY_TRINH_NGHIEP_VU.md) để chạy kịch bản demo khách hàng và nhân viên. Cấu hình triển khai online đã chuẩn bị trong [DEPLOYMENT.md](DEPLOYMENT.md), hiện chưa triển khai.

## Kiểm tra mã nguồn

```powershell
cd BE
npm ci
npm test
# Kiểm thử giao dịch trong database riêng; không sửa dữ liệu thật
$env:CHECKOUT_INTEGRATION='1'
npm test
```

```powershell
cd FE/admin
npm ci
npm run build
npm run test:e2e
```

```powershell
cd FE/Mobile
npm ci
npm run typecheck
npm test
```

CI trong `.github/workflows/check.yml` chạy kiểm thử backend/MySQL, build/E2E Admin và typecheck/test Mobile.

## Chức năng bổ sung

- Giỏ hàng và mua ngay theo biến thể, snapshot giá, khóa tồn kho khi đặt hàng và hoàn kho một lần khi hủy.
- Sổ địa chỉ, thông báo trong ứng dụng, mua lại đơn và tiến trình đơn hàng.
- Admin tạo và bật/tắt mã giảm giá theo số tiền cố định; Mobile/Expo web có nút áp dụng và bỏ mã. API tương thích cả hai cấu trúc bảng voucher. Với database hiện tại, mã phần trăm có giới hạn giảm tối đa cũng được hỗ trợ; kiểm tra lượt toàn hệ thống và từng khách trong giao dịch đặt hàng, bỏ qua lượt đã được hoàn khi hủy đơn.
- Phí vận chuyển theo `SHIPPING_FEE`, miễn phí từ `FREE_SHIPPING_FROM` (0 là tắt ngưỡng).
- Nút Voucher ở trang chủ và mục Voucher của tôi trong tài khoản hiển thị các mã cửa hàng đang phát hành còn hiệu lực. Trang thanh toán cho chọn mã từ danh sách, hiển thị lý do khi không đủ điều kiện; mỗi đơn áp dụng một mã.
- Phiếu nhập kho theo sản phẩm hoặc biến thể, lịch sử nhập, báo cáo theo khoảng ngày, sản phẩm bán chạy/tồn thấp.
- Upload JPEG/PNG/WebP tối đa 5 MB, hồ sơ/đổi mật khẩu, refresh token có xoay vòng và vô hiệu hóa phiên sau khi đổi mật khẩu.
- Xuất đơn hàng/doanh thu Excel, in phiếu giao hàng và lưu PDF qua trình duyệt.

Stored procedure và dữ liệu cũ được giữ lại. `migrate-deploy.mjs` cập nhật schema, không ghi đè thông số mẫu như script migration phát triển cũ.

Các phần còn lại và trạng thái xác minh nằm trong [TIEN_DO_DU_AN.md](TIEN_DO_DU_AN.md).
