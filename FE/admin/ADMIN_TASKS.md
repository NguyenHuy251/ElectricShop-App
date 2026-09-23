# Công việc cần làm cho FE Admin

> Cập nhật 23/09/2026: đã triển khai các chức năng còn thiếu. Build FE/BE, 12 kiểm thử backend và 8 kịch bản Chrome đã đạt với dữ liệu giả lập. Các mục kiểm thử API/MySQL thật ở phần 7 vẫn chưa tích. Xem [ADMIN_IMPLEMENTATION.md](./ADMIN_IMPLEMENTATION.md) để biết API, cấu hình và giới hạn kiểm thử.

## Phân chia công việc cho nhóm

### Nửa A - Đã thực hiện trong workspace này

- [x] Tạo màn hình quản lý thương hiệu tại `BrandsPage.tsx`.
- [x] Thêm route `/brands`.
- [x] Thêm menu Thương hiệu vào các màn hình sản phẩm và danh mục.
- [x] Thêm/sửa/xóa thương hiệu.
- [x] Thêm/sửa/xóa danh mục.
- [x] Dùng dropdown danh mục và thương hiệu thật trong form sản phẩm.
- [x] Thêm sửa/xóa sản phẩm.
- [x] Hiển thị lỗi cơ bản khi tải hoặc lưu dữ liệu.
- [x] Kiểm tra bằng `npm run build` trong `FE/admin`.

Phạm vi Nửa A nằm chủ yếu ở:

- `FE/admin/src/pages/BrandsPage.tsx`
- `FE/admin/src/pages/CategoriesPage.tsx`
- `FE/admin/src/pages/ProductsPage.tsx`
- `FE/admin/src/App.tsx`
- `FE/admin/src/styles.css`

### Nửa B - Đã triển khai, chờ kiểm thử tích hợp

#### Nền tảng dùng chung

- [x] Tạo `AdminLayout`, `Sidebar`, `Topbar` dùng chung.
- [x] Thay sidebar lặp lại trong từng page bằng layout chung.
- [x] Dùng `NavLink` thay cho thẻ `<a>`.
- [x] Tạo state xác thực tập trung và gọi `/auth/me`.
- [x] Ẩn/hiện menu theo vai trò `Admin` và `NhanVien`.
- [x] Xử lý logout, token hết hạn và responsive layout.

#### Nghiệp vụ vận hành

- [x] Hoàn thiện Dashboard: loading, lỗi, biểu đồ và đơn mới nhất.
- [x] Hoàn thiện Đơn hàng: tìm kiếm, lọc, xem chi tiết, cập nhật trạng thái và xóa.
- [x] Hoàn thiện Khách hàng/Tài khoản: tìm kiếm, sửa, khóa/mở khóa, xóa.
- [x] Hoàn thiện Nhân viên: thêm, sửa, xóa, lọc trạng thái và kiểm soát quyền Admin.
- [x] Hoàn thiện Đánh giá: bỏ mã sản phẩm cố định `1`, chọn sản phẩm, lọc và quản trị.
- [x] Hoàn thiện Liên hệ: xem chi tiết, lọc, tìm kiếm, đổi trạng thái và xóa.

#### Chất lượng và phát hành

- [x] Tạo các file API và type dùng chung, giảm `any`.
- [x] Thay `alert()` bằng `message`/`notification` của Ant Design.
- [x] Bổ sung loading, empty state, error state và confirm Modal.
- [x] Chuẩn hóa định dạng tiền, ngày và trạng thái.
- [x] Kiểm thử quyền Admin/NhanVien, CRUD và responsive.
- [x] Chạy `npm run build` và kiểm tra cấu hình `VITE_API_URL` trước khi merge.

### Quy tắc phối hợp

- Thành viên làm Nửa B không sửa lại CRUD sản phẩm, danh mục và thương hiệu nếu không cần thiết.
- Khi tạo layout chung, cần giữ nguyên các route hiện có: `/dashboard`, `/products`, `/categories`, `/brands`, `/orders`, `/customers`, `/employees`, `/reviews`, `/contacts`.
- Trước khi merge, chạy `npm run build` trong `FE/admin`.
- Nếu có thay đổi API backend, ghi rõ endpoint và payload trong pull request.

## 1. Mục tiêu

Hoàn thiện trang quản trị web cho cửa hàng điện gia dụng, sử dụng React, Vite, TypeScript, Axios và Ant Design.

FE admin cần hỗ trợ đầy đủ các nhóm người dùng:

- `Admin`: toàn quyền quản trị.
- `NhanVien`: xử lý sản phẩm, đơn hàng và các nghiệp vụ được cấp quyền.
- Người chưa đăng nhập: chỉ được truy cập trang đăng nhập.

