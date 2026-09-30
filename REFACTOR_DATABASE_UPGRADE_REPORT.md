# BÁO CÁO REFACTOR TOÀN BỘ PROJECT TƯƠNG THÍCH VỚI DATABASE MỚI
**Dự án:** Website & Mobile App Bán Đồ Điện Gia Dụng (`AppElectricShop`)  
**Tác giả:** Senior Full-Stack Engineer  
**Ngày hoàn thành:** 28/09/2026  

---

## 1. TỔNG QUAN & BỐI CẢNH DATABASE MỚI

Database của hệ thống đã được nâng cấp toàn diện về mô hình dữ liệu Thông số kỹ thuật (EAV / Specification System) và Thư viện hình ảnh sản phẩm (Multi-image Gallery). Bảng cũ `chi_tiet_san_pham` và các trường tĩnh như `thong_so_khac`, `cong_suat`, `dung_tich`, `kich_thuoc`, `mau_sac`, `xuat_xu` gom cục đã được loại bỏ hoàn toàn trong schema hoạt động.

### Mô hình quan hệ mới:
```
danh_muc (1) ────< (N) danh_muc_thong_so (N) >──── (1) thong_so (N) >──── (1) nhom_thong_so
                            │                               │
                            │                               ▼
                      (Validation)                 thong_so_san_pham (N)
                                                            │
                                                            ▼ (N)
                                                         san_pham (1)
                                                            │
                                                            ▼ (1)
                                                   hinh_anh_san_pham (N)
```

1. **`nhom_thong_so`**: Phân nhóm thông số (Thông tin chung, Thông số kỹ thuật, Kích thước - Khối lượng, Tiện ích - Tính năng, Xuất xứ & Bảo hành).
2. **`thong_so`**: Định nghĩa từng thông số kỹ thuật (`kieu_du_lieu`: TEXT, NUMBER, BOOLEAN, OPTION; `don_vi`, `cho_phep_loc`, `bat_buoc`, `thu_tu_hien_thi`).
3. **`danh_muc_thong_so`**: Bảng quan hệ N-N xác định danh mục nào được phép sử dụng những thông số nào.
4. **`thong_so_san_pham`**: Lưu giá trị thực tế của từng thông số cho từng sản phẩm cụ thể (`gia_tri`, `gia_tri_so`).
5. **`hinh_anh_san_pham`**: Quản lý nhiều ảnh cho mỗi sản phẩm (`duong_dan_anh`, `la_anh_chinh`, `thu_tu_hien_thi`).

---

## 2. DATABASE COMPATIBILITY

- **Các bảng mới đã tích hợp đầy đủ:**
  - `nhom_thong_so`
  - `thong_so`
  - `danh_muc_thong_so`
  - `thong_so_san_pham`
  - `hinh_anh_san_pham`
- **Bảng/field cũ đã loại bỏ:**
  - Loại bỏ hoàn toàn bảng `chi_tiet_san_pham`.
  - Loại bỏ trường đơn văn bản `thong_so_khac` và các cột spec tĩnh gắn cứng trong `san_pham`.
  - Giữ trường `san_pham.hinh_anh` đồng bộ tự động với ảnh chính (`la_anh_chinh = 1`) từ `hinh_anh_san_pham` để bảo toàn tương thích tuyệt đối cho các chức năng liên quan (Giỏ hàng, Chi tiết đơn hàng, Lịch sử mua hàng).

---

## 3. BACKEND REFACTORING (`BE`)

### 3.1. Types & Interfaces (`src/types/index.ts`)
- Định nghĩa các kiểu dữ liệu mới chuẩn hóa:
  - `SpecDataType = 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'OPTION'`
  - `SpecificationGroup`, `Specification`, `CategorySpecification`
  - `ProductSpecification`, `ProductImage`, `GroupedSpecification`
  - `CreateProductInput`, `UpdateProductInput`
  - Cập nhật interface `Product` loại bỏ `chi_tiet_san_pham`, bổ sung mảng `thong_so_ky_thuat?: ProductSpecification[]`, `danh_sach_hinh_anh?: ProductImage[]`, `hinh_anh_phu?: string[]`.

