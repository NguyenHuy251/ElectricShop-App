# Công việc cần làm cho FE Admin

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

### Nửa B - Giao cho thành viên còn lại

#### Nền tảng dùng chung

- [ ] Tạo `AdminLayout`, `Sidebar`, `Topbar` dùng chung.
- [ ] Thay sidebar lặp lại trong từng page bằng layout chung.
- [ ] Dùng `NavLink` thay cho thẻ `<a>`.
- [ ] Tạo state xác thực tập trung và gọi `/auth/me`.
- [ ] Ẩn/hiện menu theo vai trò `Admin` và `NhanVien`.
- [ ] Xử lý logout, token hết hạn và responsive layout.

#### Nghiệp vụ vận hành

- [ ] Hoàn thiện Dashboard: loading, lỗi, biểu đồ và đơn mới nhất.
- [ ] Hoàn thiện Đơn hàng: tìm kiếm, lọc, xem chi tiết, cập nhật trạng thái và xóa.
- [ ] Hoàn thiện Khách hàng/Tài khoản: tìm kiếm, sửa, khóa/mở khóa, xóa.
- [ ] Hoàn thiện Nhân viên: thêm, sửa, xóa, lọc trạng thái và kiểm soát quyền Admin.
- [ ] Hoàn thiện Đánh giá: bỏ mã sản phẩm cố định `1`, chọn sản phẩm, lọc và quản trị.
- [ ] Hoàn thiện Liên hệ: xem chi tiết, lọc, tìm kiếm, đổi trạng thái và xóa.

#### Chất lượng và phát hành

- [ ] Tạo các file API và type dùng chung, giảm `any`.
- [ ] Thay `alert()` bằng `message`/`notification` của Ant Design.
- [ ] Bổ sung loading, empty state, error state và confirm Modal.
- [ ] Chuẩn hóa định dạng tiền, ngày và trạng thái.
- [ ] Kiểm thử quyền Admin/NhanVien, CRUD và responsive.
- [ ] Chạy `npm run build` và kiểm tra cấu hình `VITE_API_URL` trước khi merge.

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

- [ ] Tạo `AuthContext` hoặc cơ chế state tập trung cho user hiện tại.
- [ ] Gọi `/auth/me` sau khi khôi phục token để xác nhận token còn hợp lệ.
- [ ] Nếu user là `KhachHang`, không cho truy cập giao diện admin.
- [ ] Ẩn/hiện menu theo vai trò:
  - `Admin`: tài khoản, nhân viên, khách hàng, toàn bộ chức năng.
  - `NhanVien`: sản phẩm, danh mục, thương hiệu, đơn hàng, liên hệ, đánh giá.
- [ ] Xử lý trạng thái token hết hạn và chuyển về `/login`.
- [ ] Xóa cả `admin_token` và `admin_user` khi đăng xuất.
- [ ] Không lưu mật khẩu trong localStorage.

### 2.2. Chuẩn hóa layout quản trị

Hiện mỗi page tự lặp lại sidebar và topbar. Cần tạo layout dùng chung:

- [ ] Tạo `AdminLayout`.
- [ ] Tạo `Sidebar` dùng chung.
- [ ] Tạo `Topbar` dùng chung.
- [ ] Tạo menu bằng `NavLink` thay cho thẻ `<a>` để không reload toàn trang.
- [ ] Hiển thị tên và vai trò người đang đăng nhập.
- [ ] Thêm nút đăng xuất dùng chung.
- [ ] Hiển thị trạng thái loading khi chuyển trang.
- [ ] Tạo layout responsive cho màn hình tablet và mobile.
- [ ] Thêm menu thu gọn trên màn hình nhỏ.

## 3. Hoàn thiện từng màn hình

### 3.1. Dashboard

API: `GET /dashboard`

- [ ] Hiển thị tổng sản phẩm.
- [ ] Hiển thị tổng khách hàng.
- [ ] Hiển thị tổng nhân viên.
- [ ] Hiển thị tổng đơn hàng.
- [ ] Hiển thị doanh thu.
- [ ] Hiển thị số đơn theo trạng thái.
- [ ] Thêm biểu đồ doanh thu theo thời gian nếu backend cung cấp dữ liệu.
- [ ] Thêm danh sách đơn hàng mới nhất.
- [ ] Hiển thị trạng thái loading, lỗi và nút thử lại.
- [ ] Định dạng tiền theo chuẩn Việt Nam.

