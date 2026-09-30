# Thanh toán COD

## Chạy trên máy hiện tại

Trong `BE`, chạy `npm run migrate` một lần để thêm bảng chống tạo đơn trùng. Lệnh có thể chạy lại và không xóa dữ liệu. Sau đó chạy `npm start` hoặc `npm run dev`. Không chạy lại `database.sql` trên dữ liệu đang dùng vì script đó có lệnh xóa database.

Trong `FE/Mobile`, cấu hình `EXPO_PUBLIC_API_URL` trỏ về BE rồi chạy `npx expo start --clear`. Với web, mở `http://localhost:8081`.

## Quy trình

1. Đăng nhập, thêm sản phẩm vào giỏ; số lượng phải là số nguyên 1–999, không vượt tồn kho và sản phẩm phải đang bán.
2. Giỏ hàng → Tiến hành thanh toán. FE tải thông tin người dùng mới nhất và báo giá từ `GET /api/don-hang/checkout`.
3. Nhập họ tên, số điện thoại di động Việt Nam, địa chỉ đầy đủ và ghi chú tùy chọn. Địa chỉ riêng của đơn không tự ghi đè hồ sơ.
4. Bấm kiểm tra đơn: mobile lấy lại giá và tồn kho từ server. Nếu giá hoặc giỏ thay đổi, hiển thị thông tin mới để khách kiểm tra, chọn xác nhận rồi đặt hàng COD. Phí giao hàng bằng 0 theo chính sách hiện có; không có giảm giá, phụ phí hay thu tiền online.
5. BE kiểm tra lại thông tin, khóa giỏ và tồn kho trong transaction, đối chiếu giá/số lượng với báo giá đã xem. Nếu có thay đổi, FE yêu cầu kiểm tra lại, không tự chấp nhận tổng tiền mới.
6. Thành công: lưu đơn `ChoXacNhan`, lưu giá sản phẩm tại thời điểm đặt, trừ tồn kho, xóa giỏ và ghi kết quả chống trùng trong cùng transaction. Cột `thanh_tien` do MySQL tự tính.
7. Nếu mất phản hồi, FE lưu lại yêu cầu theo tài khoản và gửi lại đúng `request_id`; BE trả lại đơn cũ. Khôi phục vẫn hoạt động sau khi tải lại trình duyệt.
8. Khách xem chi tiết hoặc hủy khi đơn còn `ChoXacNhan`. Hủy trả tồn kho đúng một lần. Nhân viên xác nhận → giao hàng → đã giao theo luồng quản trị hiện có.

COD chỉ là phương thức trả tiền khi nhận hàng. Không hiển thị “đã thanh toán” khi tạo đơn. Hệ thống hiện chưa có sổ đối soát tiền COD độc lập; trạng thái giao hàng không thay thế chứng từ thu tiền.

## Chi tiết sản phẩm và thanh toán ngay

Trang `/product/:id` hiển thị thông tin sản phẩm, ảnh phóng to, thương hiệu, mã hàng, bảo hành, mô tả, thông số kỹ thuật, đánh giá hiện có và sản phẩm cùng danh mục. Các thông tin chưa có dữ liệu được ghi rõ là đang cập nhật. Hai nút mua hàng nằm cạnh nhau; sản phẩm ngừng bán/hết hàng và số lượng không hợp lệ không thể mua.

- **Thêm vào giỏ hàng** cộng số lượng chọn vào giỏ; BE kiểm tra cả số lượng đã có và tồn kho hiện tại.
- **Thanh toán ngay** mở `/checkout?source=buy_now&productId=...&quantity=...`, chỉ đặt sản phẩm và số lượng vừa chọn. Không thêm vào giỏ, không gộp hoặc xóa những món đã lưu trong giỏ.
- Khách có thể quay lại sửa số lượng trước khi xác nhận. Đơn vẫn trải qua nhập thông tin nhận hàng, kiểm tra tổng tiền và xác nhận COD.
- Lấy báo giá trực tiếp bằng `GET /api/don-hang/checkout?source=buy_now&ma_san_pham=...&so_luong=...`. Khi tạo đơn, bổ sung `source: "buy_now"`, `ma_san_pham` và `so_luong` dạng số vào body. Khi không có `source`, API dùng giỏ hàng như trước.
- Mua ngay dùng cùng cơ chế chốt giá, khóa tồn kho, rollback và chống gửi trùng. Không cần tồn tại giỏ hàng. Khi khôi phục yêu cầu chưa rõ kết quả, FE giữ đúng sản phẩm, số lượng và phương thức của yêu cầu đã gửi, kể cả khi khách quay lại từ đường dẫn thanh toán giỏ hàng.