API backend hiện chạy mặc định tại `http://localhost:3000/api`.

## 2. Việc ưu tiên cao

### 2.1. Hoàn thiện xác thực và phân quyền

- [x] Tạo `AuthContext` hoặc cơ chế state tập trung cho user hiện tại.
- [x] Gọi `/auth/me` sau khi khôi phục token để xác nhận token còn hợp lệ.
- [x] Nếu user là `KhachHang`, không cho truy cập giao diện admin.
- [x] Ẩn/hiện menu theo vai trò:
  - `Admin`: tài khoản, nhân viên, khách hàng, toàn bộ chức năng.
  - `NhanVien`: sản phẩm, danh mục, thương hiệu, đơn hàng, liên hệ, đánh giá.
- [x] Xử lý trạng thái token hết hạn và chuyển về `/login`.
- [x] Xóa cả `admin_token` và `admin_user` khi đăng xuất.
- [x] Không lưu mật khẩu trong localStorage.

### 2.2. Chuẩn hóa layout quản trị

Các page sử dụng layout dùng chung:

- [x] Tạo `AdminLayout`.
- [x] Tạo `Sidebar` dùng chung.
- [x] Tạo `Topbar` dùng chung.
- [x] Tạo menu bằng `NavLink` thay cho thẻ `<a>` để không reload toàn trang.
- [x] Hiển thị tên và vai trò người đang đăng nhập.
- [x] Thêm nút đăng xuất dùng chung.
- [x] Hiển thị trạng thái loading khi chuyển trang.
- [x] Tạo layout responsive cho màn hình tablet và mobile.
- [x] Thêm menu thu gọn trên màn hình nhỏ.

## 3. Hoàn thiện từng màn hình

### 3.1. Dashboard

API: `GET /dashboard`

- [x] Hiển thị tổng sản phẩm.
- [x] Hiển thị tổng khách hàng.
- [x] Hiển thị tổng nhân viên.
- [x] Hiển thị tổng đơn hàng.
- [x] Hiển thị doanh thu.
- [x] Hiển thị số đơn theo trạng thái.
- [x] Thêm biểu đồ doanh thu theo thời gian nếu backend cung cấp dữ liệu.
- [x] Thêm danh sách đơn hàng mới nhất.
- [x] Hiển thị trạng thái loading, lỗi và nút thử lại.
- [x] Định dạng tiền theo chuẩn Việt Nam.

### 3.2. Sản phẩm

API:

- `GET /san-pham`
- `GET /san-pham/:id`
- `POST /san-pham`
- `PUT /san-pham/:id`
- `DELETE /san-pham/:id`

- [x] Thêm bộ lọc theo tên, mã sản phẩm, danh mục, thương hiệu.
- [x] Thêm phân trang theo `page`, `limit`, `totalPages`.
- [x] Thay ô nhập mã danh mục và mã thương hiệu bằng dropdown dữ liệu thật.
- [x] Tạo form thêm sản phẩm bằng Modal hoặc Drawer.
- [x] Tạo form chỉnh sửa sản phẩm.
- [x] Nhập đầy đủ thông tin chi tiết: công suất, dung tích, kích thước, màu sắc, xuất xứ, thông số khác.
- [x] Thêm trường hình ảnh và preview ảnh.
- [x] Thêm xác nhận trước khi xóa.
- [x] Không cho xóa sản phẩm nếu backend trả lỗi do ràng buộc đơn hàng.
- [x] Hiển thị badge đúng theo trạng thái `DangBan`, `HetHang`, `NgungBan`.
- [x] Thêm thông báo thành công/thất bại sau mỗi thao tác.

### 3.3. Danh mục

API:

- `GET /danh-muc`
- `POST /danh-muc`
- `PUT /danh-muc/:id`
- `DELETE /danh-muc/:id`

- [x] Hiển thị danh sách bằng bảng có tìm kiếm.
- [x] Thêm danh mục.
- [x] Chỉnh sửa danh mục.
- [x] Xóa danh mục sau khi xác nhận.
- [x] Bật/tắt trạng thái danh mục.
- [x] Xử lý lỗi khi danh mục đang được sản phẩm sử dụng.

### 3.4. Thương hiệu

FE admin đã có trang thương hiệu riêng và API CRUD.

API:

- `GET /thuong-hieu`
- `POST /thuong-hieu`
- `PUT /thuong-hieu/:id`
- `DELETE /thuong-hieu/:id`

