# Hoàn thiện Admin — 23/09/2026

Đã triển khai các chức năng trong `ADMIN_TASKS.md`: layout chung, xác thực `/auth/me`, phân quyền, dashboard, sản phẩm, danh mục, thương hiệu, đơn hàng, tài khoản, nhân viên, đánh giá và liên hệ. Các route cũ được giữ nguyên. Danh sách tài khoản mặc định lọc khách hàng; Admin có thể bỏ lọc để xem tất cả tài khoản. Không cung cấp chức năng tạo tài khoản qua API không tồn tại.

## Quy tắc nghiệp vụ

- Admin quản lý toàn bộ; Nhân viên truy cập dashboard, sản phẩm, danh mục, thương hiệu, đơn hàng, đánh giá, liên hệ. Khách hàng không truy cập giao diện admin. Backend đọc lại tài khoản trên mỗi request để áp dụng khóa tài khoản/thay đổi quyền ngay.
- Đơn hàng đi theo `ChoXacNhan → DaXacNhan → DangGiao → DaGiao`; có thể hủy trước khi đã giao. Hủy đơn hoàn kho trong transaction có khóa hàng dữ liệu, tránh hoàn kho hai lần. Chỉ xóa đơn đã giao hoặc đã hủy.
- Doanh thu là tổng tiền **đơn đã giao**, nhóm theo tháng đặt đơn (schema hiện chưa có ngày giao). Biểu đồ thể hiện các tháng có doanh thu trong 12 tháng gần nhất.
- Admin không được tự xóa/khóa/hạ quyền tài khoản đang đăng nhập. Giao diện không cho sửa tài khoản của chính mình tại màn hình quản trị tài khoản.
- Nhân viên có thể không liên kết tài khoản. Nếu liên kết, tài khoản phải có vai trò Admin/NhanVien và chưa thuộc nhân viên khác. Xóa hồ sơ nhân viên không tự xóa tài khoản; khóa tài khoản tại màn hình Tài khoản khi cần thu hồi quyền đăng nhập.
- Các lỗi ràng buộc xóa sản phẩm, danh mục, thương hiệu, tài khoản được trả về `409`, không loại bỏ dữ liệu tại giao diện khi API báo lỗi.

## Thay đổi API backend

| Endpoint | Payload/query và hành vi |
| --- | --- |
| `GET /danh-gia` | Mới, chỉ Admin/NhanVien. Query `page`, `limit` (1–100), `ma_san_pham`, `so_sao`. Response `data[]` có `ho_ten`, `ten_san_pham`; `pagination: { page, limit, total, totalPages }`. |
| `DELETE /danh-gia/:id` | Admin/NhanVien được xóa đánh giá; KhachHang vẫn chỉ được xóa đánh giá của mình. |
| `GET /dashboard` | Bổ sung `so_don_da_xac_nhan`, `doanh_thu_theo_thang: [{ thang: 'YYYY-MM', doanh_thu }]`; tổng doanh thu chỉ tính đơn đã giao. |
| `GET /don-hang`, `GET /don-hang/:id` | Bổ sung tên đăng nhập và họ tên tài khoản đặt hàng; giữ dữ liệu người nhận và `items`. |
| `PUT /don-hang/:id/trang-thai` | `{ trang_thai }`; kiểm tra luồng, trả `409` nếu chuyển sai; hoàn kho khi hủy trong transaction. |
| `DELETE /don-hang/:id` | Trả `409` với đơn chưa kết thúc. |
| `GET /san-pham` | Sửa JOIN danh mục trong truy vấn đếm khi tìm kiếm. Kiểm tra `page ≥ 1`, `1 ≤ limit ≤ 100`. |
| `POST /nhan-vien`, `PUT /nhan-vien/:id` | Kiểm tra liên kết `ma_tai_khoan`; PUT hỗ trợ đổi liên kết, `null` để bỏ liên kết. Các trường còn lại giữ nguyên. |
| `GET /nhan-vien`, `GET /nhan-vien/:id` | Chỉ Admin được đọc hồ sơ/lương nhân viên. |
| `PUT /tai-khoan/:id`, `DELETE /tai-khoan/:id` | Kiểm tra vai trò/trạng thái, email trùng; chặn tự khóa/hạ quyền/xóa. |
| `PUT /lien-he/:id` | `{ trang_thai: 'ChuaXuLy' \| 'DangXuLy' \| 'DaXuLy' }`; từ chối trạng thái không hợp lệ. |

Lỗi form có thêm `fieldErrors: { [ten_truong]: thong_bao }` để FE hiển thị dưới đúng ô nhập; giữ `success` và `message` tương thích client cũ. Lỗi trùng mã/tên/email/liên kết trả `409`.

## Chạy và cấu hình

- FE: `npm install`, `npm run dev` trong `FE/admin`. File `.env` hiện có `VITE_API_URL` hợp lệ. Dùng `.env.example` làm mẫu trên máy khác; không đưa `.env` vào Git.
- BE: `npm install`, cấu hình MySQL/JWT trong `.env`, rồi `npm run dev` trong `BE`.
- CORS: cấu hình `CORS_ORIGINS` bằng danh sách origin phân cách dấu phẩy, **không kèm đường dẫn `/api`**. Khi `NODE_ENV=production`, backend yêu cầu biến này. Cần điền domain triển khai thật trước khi phát hành.
- Hosting frontend phải chuyển các route SPA về `index.html`.

## Kết quả kiểm tra

- `FE/admin`: `npm run build` đạt. Vite còn cảnh báo bundle chính >500 kB; không ảnh hưởng kết quả build.
- `BE`: `npm test` đạt **12/12**, bao gồm build TypeScript. Kiểm tra token/quyền/khóa tài khoản, bảo vệ chính mình, luồng đơn hàng và hoàn kho, quyền đánh giá, phân trang/tìm kiếm, lỗi khóa ngoại, liên kết nhân viên và validation.
- `FE/admin`: **8/8 kịch bản Playwright đạt trên Chrome**, gồm đăng nhập/logout, quyền Admin/NhanVien/KhachHang, 401, CRUD sản phẩm/danh mục/thương hiệu/nhân viên, khóa tài khoản, chi tiết/trạng thái đơn hàng và liên hệ, lọc/xóa đánh giá, error/retry/field errors, menu và scroll ngang ở 390 px. Chạy lại bằng `npm run test:e2e` (cần Chrome; có thể đổi `channel` trong `playwright.config.ts`).
- Các kiểm thử backend dùng database stub; Playwright giả lập API. Không tạo/xóa dữ liệu cửa hàng thật. **Chưa kiểm thử tích hợp với MySQL/API thật** vì không có API chạy tại cổng 3000 trong lúc kiểm tra. Các mục tích hợp ở phần 7 của checklist được giữ chưa tích.
- Trong quá trình làm việc, thư mục `.git` và `.gitignore` gốc không còn hiện diện trong workspace. Đã thêm `.gitignore` tại `FE/admin` và `BE` để loại môi trường, dependencies và build/test output; chưa tạo commit.