### 3.2. Service Layer
- **`src/services/thongSo.service.ts` (MỚI):**
  - `getNhomThongSo()`: Lấy danh sách nhóm thông số kèm số lượng thông số.
  - `getThongSoList(groupId?, categoryId?)`: Lấy danh sách thông số, có filter theo nhóm hoặc danh mục.
  - `getThongSoByCategoryId(categoryId)`: Gọi Stored Procedure `sp_thong_so_list_by_category`.
  - `getThongSoByProductId(productId)`: Gọi Stored Procedure `sp_thong_so_get_by_product`.
  - `validateProductSpecifications(categoryId, specifications)`: Kiểm tra hợp lệ từng thông số: tồn tại, thuộc danh mục cho phép, kiểu dữ liệu NUMBER/BOOLEAN/OPTION, chống trùng lặp `ma_thong_so`.
- **`src/services/sanPham.service.ts`:**
  - Refactor `createSanPham`: Gọi Stored Procedure `sp_san_pham_create` với 12 tham số chuẩn hóa, truyền JSON specifications (`p_thong_so_json`). Đồng thời ghi nhận danh sách hình ảnh vào `hinh_anh_san_pham`.
  - Refactor `updateSanPham`: Gọi Stored Procedure `sp_san_pham_update` với 13 tham số chuẩn hóa, cập nhật thông tin sản phẩm và thông số kỹ thuật. Đồng thời cập nhật hoặc thêm ảnh mới trong `hinh_anh_san_pham`.
  - Thêm các service quản lý hình ảnh riêng: `getImagesByProductId`, `addImage`, `deleteImage`, `setPrimaryImage`.

### 3.3. Controller Layer
- **`src/controllers/thongSo.controller.ts` (MỚI):**
  - Xử lý các endpoint danh sách nhóm thông số, danh sách thông số, thông số theo danh mục, thông số theo sản phẩm.
- **`src/controllers/sanPham.controller.ts`:**
  - `getSanPhamById`: Trả về dữ liệu chi tiết cấu trúc cao cấp bao gồm thông tin sản phẩm, `images` (danh sách ảnh), `specifications` (danh sách thông số nhóm theo group), và `category_specifications` phục vụ form chỉnh sửa của Admin.
  - `createSanPham` & `updateSanPham`: Hỗ trợ cả 2 định dạng đầu vào (`thong_so` hoặc `specifications`, `hinh_anh` hoặc `images`/`hinh_anh_phu`), chuẩn hóa dữ liệu số và validation trước khi lưu.
  - `getProductImages`, `addProductImage`, `deleteProductImage`, `setPrimaryProductImage`: API REST đầy đủ cho bộ sưu tập ảnh sản phẩm.

### 3.4. Routes Layer
- **`src/routes/thongSo.routes.ts` (MỚI):** Đăng ký routes `/nhom`, `/:id`, `/danh-muc/:id`, `/san-pham/:id`.
- **`src/routes/danhMuc.routes.ts`:** Bổ sung endpoint `/:id/thong-so` và `/:id/specifications`.
- **`src/routes/sanPham.routes.ts`:** Bổ sung endpoint `/:id/thong-so`, `/:id/hinh-anh`, `/:id/hinh-anh/:imageId`, `/:id/hinh-anh/:imageId/chinh`.
- **`src/app.ts`:** Mount alias đầy đủ: `/api/thong-so`, `/api/specifications`, `/api/san-pham`, `/api/products`.

---

## 4. FRONTEND ADMIN REFACTORING (`FE/admin`)

### 4.1. Product API Client (`src/api/product.api.ts`)
- Mở rộng API client:
  - `getCategorySpecifications(categoryId)`
  - `getProductSpecifications(productId)`
  - `getProductImages(productId)`
  - `addProductImage(productId, { duong_dan_anh, la_anh_chinh, thu_tu_hien_thi })`
  - `deleteProductImage(productId, imageId)`
  - `setPrimaryProductImage(productId, imageId)`

### 4.2. Quản lý Sản phẩm Động (`src/pages/ProductsPage.tsx`)
- **Tự động sinh form thông số theo danh mục:**
  - Khi Admin chọn hoặc đổi danh mục (ví dụ "Tủ lạnh", "Tivi", "Máy giặt"), form tự động gọi API lấy đúng danh mục thông số được định nghĩa trong database.
  - Hiển thị theo từng nhóm thông số (`nhom_thong_so.ten_nhom`).
  - Render input chuẩn xác theo `kieu_du_lieu`:
    - `NUMBER`: `<input type="number">` kèm hiển thị đơn vị đo (`don_vi`) từ database.
    - `BOOLEAN`: `<select>` (Có / Không).
    - `OPTION`: `<select>` với các tùy chọn được cấu hình.
    - `TEXT`: `<input type="text">`.
