# Thanh toán COD

## Chạy trên máy hiện tại

Trong `BE`, chạy `npm run migrate` một lần để thêm bảng chống tạo đơn trùng. Lệnh có thể chạy lại và không xóa dữ liệu. Sau đó chạy `npm start` hoặc `npm run dev`. Không chạy lại `database.sql` trên dữ liệu đang dùng vì script đó có lệnh xóa database.

Trong `FE/Mobile`, cấu hình `EXPO_PUBLIC_API_URL` trỏ về BE rồi chạy `npx expo start --clear`. Với web, mở `http://localhost:8081`.

## Quy trình

1. Đăng nhập, thêm sản phẩm vào giỏ; số lượng phải là số nguyên 1–999, không vượt tồn kho và sản phẩm phải đang bán.
2. Giỏ hàng → Tiến hành thanh toán. FE tải thông tin người dùng mới nhất và báo giá từ `GET /api/don-hang/checkout`.
3. Nhập họ tên, số điện thoại di động Việt Nam, địa chỉ đầy đủ và ghi chú tùy chọn. Địa chỉ riêng của đơn không tự ghi đè hồ sơ.
4. Kiểm tra đơn, chọn xác nhận thông tin, bấm đặt hàng COD. Phí giao hàng bằng 0 theo chính sách hiện có; không có giảm giá, phụ phí hay thu tiền online.
5. BE kiểm tra lại thông tin, khóa giỏ và tồn kho trong transaction, đối chiếu giá/số lượng với báo giá đã xem. Nếu có thay đổi, FE yêu cầu kiểm tra lại, không tự chấp nhận tổng tiền mới.
6. Thành công: lưu đơn `ChoXacNhan`, lưu giá sản phẩm tại thời điểm đặt, trừ tồn kho, xóa giỏ và ghi kết quả chống trùng trong cùng transaction. Cột `thanh_tien` do MySQL tự tính.
7. Nếu mất phản hồi, FE lưu lại yêu cầu theo tài khoản và gửi lại đúng `request_id`; BE trả lại đơn cũ. Khôi phục vẫn hoạt động sau khi tải lại trình duyệt.
8. Khách xem chi tiết hoặc hủy khi đơn còn `ChoXacNhan`. Hủy trả tồn kho đúng một lần. Nhân viên xác nhận → giao hàng → đã giao theo luồng quản trị hiện có.

COD chỉ là phương thức trả tiền khi nhận hàng. Không hiển thị “đã thanh toán” khi tạo đơn. Hệ thống hiện chưa có sổ đối soát tiền COD độc lập; trạng thái giao hàng không thay thế chứng từ thu tiền.

## API tạo đơn

`POST /api/don-hang`, cần Bearer token. Body gồm `ho_ten_nguoi_nhan`, `so_dien_thoai`, `dia_chi_giao_hang`, `ghi_chu`, `phuong_thuc_thanh_toan: "ThanhToanKhiNhanHang"`, `snapshot` lấy từ báo giá và `request_id` mới cho mỗi lần xác nhận. Khi chưa biết kết quả, phải gửi lại nguyên body và cùng `request_id`. Tổng tiền do server tính, không nhận từ client.

- 400: thông tin chưa hợp lệ; `fieldErrors` cho từng trường.
- 409: giỏ, giá hoặc tồn kho thay đổi; tải báo giá và xác nhận lại.
- 503 / lỗi mạng: giữ yêu cầu và thử lại để kiểm tra kết quả.

## Kiểm thử

`npm test`: build BE và chạy unit tests. Để chạy thêm test transaction MySQL trong PowerShell:

```powershell
$env:CHECKOUT_INTEGRATION='1'
npm test
```

Test MySQL tự tạo database `electric_checkout_test_*` và xóa chính database đó sau khi xong; tài khoản MySQL cần quyền tạo database. Kiểm thử gồm giá thay đổi, thiếu hàng, tranh mua món cuối, tạo đơn đồng thời, gửi lại, rollback khi lỗi và hủy đơn.

Với Expo web đang chạy và dependencies của FE/admin đã cài, chạy `node scripts/test-checkout-web.mjs`. Script dùng Chrome headless, BE cổng 3101 và database `electric_checkout_web_*` riêng. Nó kiểm tra từ đăng nhập đến đặt/hủy đơn, mất phản hồi và gửi lại sau reload; ảnh giao diện lưu trong `BE/artifacts/checkout/`. Không tạo đơn thử trong database cửa hàng.