Không có thay đổi schema mới cho tính năng mua ngay; sử dụng bảng `checkout_requests` từ migration trước.

## Dữ liệu gửi khi tạo đơn

`POST /api/don-hang`, cần Bearer token. Body gồm `ho_ten_nguoi_nhan`, `so_dien_thoai`, `dia_chi_giao_hang`, `ghi_chu`, `phuong_thuc_thanh_toan: "ThanhToanKhiNhanHang"`, `snapshot` lấy từ báo giá và `request_id` mới cho mỗi lần xác nhận. Khi chưa biết kết quả, phải gửi lại nguyên body và cùng `request_id`. Tổng tiền do server tính, không nhận từ client.

- 400: thông tin chưa hợp lệ; `fieldErrors` cho từng trường.
- 409: giỏ, giá hoặc tồn kho thay đổi; tải báo giá và xác nhận lại.
- 503 / lỗi mạng: giữ yêu cầu và thử lại để kiểm tra kết quả.

## Đánh giá sản phẩm trên mobile

- Vào Đơn hàng → Chi tiết đơn hàng. Chỉ chủ đơn có trạng thái `DaGiao` được gửi đánh giá cho sản phẩm thuộc đơn đó. API kiểm tra lại quyền sở hữu, trạng thái và sản phẩm; không dựa vào việc ẩn nút trên mobile.
- Mỗi tài khoản đánh giá một lần cho mỗi sản phẩm, kể cả khi mua trong nhiều đơn. Chọn 1–5 sao, nhận xét không bắt buộc và tối đa 2.000 ký tự. Có thể sửa số sao và nội dung đánh giá của mình.
- Khi mất phản hồi gửi đánh giá, mobile đọc lại đánh giá đã lưu trong chi tiết đơn để tránh yêu cầu người dùng tạo lại đánh giá đã thành công.
- Chi tiết đơn tự tải lại khi quay về màn hình, hỗ trợ kéo xuống làm mới và thử lại khi lỗi. Trang sản phẩm hiện có tự tải lại danh sách đánh giá khi được mở lại.
- `can_review` trong API chi tiết đơn chỉ bật cho chủ đơn đã giao; nhân viên đang xem đơn của người khác không có nút đánh giá.
- Không tự coi trạng thái đã giao là đã đối soát tiền COD. Thanh toán online cần tích hợp cổng thanh toán và xác minh giao dịch riêng.

## Kiểm thử tự động và kiểm tra thủ công

`npm test`: build BE và chạy unit tests. Để chạy thêm test transaction MySQL trong PowerShell:

```powershell
$env:CHECKOUT_INTEGRATION='1'
npm test
```

Test MySQL tự tạo database `electric_checkout_test_*` và xóa chính database đó sau khi xong; tài khoản MySQL cần quyền tạo database. Kiểm thử gồm giá thay đổi, thiếu hàng, tranh mua món cuối, tạo đơn đồng thời, gửi lại, rollback khi lỗi và hủy đơn.

Với Expo web đang chạy và dependencies của FE/admin đã cài, chạy `node scripts/test-checkout-web.mjs`. Script dùng Chrome headless, BE cổng 3101 và database `electric_checkout_web_*` riêng. Nó kiểm tra từ đăng nhập đến đặt/hủy đơn, mất phản hồi và gửi lại sau reload; ảnh giao diện lưu trong `BE/artifacts/checkout/`. Không tạo đơn thử trong database cửa hàng.