- **Quản lý đa hình ảnh (Multi-image Gallery):**
  - Thêm nhiều URL ảnh phụ.
  - Tùy chọn đặt ảnh đại diện chính (Primary image).
  - Xóa ảnh khỏi danh sách với preview trực quan.
  - Khi sửa sản phẩm, tự động load thư viện ảnh hiện tại từ database và cho phép thao tác trực tiếp.
- **Xem chi tiết sản phẩm (Detail Modal):**
  - Hiển thị đầy đủ gallery ảnh sản phẩm.
  - Hiển thị thông số kỹ thuật phân theo từng group chuyên nghiệp.

---

## 5. FRONTEND MOBILE REFACTORING (`FE/Mobile`)

### 4.3. Quản lý Danh mục Thông số Kỹ thuật (`src/pages/CategorySpecificationsPage.tsx` - MỚI)
- **Quản lý toàn diện bảng quan hệ `danh_muc_thong_so`:**
  - Chọn danh mục để xem toàn bộ danh sách thông số kỹ thuật được cấu hình cho danh mục đó.
  - Thẻ tóm tắt hiển thị tổng số thông số, số lượng thông số bắt buộc / tùy chọn theo từng nhóm.
  - Gán thông số từ thư viện có sẵn hoặc tạo mới thông số và gán ngay cho danh mục chỉ bằng 1 thao tác.
  - Bật/tắt trạng thái bắt buộc nhập (`bat_buoc`) trực tiếp bằng Switch trên bảng, cập nhật ngay lập tức vào database.
  - Tùy chỉnh thứ tự hiển thị (`thu_tu_hien_thi`) của thông số trong danh mục.
  - Xóa thông số khỏi danh mục với xác nhận an toàn.
  - Nút chuyển nhanh "Cấu hình thông số" được tích hợp ngay trên từng dòng trong trang Quản lý Danh mục (`CategoriesPage`).
- **Quản lý Thư viện Thông số kỹ thuật (`thong_so`):**
  - Tìm kiếm, lọc thông số theo nhóm, thêm mới, sửa, xóa/ẩn thông số.
- **Quản lý Nhóm thông số (`nhom_thong_so`):**
  - Xem, thêm mới, sửa tên nhóm và thứ tự hiển thị nhóm.

---

### 5.1. Types (`types/index.ts`)
- Bổ sung `ProductSpecification`, `ProductImage`, `GroupedSpecification`.
- Cập nhật interface `Product`.

### 5.2. Màn hình Chi tiết Sản phẩm (`app/product/[id].tsx`)
- **Bộ sưu tập hình ảnh (Gallery):**
  - Hiển thị ảnh chính kích thước lớn.
  - Hàng thumbnail ảnh phụ cho phép bấm chuyển ảnh mượt mà, viền active nổi bật.
- **Bảng Thông số kỹ thuật theo Nhóm (Grouped Specs Table):**
  - Nhóm trực quan theo từng phần: Thông tin chung, Thông số kỹ thuật, Kích thước - Khối lượng, v.v.
  - Tự động hiển thị kèm đơn vị đo (`W`, `L`, `kg`, `inch`, `cm`...).

---

## 6. KẾT QUẢ KIỂM THỬ (TEST RESULTS)