### 3.2. Sản phẩm

API:

- `GET /san-pham`
- `GET /san-pham/:id`
- `POST /san-pham`
- `PUT /san-pham/:id`
- `DELETE /san-pham/:id`

- [ ] Thêm bộ lọc theo tên, mã sản phẩm, danh mục, thương hiệu.
- [ ] Thêm phân trang theo `page`, `limit`, `totalPages`.
- [x] Thay ô nhập mã danh mục và mã thương hiệu bằng dropdown dữ liệu thật.
- [ ] Tạo form thêm sản phẩm bằng Modal hoặc Drawer.
- [x] Tạo form chỉnh sửa sản phẩm.
- [ ] Nhập đầy đủ thông tin chi tiết: công suất, dung tích, kích thước, màu sắc, xuất xứ, thông số khác.
- [ ] Thêm trường hình ảnh và preview ảnh.
- [x] Thêm xác nhận trước khi xóa.
- [ ] Không cho xóa sản phẩm nếu backend trả lỗi do ràng buộc đơn hàng.
- [ ] Hiển thị badge đúng theo trạng thái `DangBan`, `HetHang`, `NgungBan`.
- [ ] Thêm thông báo thành công/thất bại sau mỗi thao tác.

### 3.3. Danh mục

API:

- `GET /danh-muc`
- `POST /danh-muc`
- `PUT /danh-muc/:id`
- `DELETE /danh-muc/:id`

- [ ] Hiển thị danh sách bằng bảng có tìm kiếm.
- [x] Thêm danh mục.
- [x] Chỉnh sửa danh mục.
- [x] Xóa danh mục sau khi xác nhận.
- [x] Bật/tắt trạng thái danh mục.
- [ ] Xử lý lỗi khi danh mục đang được sản phẩm sử dụng.

### 3.4. Thương hiệu

Backend đã có API nhưng FE admin chưa có trang riêng.

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
- [ ] Xử lý lỗi thương hiệu đang được sản phẩm sử dụng.

### 3.5. Đơn hàng

API:

- `GET /don-hang`
- `GET /don-hang/:id`
- `PUT /don-hang/:id/trang-thai`
- `DELETE /don-hang/:id`

- [ ] Hiển thị tên tài khoản đặt hàng, người nhận, số điện thoại và địa chỉ.
- [ ] Hiển thị danh sách sản phẩm trong từng đơn.
- [ ] Tạo Drawer hoặc Modal xem chi tiết đơn hàng.
- [ ] Cập nhật trạng thái đơn hàng bằng các giá trị hợp lệ:
  - `ChoXacNhan`
  - `DaXacNhan`
  - `DangGiao`
  - `DaGiao`
  - `DaHuy`
- [ ] Không cho chuyển trạng thái tùy ý nếu nghiệp vụ yêu cầu luồng tuần tự.
- [ ] Thêm bộ lọc theo trạng thái.
- [ ] Thêm tìm kiếm theo mã đơn hoặc tên người nhận.
- [ ] Hiển thị tổng tiền đúng định dạng.
- [ ] Thêm xác nhận trước khi xóa đơn.
- [ ] Hiển thị thông báo sau khi cập nhật trạng thái.

### 3.6. Khách hàng và tài khoản

API tài khoản:

- `GET /tai-khoan`
- `GET /tai-khoan/:id`
- `PUT /tai-khoan/:id`
- `DELETE /tai-khoan/:id`

- [ ] Tách rõ danh sách khách hàng và danh sách tài khoản nếu cần.
- [ ] Thêm tìm kiếm theo tên, username, email, số điện thoại.
- [ ] Thêm phân trang.
- [ ] Xem chi tiết tài khoản.
- [ ] Chỉnh sửa họ tên, email, số điện thoại, địa chỉ.
- [ ] Khóa/mở khóa tài khoản bằng `trang_thai`.
- [ ] Không cho sửa/xóa tài khoản trái với quyền hiện tại.
- [ ] Cân nhắc chặn Admin tự xóa chính mình.
- [ ] Xác nhận trước khi xóa tài khoản.

### 3.7. Nhân viên

API:

- `GET /nhan-vien`
- `GET /nhan-vien/:id`
- `POST /nhan-vien`
- `PUT /nhan-vien/:id`
- `DELETE /nhan-vien/:id`