- [x] Tạo `BrandsPage.tsx`.
- [x] Thêm route `/brands`.
- [x] Thêm menu Thương hiệu vào sidebar.
- [x] Thêm, sửa, xóa thương hiệu.
- [x] Hiển thị quốc gia và mô tả.
- [x] Xử lý lỗi thương hiệu đang được sản phẩm sử dụng.

### 3.5. Đơn hàng

API:

- `GET /don-hang`
- `GET /don-hang/:id`
- `PUT /don-hang/:id/trang-thai`
- `DELETE /don-hang/:id`

- [x] Hiển thị tên tài khoản đặt hàng, người nhận, số điện thoại và địa chỉ.
- [x] Hiển thị danh sách sản phẩm trong từng đơn.
- [x] Tạo Drawer hoặc Modal xem chi tiết đơn hàng.
- [x] Cập nhật trạng thái đơn hàng bằng các giá trị hợp lệ:
  - `ChoXacNhan`
  - `DaXacNhan`
  - `DangGiao`
  - `DaGiao`
  - `DaHuy`
- [x] Không cho chuyển trạng thái tùy ý nếu nghiệp vụ yêu cầu luồng tuần tự.
- [x] Thêm bộ lọc theo trạng thái.
- [x] Thêm tìm kiếm theo mã đơn hoặc tên người nhận.
- [x] Hiển thị tổng tiền đúng định dạng.
- [x] Thêm xác nhận trước khi xóa đơn.
- [x] Hiển thị thông báo sau khi cập nhật trạng thái.

### 3.6. Khách hàng và tài khoản

API tài khoản:

- `GET /tai-khoan`
- `GET /tai-khoan/:id`
- `PUT /tai-khoan/:id`
- `DELETE /tai-khoan/:id`

- [x] Tách rõ danh sách khách hàng và danh sách tài khoản nếu cần.
- [x] Thêm tìm kiếm theo tên, username, email, số điện thoại.
- [x] Thêm phân trang.
- [x] Xem chi tiết tài khoản.
- [x] Chỉnh sửa họ tên, email, số điện thoại, địa chỉ.
- [x] Khóa/mở khóa tài khoản bằng `trang_thai`.
- [x] Không cho sửa/xóa tài khoản trái với quyền hiện tại.
- [x] Cân nhắc chặn Admin tự xóa chính mình.
- [x] Xác nhận trước khi xóa tài khoản.

### 3.7. Nhân viên

API:

- `GET /nhan-vien`
- `GET /nhan-vien/:id`
- `POST /nhan-vien`
- `PUT /nhan-vien/:id`
- `DELETE /nhan-vien/:id`

- [x] Thêm form tạo nhân viên.
- [x] Chỉnh sửa thông tin nhân viên.
- [x] Xóa nhân viên sau khi xác nhận.
- [x] Hiển thị chức vụ, ngày vào làm, lương, trạng thái.
- [x] Thêm lọc `DangLam` và `NghiLam`.
- [x] Chỉ `Admin` được thấy nút thêm, sửa, xóa.
- [x] Kiểm tra liên kết giữa nhân viên và tài khoản.

### 3.8. Đánh giá

API hiện tại lấy đánh giá theo sản phẩm:

- `GET /danh-gia/san-pham/:ma_san_pham`

- [x] Không cố định mã sản phẩm `1`.
- [x] Thêm dropdown chọn sản phẩm.
- [x] Hoặc bổ sung API backend lấy toàn bộ đánh giá có phân trang.
- [x] Hiển thị tên người đánh giá, sản phẩm, số sao, nội dung và ngày đánh giá.
- [x] Thêm bộ lọc theo số sao và sản phẩm.
- [x] Thêm chức năng xóa đánh giá nếu nghiệp vụ quản trị cho phép.
- [x] Hiển thị trạng thái khi chưa có đánh giá.

### 3.9. Liên hệ

API:

- `GET /lien-he`
- `GET /lien-he/:id`
- `PUT /lien-he/:id`
- `DELETE /lien-he/:id`

- [x] Hiển thị email, số điện thoại, tiêu đề, nội dung và ngày gửi.
- [x] Xem chi tiết nội dung liên hệ.
- [x] Cập nhật trạng thái:
  - `ChuaXuLy`
  - `DangXuLy`
  - `DaXuLy`
- [x] Thêm lọc theo trạng thái.
- [x] Thêm tìm kiếm theo họ tên, email, tiêu đề.
- [x] Xóa liên hệ sau khi xác nhận.
- [x] Hiển thị badge màu theo trạng thái.

## 4. Chuẩn hóa API và TypeScript