| Hạng mục kiểm thử | Trạng thái | Ghi chú |
|---|---|---|
| **Backend TypeScript Build** |  PASS | `tsc -p tsconfig.json` biên dịch thành công 100% |
| **Backend Unit Tests** |  PASS | 22/22 unit tests đạt (`node --test tests/*.test.mjs`) |
| **Frontend Admin Build** |  PASS | Vite build thành công không lỗi type (bao gồm `CategorySpecificationsPage`) |
| **Frontend Mobile Type Check** |  PASS | `npx tsc --noEmit` hoàn thành không lỗi |
| **API Thông số theo Danh mục** |  PASS | `GET /api/danh-muc/:id/thong-so` trả về thông số theo danh mục |
| **API Thao tác Danh mục Thông số** |  PASS | `POST/PUT/DELETE /api/danh-muc/:id/thong-so` hỗ trợ gán, sửa, xóa quan hệ |
| **API Quản lý Thông số & Nhóm** |  PASS | `POST/PUT/DELETE /api/thong-so` và `/api/thong-so/nhom` hoạt động chuẩn |
| **API Nhóm Thông số** |  PASS | `GET /api/thong-so/nhom` trả về 5 nhóm chuẩn |
| **API Chi tiết Sản phẩm** |  PASS | `GET /api/san-pham/:id` trả về cấu trúc gồm `specifications` & `images` |
| **API Tạo Sản phẩm Mới** |  PASS | `POST /api/san-pham` tạo thành công kèm specs và nhiều ảnh |
| **Toàn vẹn Giỏ hàng & Đơn hàng** |  PASS | Chức năng đặt hàng, cập nhật trạng thái đơn, hủy đơn hoạt động bình thường |

---

## 7. DANH SÁCH TẤT CẢ CÁC TỆP ĐÃ THAY ĐỔI

### Backend (`BE/`):
1. `BE/src/types/index.ts`
2. `BE/src/services/thongSo.service.ts` *(Mới - Bổ sung CRUD danh_muc_thong_so, thong_so, nhom_thong_so)*
3. `BE/src/controllers/thongSo.controller.ts` *(Mới - Bổ sung controller actions cho danh_muc_thong_so và thong_so)*
4. `BE/src/routes/thongSo.routes.ts` *(Mới - Bổ sung routes quản lý thong_so và nhom)*
5. `BE/src/services/sanPham.service.ts`
6. `BE/src/controllers/sanPham.controller.ts`
7. `BE/src/routes/sanPham.routes.ts`
8. `BE/src/routes/danhMuc.routes.ts` *(Bổ sung endpoint POST/PUT/DELETE cho :id/thong-so)*
9. `BE/src/app.ts`
10. `BE/tests/admin.test.mjs`

### Frontend Admin (`FE/admin/`):
11. `FE/admin/src/types/index.ts`
12. `FE/admin/src/api/product.api.ts`
13. `FE/admin/src/api/specification.api.ts` *(Mới - API client cho danh mục thông số, thông số, nhóm)*
14. `FE/admin/src/pages/ProductsPage.tsx`
15. `FE/admin/src/pages/CategorySpecificationsPage.tsx` *(Mới - Giao diện quản lý Danh mục Thông số chuyên nghiệp)*
16. `FE/admin/src/pages/CategoriesPage.tsx` *(Thêm cột nút Cấu hình thông số)*
17. `FE/admin/src/components/Sidebar.tsx` *(Thêm menu Danh mục thông số)*
18. `FE/admin/src/App.tsx` *(Đăng ký route /category-specifications và /specifications)*
19. `FE/admin/tests/fixtures.ts`

### Frontend Mobile (`FE/Mobile/`):
20. `FE/Mobile/types/index.ts`
21. `FE/Mobile/app/product/[id].tsx`

### Tài liệu báo cáo:
22. `REFACTOR_DATABASE_UPGRADE_REPORT.md` *(Tệp báo cáo tổng kết này)*

---

## 8. BỔ SUNG THANH TOÁN VÀ ĐÁNH GIÁ MOBILE (30/09/2026)

### Quy trình thanh toán COD
- Hỗ trợ giỏ hàng và mua ngay một sản phẩm; mua ngay giữ nguyên giỏ hàng.
- Kiểm tra thông tin nhận hàng, lấy lại báo giá và tồn kho trước bước xác nhận. Giá hoặc giỏ thay đổi phải được khách kiểm tra lại; tổng tiền do backend tính.
- Khóa thao tác khi đang kiểm tra/gửi, lưu yêu cầu trước khi gửi và dùng lại mã yêu cầu khi mất phản hồi để tránh tạo đơn trùng.
- Lỗi xóa dữ liệu tạm trên thiết bị sau khi server xác nhận không biến đơn thành thất bại. Màn hình kết quả phản ánh đơn đã giao/đã hủy khi khôi phục yêu cầu cũ.
- Đặt hàng thành công không đồng nghĩa đã thanh toán. Hiện chỉ triển khai COD, chưa tích hợp thanh toán online hay đối soát tiền thu hộ.