- [ ] Thêm form tạo nhân viên.
- [ ] Chỉnh sửa thông tin nhân viên.
- [ ] Xóa nhân viên sau khi xác nhận.
- [ ] Hiển thị chức vụ, ngày vào làm, lương, trạng thái.
- [ ] Thêm lọc `DangLam` và `NghiLam`.
- [ ] Chỉ `Admin` được thấy nút thêm, sửa, xóa.
- [ ] Kiểm tra liên kết giữa nhân viên và tài khoản.

### 3.8. Đánh giá

API hiện tại lấy đánh giá theo sản phẩm:

- `GET /danh-gia/san-pham/:ma_san_pham`

- [ ] Không cố định mã sản phẩm `1`.
- [ ] Thêm dropdown chọn sản phẩm.
- [ ] Hoặc bổ sung API backend lấy toàn bộ đánh giá có phân trang.
- [ ] Hiển thị tên người đánh giá, sản phẩm, số sao, nội dung và ngày đánh giá.
- [ ] Thêm bộ lọc theo số sao và sản phẩm.
- [ ] Thêm chức năng xóa đánh giá nếu nghiệp vụ quản trị cho phép.
- [ ] Hiển thị trạng thái khi chưa có đánh giá.

### 3.9. Liên hệ

API:

- `GET /lien-he`
- `GET /lien-he/:id`
- `PUT /lien-he/:id`
- `DELETE /lien-he/:id`

- [ ] Hiển thị email, số điện thoại, tiêu đề, nội dung và ngày gửi.
- [ ] Xem chi tiết nội dung liên hệ.
- [ ] Cập nhật trạng thái:
  - `ChuaXuLy`
  - `DangXuLy`
  - `DaXuLy`
- [ ] Thêm lọc theo trạng thái.
- [ ] Thêm tìm kiếm theo họ tên, email, tiêu đề.
- [ ] Xóa liên hệ sau khi xác nhận.
- [ ] Hiển thị badge màu theo trạng thái.

## 4. Chuẩn hóa API và TypeScript

- [ ] Tạo type dùng chung cho `ApiResponse`, phân trang và lỗi API.
- [ ] Hạn chế dùng `any` trong các page.
- [ ] Tạo các file API riêng:
  - `product.api.ts`
  - `category.api.ts`
  - `brand.api.ts`
  - `order.api.ts`
  - `customer.api.ts`
  - `employee.api.ts`
  - `review.api.ts`
  - `contact.api.ts`
- [ ] Tạo helper xử lý lỗi API thống nhất.
- [ ] Hiển thị lỗi validation từ backend dưới đúng field trong form.
- [ ] Chuẩn hóa việc định dạng số tiền, ngày tháng và trạng thái.
- [ ] Kiểm tra response API không bị truy cập sai khi `data` rỗng.

## 5. UX và chất lượng giao diện

- [ ] Thay `alert()` bằng `message` hoặc `notification` của Ant Design.
- [ ] Thêm `Spin`, `Skeleton` hoặc trạng thái loading cho bảng.
- [ ] Thêm `Empty` khi danh sách không có dữ liệu.
- [ ] Disable nút trong lúc đang gửi request.
- [ ] Chống gửi form nhiều lần.
- [ ] Thêm Modal xác nhận khi xóa hoặc thao tác nguy hiểm.
- [ ] Hiển thị lỗi kết nối rõ ràng.
- [ ] Đảm bảo bảng có scroll ngang trên màn hình nhỏ.
- [ ] Dùng tiếng Việt thống nhất trong toàn bộ giao diện.
- [ ] Thêm title cho từng trang và breadcrumb nếu cần.

## 6. Bảo mật và cấu hình

- [ ] Không commit file `.env`.
- [ ] Cấu hình `VITE_API_URL` trong `.env` hoặc `.env.local`.
- [ ] Không để mật khẩu mặc định trong giao diện production.
- [ ] Kiểm tra quyền ở backend, không chỉ ẩn nút ở frontend.
- [ ] Không hiển thị token trong giao diện hoặc log.
- [ ] Xử lý logout khi API trả `401`.
- [ ] Cấu hình CORS backend phù hợp với domain admin production.

## 7. Kiểm thử bắt buộc

- [ ] `npm run build` chạy thành công trong `FE/admin`.
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
- [ ] Kiểm tra giao diện desktop và mobile.
- [ ] Kiểm tra các trạng thái loading, empty, error và success.

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