- [x] Tạo type dùng chung cho `ApiResponse`, phân trang và lỗi API.
- [x] Hạn chế dùng `any` trong các page.
- [x] Tạo các file API riêng:
  - `product.api.ts`
  - `category.api.ts`
  - `brand.api.ts`
  - `order.api.ts`
  - `customer.api.ts`
  - `employee.api.ts`
  - `review.api.ts`
  - `contact.api.ts`
- [x] Tạo helper xử lý lỗi API thống nhất.
- [x] Hiển thị lỗi validation từ backend dưới đúng field trong form.
- [x] Chuẩn hóa việc định dạng số tiền, ngày tháng và trạng thái.
- [x] Kiểm tra response API không bị truy cập sai khi `data` rỗng.

## 5. UX và chất lượng giao diện

- [x] Thay `alert()` bằng `message` hoặc `notification` của Ant Design.
- [x] Thêm `Spin`, `Skeleton` hoặc trạng thái loading cho bảng.
- [x] Thêm `Empty` khi danh sách không có dữ liệu.
- [x] Disable nút trong lúc đang gửi request.
- [x] Chống gửi form nhiều lần.
- [x] Thêm Modal xác nhận khi xóa hoặc thao tác nguy hiểm.
- [x] Hiển thị lỗi kết nối rõ ràng.
- [x] Đảm bảo bảng có scroll ngang trên màn hình nhỏ.
- [x] Dùng tiếng Việt thống nhất trong toàn bộ giao diện.
- [x] Thêm title cho từng trang và breadcrumb nếu cần.

## 6. Bảo mật và cấu hình

- [x] Không commit file `.env`.
- [x] Cấu hình `VITE_API_URL` trong `.env` hoặc `.env.local`.
- [x] Không để mật khẩu mặc định trong giao diện production.
- [x] Kiểm tra quyền ở backend, không chỉ ẩn nút ở frontend.
- [x] Không hiển thị token trong giao diện hoặc log.
- [x] Xử lý logout khi API trả `401`.
- [ ] Điền domain admin production thật vào `CORS_ORIGINS` và kiểm tra khi triển khai (backend đã hỗ trợ allowlist).

## 7. Kiểm thử bắt buộc

Các mục chưa tích dưới đây cần chạy với tài khoản và API/MySQL thật. Bộ kiểm thử tự động dùng dữ liệu giả lập đã đạt; không thay thế kiểm thử tích hợp.

- [x] `npm run build` chạy thành công trong `FE/admin`.
- [ ] Đăng nhập đúng tài khoản Admin.
- [ ] Tài khoản Khách hàng không truy cập được admin.
- [ ] Tài khoản Nhân viên chỉ thấy chức năng được phép.
- [ ] Token hết hạn tự chuyển về trang đăng nhập.
- [ ] Thêm/sửa/xóa sản phẩm.
- [ ] Thêm/sửa/xóa danh mục.
- [ ] Thêm/sửa/xóa thương hiệu.
- [ ] Cập nhật trạng thái đơn hàng.
- [ ] Xem chi tiết đơn hàng.
- [ ] Khóa/mở khóa khách hàng.
- [ ] Thêm/sửa/xóa nhân viên theo đúng quyền.
- [ ] Cập nhật trạng thái liên hệ.
- [x] Kiểm tra giao diện desktop và mobile. (Chrome, API giả lập)
- [x] Kiểm tra các trạng thái loading, empty, error và success. (Chrome, API giả lập)

## 8. Thứ tự triển khai đề xuất

1. Tạo `AdminLayout`, sidebar và topbar dùng chung.
2. Hoàn thiện xác thực và phân quyền frontend.
3. Chuẩn hóa API client, type và xử lý lỗi.
4. Hoàn thiện Sản phẩm.
5. Hoàn thiện Danh mục và tạo Thương hiệu.
6. Hoàn thiện Đơn hàng và màn hình chi tiết.
7. Hoàn thiện Khách hàng và Nhân viên.
8. Hoàn thiện Đánh giá và Liên hệ.
9. Bổ sung loading, empty state, notification và responsive.
10. Build, kiểm thử toàn bộ và chuẩn bị cấu hình production.

## 9. Tiêu chí hoàn thành

FE admin được xem là hoàn thành khi:

- Mỗi màn hình có loading, empty, error và success state.
- Các thao tác CRUD quan trọng hoạt động với API thật.
- Quyền Admin/NhanVien được hiển thị và kiểm soát đúng.
- Không còn dữ liệu giả hoặc mã cố định như sản phẩm có mã `1`.
- Không còn `alert()` cho luồng nghiệp vụ chính.
- Không còn `any` ở các response chính.
- `npm run build` chạy thành công.
- Giao diện dùng tốt trên desktop và màn hình nhỏ.