### Quy trình đánh giá
- Chỉ chủ đơn `DaGiao` được đánh giá sản phẩm thuộc đơn; backend từ chối đơn chưa giao, đã hủy, đơn không thuộc người dùng hoặc sản phẩm không thuộc đơn.
- Mỗi tài khoản có một đánh giá cho mỗi sản phẩm; cho phép sửa đánh giá của mình. Chọn 1–5 sao, nhận xét tùy chọn tối đa 2.000 ký tự.
- Khôi phục đánh giá đã lưu nếu gửi thành công nhưng mất phản hồi. Chi tiết đơn tải lại khi quay về màn hình và hỗ trợ kéo xuống cập nhật.
- API trả `can_review` để mobile chỉ hiển thị thao tác đúng điều kiện, kể cả khi nhân viên xem đơn khách khác.

### Kiểm chứng và giới hạn
- Backend build và 24 kiểm thử tự động đạt; có kiểm thử điều kiện đánh giá theo từng trạng thái, quyền sở hữu và cập nhật nội dung.
- Mobile `npx tsc --noEmit` đạt; ESLint các tệp mobile thay đổi đạt.
- Đã thử chạy kiểm thử tích hợp bằng MySQL riêng, nhưng kết nối bị từ chối (`ER_ACCESS_DENIED_ERROR`). Chưa xác minh giao dịch với MySQL thực tế và chưa chạy giao diện trên thiết bị.
- Không thay đổi schema cho đợt bổ sung này. Database cũ cần bảng `checkout_requests` theo hướng dẫn `BE/CHECKOUT.md`; không chạy lại script tạo database trên dữ liệu đang sử dụng.

### Kịch bản kiểm tra trên thiết bị
1. Đặt COD từ giỏ và mua ngay, kiểm tra địa chỉ/số điện thoại sai, giá/tồn kho thay đổi, bấm gửi nhiều lần và mất mạng sau khi gửi.
2. Kiểm tra cùng yêu cầu chỉ trả một mã đơn, tồn kho trừ một lần; mua ngay không xóa giỏ.
3. Đơn chờ xác nhận được hủy, hoàn tồn kho; đơn đã xác nhận không có thao tác hủy của khách.
4. Đơn chưa giao/đã hủy không có nút đánh giá. Sau khi nhân viên chuyển đúng luồng sang đã giao, kéo xuống làm mới để đánh giá.
5. Gửi 1–5 sao, sửa nội dung, mở lại đơn và trang sản phẩm; đánh giá được giữ, không tạo bản ghi trùng khi mua cùng sản phẩm ở đơn khác.

## 9. KHẮC PHỤC API KHÔNG TẢI DỮ LIỆU (30/09/2026)

- Sau khi cập nhật thông tin MySQL trong `BE/.env`, đã tải lại backend để nhận cấu hình mới.
- Database chỉ có 8 procedure của phần nâng cấp sản phẩm; bổ sung 49 procedure còn thiếu và sửa collation tham số của `sp_san_pham_list`, `sp_san_pham_find_by_code` cho khớp cột sản phẩm. Không xóa hay tạo lại dữ liệu bảng.
- Thêm `BE/scripts/repair-procedures.mjs`: chạy không có tham số để xem kế hoạch; thêm `--apply` để thực hiện. Script lưu SQL hoàn tác trong thư mục tạm `electric-procedures-*`, chỉ tạo procedure thiếu và sửa hai procedure tìm kiếm khi cần. Chạy lại sau sửa trả danh sách thao tác rỗng.
- Kiểm tra qua địa chỉ LAN `192.168.1.11:3000`: API danh sách sản phẩm, tìm kiếm Samsung, chi tiết sản phẩm, danh mục và thương hiệu đều trả HTTP 200 với dữ liệu.
- Đã chạy lại kiểm thử với MySQL riêng sau khi kết nối được: **36/36 đạt**, không bỏ qua kiểm thử tích hợp. Bổ sung procedure chi tiết đơn vào database kiểm thử để kiểm tra quyền xem đơn đúng thực tế.
- Mobile đã cấu hình API theo IP LAN hiện tại; cần tải lại ứng dụng đang mở. Chưa kiểm chứng trực tiếp giao diện trên điện thoại.
