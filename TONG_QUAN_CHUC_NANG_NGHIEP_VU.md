# TỔNG QUAN CHỨC NĂNG VÀ NGHIỆP VỤ HỆ THỐNG ELECTRIC SHOP

> **Dự án:** Ứng dụng Quản lý & Kinh doanh Thiết bị Điện Gia Dụng (**ElectricShop**)  
> **Kiến trúc:** 3 tầng (3-Tier Architecture)  
> - **Backend (BE):** Node.js, Express, TypeScript, MySQL 8+  
> - **Web Quản trị (Admin):** React, Vite, Ant Design, TypeScript  
> - **Ứng dụng Di động (Mobile App):** React Native, Expo Router, TypeScript  

---

## 1. TỔNG QUAN HỆ THỐNG & ĐỐI TƯỢNG SỬ DỤNG

Hệ thống **ElectricShop** được xây dựng nhằm cung cấp giải pháp toàn diện cho việc kinh doanh thiết bị điện gia dụng, kết hợp giữa nền tảng ứng dụng di động cho khách hàng và cổng web quản trị vận hành dành cho ban quản trị và nhân viên cửa hàng.

### Các nhóm đối tượng sử dụng:
1. **Khách hàng (Customer / Người dùng App Mobile):** Khám phá sản phẩm, lựa chọn thông số/biến thể (công suất, màu sắc, dung tích), quản lý giỏ hàng, áp dụng voucher, đặt hàng thanh toán COD, theo dõi tiến trình đơn hàng, lưu sổ địa chỉ, nhận thông báo và viết đánh giá sản phẩm.
2. **Nhân viên (Staff / Nhân viên cửa hàng):** Sử dụng Web Admin để tiếp nhận và xử lý vòng đời đơn hàng, lập phiếu nhập kho, hỗ trợ giải đáp liên hệ của khách hàng, theo dõi tồn kho và in phiếu giao hàng.
3. **Quản trị viên (Admin / Chủ cửa hàng):** Toàn quyền kiểm soát hệ thống: quản lý danh mục, thương hiệu, cấu hình thông số kỹ thuật động, quản lý sản phẩm và biến thể, phát hành mã giảm giá, quản trị nhân sự/tài khoản, xem báo cáo doanh thu và xuất dữ liệu Excel.

---

## 2. PHÂN HỆ KHÁCH HÀNG - ỨNG DỤNG DI ĐỘNG (MOBILE APP)

Ứng dụng di động được thiết kế trên nền tảng **React Native & Expo Router**, tối ưu hóa trải nghiệm mua sắm trên thiết bị cầm tay với cấu trúc điều hướng hiện đại:

### 2.1. Thanh điều hướng chính (Bottom Tab Bar - 4 Tab)
- **Trang chủ (`index`):**
  - Banner giới thiệu thương hiệu và thông điệp dịch vụ.
  - Phím tắt truy cập nhanh danh mục **Voucher khuyến mãi**.
  - Thanh tìm kiếm sản phẩm nhanh.
  - Lưới sản phẩm mới nhất kèm nhãn tình trạng tồn kho, giá bán và đánh giá.
- **Sản phẩm (`products`):**
  - Danh mục bộ lọc theo nhóm thiết bị (Tủ lạnh, Máy giặt, Điều hòa, Nồi cơm, Quạt,...).
  - Tìm kiếm sản phẩm theo từ khóa tên hoặc mã sản phẩm.
  - Tùy chọn sắp xếp theo giá tăng/giảm, tên sản phẩm.
- **Giỏ hàng (`cart`):**
  - Danh sách mặt hàng đã thêm, phân biệt chi tiết từng biến thể (màu sắc, công suất).
  - Tăng/giảm số lượng trực tiếp với cơ chế kiểm tra giới hạn tồn kho tức thì.
  - Chọn lọc từng món hàng muốn đặt hoặc chọn tất cả.
  - Hiển thị tổng tiền tạm tính và nút điều hướng tới màn hình thanh toán.
- **Tài khoản (`profile`):**
  - Hiển thị thông tin cá nhân (Họ tên, Email, Số điện thoại, Địa chỉ giao hàng) và chỉnh sửa thông tin.
  - Nhóm chức năng mua sắm: **Đơn hàng của tôi**, **Voucher của tôi**, **Giỏ hàng**.
  - Nhóm chức năng tương tác: **Gửi liên hệ cho cửa hàng**, **Phản hồi của tôi**.
  - Nhóm bảo mật: **Đổi mật khẩu**, **Đăng xuất**.

**Quên mật khẩu:** tại màn hình đăng nhập mobile, bấm **Quên mật khẩu?**, nhập email và số điện thoại đã đăng ký cùng một tài khoản khách hàng đang hoạt động. Khi thông tin khớp, hệ thống đặt mật khẩu thành `12345678`, hiển thị mật khẩu mới và nút **Đăng nhập ngay**, đồng thời thu hồi mọi phiên cũ. Sai thông tin không làm thay đổi mật khẩu. API `POST /api/auth/forgot-password` giới hạn 5 yêu cầu/15 phút theo IP; không đặt lại tài khoản Admin/Nhân viên bằng luồng này.

### 2.2. Chi tiết sản phẩm & Bộ chọn biến thể đa tầng thông minh (`product/[id]`)
- **Hiển thị sản phẩm:** Hình ảnh chất lượng cao hỗ trợ chế độ xem phóng to (Zoom Modal), giá bán, tình trạng còn hàng/hết hàng, chính sách bảo hành chính hãng.
- **Cơ chế chọn biến thể đa tầng (Variant Selector):**
  - Tách bạch thông minh các thuộc tính biến thể: **Công suất / Dung tích** và **Màu sắc**.
  - Ràng buộc logic động: Khi người dùng chọn một mức công suất cụ thể, hệ thống tự động lọc và làm mờ/vô hiệu hóa các phiên bản màu sắc không tương thích hoặc đã hết hàng.
  - Hiển thị giá bán và tồn kho biến đổi theo biến thể đang được chọn.
- **Hành động mua sắm:**
  - **Thêm vào giỏ hàng:** Lưu sản phẩm kèm biến thể đã chọn vào cơ sở dữ liệu.
  - **Mua ngay (Buy Now):** Điều hướng trực tiếp sang màn hình thanh toán cho mặt hàng và biến thể được chọn mà không ảnh hưởng giỏ hàng hiện tại.
- **Bảng thông số kỹ thuật chi tiết:** Hiển thị toàn bộ nhóm thông số kỹ thuật đặc thù theo danh mục (kích thước, xuất xứ, công nghệ inverter, điện năng tiêu thụ,...).
- **Khu vực đánh giá & nhận xét:** Hiển thị số sao trung bình và các nhận xét từ những người mua thực tế đã nhận hàng.

### 2.3. Quy trình Đặt hàng & Thanh toán (`checkout`)
- **Sổ địa chỉ giao hàng:** Cho phép chọn nhanh địa chỉ mặc định, chọn từ danh sách sổ địa chỉ đã lưu hoặc nhập trực tiếp thông tin người nhận mới (Họ tên, SĐT, Địa chỉ).
- **Áp dụng Mã giảm giá (Voucher):**
  - Mở danh sách voucher khả dụng của cửa hàng.
  - Tự động kiểm tra điều kiện áp dụng (giá trị đơn hàng tối thiểu, lượt sử dụng còn lại, hạn sử dụng).
  - Hiển thị rõ số tiền được giảm trừ trực tiếp vào đơn hàng.
- **Phí vận chuyển:** Tự động tính toán theo cấu hình hệ thống và hỗ trợ chính sách miễn phí vận chuyển khi đơn hàng đạt ngưỡng giá trị quy định.
- **Phương thức thanh toán:** Hỗ trợ linh hoạt: Thanh toán khi nhận hàng (COD), Chuyển khoản ngân hàng, Tiền mặt.
- **Chống đặt trùng (Idempotency):** Cơ chế khóa request ngăn chặn việc người dùng nhấn liên tiếp nhiều lần gây trùng lặp đơn hàng.

### 2.4. Quản lý Đơn hàng (`orders` & `order/[id]`)
- **Danh sách đơn hàng (`orders`):**
  - Phân loại đơn hàng theo các tab trạng thái: **Tất cả**, **Chờ xác nhận**, **Đã xác nhận**, **Đang giao**, **Đã giao**, **Đã hủy**.
  - Mỗi đơn hiển thị mã đơn, ngày đặt, địa chỉ, tổng tiền thanh toán và trạng thái xử lý.
  - Cho phép khách hàng chủ động **Hủy đơn hàng** trực tiếp khi đơn đang ở trạng thái *Chờ xác nhận* (hệ thống tự động hoàn lại tồn kho nguyên tử).
- **Chi tiết & Tiến trình đơn hàng (`order/[id]`)**:
  - Dòng thời gian tiến trình đơn hàng trực quan từng bước (● Chờ xác nhận ➔ ● Đã xác nhận ➔ ● Đang giao ➔ ● Đã giao).
  - **Xác nhận đã nhận hàng:** Khi đơn đang giao, người đặt đơn bấm nút và xác nhận trong hộp thoại để chuyển đơn sang *Đã giao*, mở quyền đánh giá. Backend kiểm tra chủ đơn và trạng thái trong giao dịch có khóa; xác nhận lặp không tạo cập nhật trùng. Web Admin không được chuyển đơn trực tiếp sang *Đã giao*.
  - Chi tiết từng sản phẩm, biến thể, đơn giá, số lượng và thành tiền.
  - Nút **Xem chi tiết sản phẩm** mở/thu gọn thông tin ngay trong đơn: mã sản phẩm, SKU biến thể, danh mục, thương hiệu, bảo hành và thông số kỹ thuật của đúng biến thể đã chọn. Thông tin danh mục/thông số được ghi rõ là dữ liệu hiện tại; số lượng và giá lấy từ đơn hàng. Sản phẩm không còn trong danh mục vẫn hiển thị thông tin đã đặt.
  - **Viết đánh giá sản phẩm:** Khi đơn hàng đạt trạng thái *Đã giao*, hệ thống kích hoạt form chấm điểm sao (1 - 5 sao) và viết nhận xét thực tế cho từng sản phẩm trong đơn.

### 2.5. Tiện ích tài khoản & Tương tác khách hàng
- **Sổ địa chỉ (`account-tools`):** Thêm mới nhiều địa chỉ giao hàng, chỉnh sửa, xóa và thiết lập một địa chỉ làm mặc định.
- **Hộp thư thông báo (`account-tools`):** Nhận thông báo tự động theo thời gian thực mỗi khi đơn hàng được tạo mới, khi đơn hàng thay đổi trạng thái vận chuyển, hoặc khi cửa hàng phản hồi tin nhắn liên hệ.
- **Kênh liên hệ hỗ trợ (`contact` & `contact-history`):** Khách hàng gửi yêu cầu tư vấn/khiếu nại bảo hành; theo dõi lịch sử và đọc nội dung phản hồi trực tiếp từ nhân viên cửa hàng.
  - Liên hệ gửi với phiên đăng nhập được gắn tài khoản từ token; danh sách *Phản hồi của tôi* chỉ trả liên hệ của chính tài khoản đó.
  - Gửi thành công giữ nguyên trang, xóa toàn bộ ô nhập và hiện thông báo thành công cùng nút xem phản hồi; khi gửi lỗi giữ lại nội dung để thử lại.
  - Khi Web Admin trả lời, trạng thái và nội dung phản hồi lưu trong cùng một cập nhật; trigger tạo thông báo cho người gửi khi nội dung trả lời thay đổi. Mobile kiểm tra thông báo mỗi 15 giây khi ứng dụng ở foreground, hiện banner **Xem phản hồi** và đánh dấu đã đọc khi mở/đóng. Trang phản hồi tự tải lại khi mở, khi quay lại ứng dụng và mỗi 15 giây lúc đang xem. Đây là thông báo trong ứng dụng, không phải push khi ứng dụng đã đóng.

---

## 3. PHÂN HỆ QUẢN TRỊ & VẬN HÀNH - WEB ADMIN

Giao diện quản trị xây dựng bằng **React (Vite) + Ant Design**, thiết kế hiện đại, bố cục khoa học phục vụ tác vụ quản lý dữ liệu lớn:

### 3.1. Bảng điều khiển tổng quan (Dashboard)
- Thống kê các chỉ số kinh doanh then chốt (KPI): Tổng doanh thu, Tổng số đơn hàng, Đơn chờ xử lý, Tổng sản phẩm đang bán.
- Biểu đồ phân tích doanh thu theo thời gian thực.
- Bảng danh sách đơn hàng mới cần xử lý gấp và thông báo tồn kho.

### 3.2. Quản lý Sản phẩm & Biến thể (`ProductsPage`)

**Dữ liệu mẫu mở rộng:** chạy `npm run seed:options` trong `BE` để thêm 5 biến thể cho mỗi sản phẩm hiện có và bổ sung tối thiểu 6 thông số theo danh mục. Biến thể cùng màu được phân biệt bằng công suất, dung tích, khối lượng hoặc thông số phù hợp từng loại thiết bị. Giá, số lượng và thông số mới là dữ liệu giả lập, không phải thông số do nhà sản xuất xác nhận. Script lưu bản sao trước thay đổi trong `BE/logs`, giữ nguyên biến thể/thông số cũ và tránh tạo trùng SKU khi chạy lại.

Chạy `npm run seed:specifications` để bổ sung lên 10 thông số cho mỗi sản phẩm và cập nhật thông số chung vào các biến thể, giữ nguyên màu/công suất/dung tích riêng, giá và tồn kho. Dữ liệu bổ sung phục vụ minh họa; bản sao trước thay đổi được lưu trong `BE/logs`.
- **Quản lý danh sách:** Tìm kiếm sản phẩm theo tên/mã code, lọc theo danh mục, thương hiệu, trạng thái bán (Đang bán, Hết hàng, Ngừng bán).
- **Thêm mới / Chỉnh sửa sản phẩm:**
  - Thông tin cơ bản: Tên sản phẩm, mã SKU/Code, danh mục, thương hiệu, giá nhập, giá bán, bảo hành, mô tả chi tiết.
  - Quản lý đa hình ảnh: Upload nhiều ảnh sản phẩm, chọn ảnh đại diện chính (`la_anh_chinh`), sắp xếp thứ tự hiển thị.
  - **Hệ thống thông số kỹ thuật động:** Khi chọn danh mục, form tự động nạp các trường thông số tương ứng (TEXT, NUMBER có đơn vị đo, BOOLEAN Có/Không, OPTION).
- **Quản lý Biến thể sản phẩm:**
  - Thêm không giới hạn biến thể cho từng sản phẩm.
  - Tự động sinh mã SKU chuẩn theo cú pháp `${MA_CODE}-${TEN_BIEN_THE}`.
  - Thiết lập giá bán và số lượng tồn kho riêng biệt cho từng biến thể.
  - **Cấu hình thông số kỹ thuật riêng cho từng biến thể:** Nhập màu sắc, xuất xứ, công suất,... riêng cho từng biến thể, cho phép nhập tự do có dấu cách và ký tự tiếng Việt.
  - Đồng bộ tự động tổng tồn kho sản phẩm cha theo tổng các biến thể con.

### 3.3. Quản lý Danh mục & Thương hiệu (`CategoriesPage`, `BrandsPage`)
- Quản lý cây danh mục thiết bị gia dụng (Tủ lạnh, Máy giặt, Điều hòa, Bếp điện, Quạt điện,...).
- Quản lý đối tác thương hiệu và quốc gia xuất xứ (Samsung, Panasonic, LG, Daikin, Bosch, Sunhouse,...).

### 3.4. Quản lý Cấu hình Thông số kỹ thuật (`SpecificationsPage`)
- **Nhóm thông số (`nhom_thong_so`):** Phân nhóm logic như *Thông tin cơ bản*, *Kích thước và năng lực*, *Điện năng và hiệu suất*, *Công nghệ*, *Vận hành và an toàn*.
- **Thông số kỹ thuật (`thong_so`):** Định nghĩa tên thông số, kiểu dữ liệu (TEXT, NUMBER, BOOLEAN, OPTION), đơn vị đo chuẩn (W, L, kg, BTU, inch, cm,...), bật/tắt cờ cho phép dùng để lọc sản phẩm.
- **Gán thông số theo Danh mục (`danh_muc_thong_so`):** Thiết lập danh mục nào cần các thông số kỹ thuật nào, quy định trường nào là bắt buộc nhập, thứ tự hiển thị ưu tiên trên giao diện.

### 3.5. Quản lý & Xử lý Đơn hàng (`OrdersPage`)
- Danh sách đơn hàng toàn hệ thống với bộ lọc theo trạng thái, ngày đặt, khách hàng.
- **Chi tiết sản phẩm trong đơn:** Hiển thị ảnh và cho mở/thu gọn từng dòng sản phẩm để xem biến thể đã đặt, số lượng, đơn giá, thành tiền cùng mã sản phẩm/SKU, thương hiệu, danh mục, bảo hành và thông số hiện tại. Nhân viên có quyền Đơn hàng được xem trực tiếp, không cần quyền quản lý danh mục sản phẩm.
- **Quy trình duyệt đơn nghiêm ngặt:** Chuyển trạng thái theo đúng luồng nghiệp vụ:
  $$\text{Chờ xác nhận} \longrightarrow \text{Đã xác nhận} \longrightarrow \text{Đang giao} \longrightarrow \text{Đã giao}$$
  hoặc **Hủy đơn** ở giai đoạn thích hợp.
  Bước chuyển từ *Đang giao* sang *Đã giao* chỉ do người đặt đơn xác nhận đã nhận hàng trên Mobile; Web Admin chỉ xác nhận đơn, bắt đầu giao hoặc hủy theo luồng cho phép.
- **In phiếu giao hàng:** Tạo mẫu phiếu in chuyên nghiệp hiển thị đầy đủ thông tin khách hàng, số điện thoại, địa chỉ, bảng chi tiết sản phẩm/biến thể và tổng thanh toán COD.
- **Xuất báo cáo Excel:** Xuất toàn bộ dữ liệu đơn hàng phục vụ công tác kế toán và đối soát.

### 3.6. Vận hành Kho & Quản lý Nhập hàng (`ShopOperationsPage`)
- **Lập phiếu nhập kho:**
  - Chọn sản phẩm hoặc biến thể sản phẩm cụ thể cần nhập.
  - Nhập số lượng hàng thực tế và ghi chú nguồn hàng.
  - Hệ thống ghi nhận tài khoản nhân viên lập phiếu và tự động cộng dồn tồn kho.
- **Lịch sử nhập kho:** Tra cứu toàn bộ các đợt nhập hàng đã thực hiện kèm thời gian chính xác.

### 3.7. Báo cáo & Phân tích (`ReportsPage`)
- **Cảnh báo tồn kho thấp (Low Stock Alert):** Tự động phát hiện và cảnh báo các sản phẩm hoặc biến thể có số lượng tồn dưới ngưỡng an toàn để kịp thời lên kế hoạch nhập hàng.
- Báo cáo thống kê sản phẩm bán chạy nhất (Top Sellers).
- Báo cáo doanh số bán hàng theo khoảng ngày tùy chọn.

### 3.8. Quản lý Mã giảm giá / Voucher (`VouchersPage`)
- Thiết lập mã code khuyến mãi (VD: `SALE50K`, `TRIAN100K`).
- Cấu hình số tiền giảm giá cố định.
- Thiết lập điều kiện giá trị đơn hàng tối thiểu để được áp dụng.
- Cấu hình tổng số lượt phát hành và thời hạn hiệu lực (Ngày bắt đầu - Ngày kết thúc).
- Công tắc bật/tắt kích hoạt voucher tức thì.

### 3.9. Quản trị Tài khoản & Nhân sự (`AccountsPage`, `EmployeesPage`)
- **Quản lý tài khoản:** Danh sách tài khoản người dùng, phân quyền vai trò (**Admin**, **NhanVien**, **KhachHang**), chức năng khóa/mở khóa tài khoản an toàn (ngăn chặn Admin tự khóa chính mình).
- **Quản lý nhân viên:** Quản lý hồ sơ nhân viên nội bộ, chức vụ, mức lương, ngày vào làm, trạng thái công tác (Đang làm, Nghỉ làm) và liên kết với tài khoản hệ thống tương ứng.

### 3.10. Kiểm duyệt Đánh giá & Hỗ trợ Khách hàng (`ReviewsPage`, `ContactsPage`)
- **Kiểm duyệt Đánh giá:** Quản lý toàn bộ phản hồi, số sao đánh giá sản phẩm của người dùng; quyền xóa các nhận xét mang tính spam hoặc vi phạm quy chuẩn.
- **Chăm sóc khách hàng (Hộp thư liên hệ):** Tiếp nhận các câu hỏi, phản ánh của khách hàng; soạn nội dung phản hồi chính thức; cập nhật trạng thái đã phản hồi và kích hoạt thông báo tự động tới app của khách.

### 3.11. Phân quyền tích hợp trong tab Nhân viên (`EmployeesPage`)
- Admin mở tab **Nhân viên**, bấm **Phân quyền** ngay trên hồ sơ đã liên kết tài khoản; form cấu hình mở tại chỗ và cột **Quyền nghiệp vụ** cập nhật sau khi lưu.
- Nút **Phân quyền tài khoản** cho phép chọn mọi tài khoản nhân viên, kể cả tài khoản chưa liên kết hồ sơ. Không có menu Phân quyền riêng; đường dẫn cũ `/permissions` chuyển về tab Nhân viên.
- Có 8 nhóm độc lập: Tổng quan, Danh mục sản phẩm (gồm sản phẩm/biến thể/danh mục/thương hiệu/thông số), Đơn hàng, Nhập kho, Đánh giá, Liên hệ, Mã giảm giá, Báo cáo.
- Mẫu **Bán hàng** cấp Đơn hàng + Liên hệ; **Kho** cấp Danh mục sản phẩm + Nhập kho; **Chăm sóc khách hàng** cấp Liên hệ + Đánh giá. Admin có thể chọn thêm/bớt từng nhóm hoặc bỏ toàn bộ.
- Nhân viên được thêm/sửa/xóa trong nhóm được cấp, theo các thao tác và quy tắc nghiệp vụ có sẵn. Đơn hàng chỉ được xóa khi đã giao hoặc đã hủy; dữ liệu đang được tham chiếu vẫn tuân thủ ràng buộc database.
- Quản lý tài khoản, nhân sự và cấp quyền chỉ dành cho Admin, kể cả khi nhân viên được cấp mọi nhóm nghiệp vụ.
- Tài khoản nhân viên mới hoặc chưa cấu hình quyền chỉ vào được trang tài khoản cá nhân. Admin cần cấp quyền trước khi nhân viên vận hành cửa hàng.
- Tài khoản `NhanVien` chỉ sử dụng web admin; mobile chặn đăng nhập và tự xóa phiên nhân viên đã lưu. Backend chặn cả đăng nhập, gia hạn phiên và yêu cầu đã xác thực từ mobile bằng mã `MOBILE_STAFF_FORBIDDEN`. Khách hàng và Admin giữ quyền sử dụng mobile hiện có.
- Backend đọc quyền từ database ở mỗi yêu cầu, nên thu hồi quyền chặn ngay cả token cũ. Menu cập nhật khi tải lại, quay lại cửa sổ, định kỳ 30 giây hoặc khi API trả lỗi thiếu quyền.
- Nhân viên không được cấp nhóm Đơn hàng chỉ xem được đơn mua của chính mình qua API mua sắm; không xem đơn của khách hàng khác.
- Cài đặt database: chạy `npm run migrate:permissions` tại thư mục `BE`; lệnh có thể chạy lại và không sửa dữ liệu tài khoản hiện có.

---

## 4. QUY TRÌNH NGHIỆP VỤ CỐT LÕI & ĐẢM BẢO TOÀN VẸN DỮ LIỆU

### 4.1. Vòng đời đơn hàng & Quản lý Tồn kho nguyên tử (Atomic Inventory)
1. **Đặt hàng:** Khi khách hàng gửi yêu cầu thanh toán, hệ thống thực hiện trong một MySQL Transaction với lệnh `FOR UPDATE`:
   - Xác thực giá bán thực tế theo snapshot tại thời điểm mua.
   - Kiểm tra tồn kho của sản phẩm hoặc biến thể.
   - Trừ số lượng tồn kho ngay lập tức để giữ chỗ hàng hóa.
2. **Hủy đơn hàng:**
   - Chỉ cho phép hủy khi đơn ở trạng thái hợp lệ.
   - Hệ thống tự động **hoàn trả lại đúng số lượng tồn kho** một lần duy nhất vào kho hàng và khóa không cho hoàn lặp lại.
3. **Chống nhảy bước trạng thái:** Ngăn chặn tuyệt đối việc cập nhật đơn hàng sai quy trình (ví dụ: không thể nhảy từ *Chờ xác nhận* sang thẳng *Đã giao* mà không qua các bước xác nhận và giao hàng).

### 4.2. Bảo mật Phiên đăng nhập & Thu hồi Token tức thì
- Áp dụng cơ chế **Token Versioning (`token_version`)** kết hợp bảng phiên **`auth_sessions`**.
- Khi người dùng đăng xuất hoặc đổi mật khẩu:
  - Giá trị `token_version` trong bảng `tai_khoan` được tăng lên.
  - Toàn bộ Access Token cũ lập tức bị vô hiệu hóa trên mọi thiết bị mà không cần chờ JWT hết hạn tự nhiên.
- Mật khẩu được mã hóa an toàn bằng thuật toán **Bcrypt** kèm kiểm tra độ dài byte chuẩn UTF-8.

### 4.3. Tự động hóa qua Database Trigger
Cơ sở dữ liệu tích hợp các Trigger tự động phục vụ trải nghiệm người dùng:
- `order_created_notification`: Tự động tạo bản ghi trong bảng `thong_bao` gửi đến khách hàng ngay khi đơn hàng được tạo thành công.
- `order_status_notification`: Tự động gửi thông báo cập nhật lộ trình đơn hàng khi trạng thái chuyển sang *Đã xác nhận*, *Đang giao*, *Đã giao* hoặc *Đã hủy*.
- `contact_reply_notification`: Tự động gửi thông báo khi nhân viên gửi câu trả lời cho thư liên hệ của khách hàng.
- `chi_tiet_don_hang_variant_insert` / `chi_tiet_gio_hang_variant_insert`: Tự động đồng bộ khóa biến thể `variant_key` đảm bảo tính toàn vẹn khóa chính tổng hợp.

---

## 5. MA TRẬN PHÂN QUYỀN HỆ THỐNG (RBAC)

**Theo quyền** nghĩa là Admin đã cấp nhóm nghiệp vụ tương ứng. Cột Nhân viên mô tả các trang quản trị; các API danh mục/sản phẩm công khai vẫn phục vụ ứng dụng mua sắm.

| Chức năng / Quyền hạn | Khách hàng (App) | Nhân viên (Admin) | Quản trị viên (Admin) |
|---|:---:|:---:|:---:|
| Xem danh mục, thương hiệu, sản phẩm | ✅ | Theo quyền `catalog` | ✅ |
| Lọc & chọn biến thể sản phẩm | ✅ | ✅ | ✅ |
| Thêm giỏ hàng, Mua ngay, Thanh toán COD | ✅ | ❌ | ❌ |
| Áp dụng mã giảm giá (Voucher) | ✅ | ❌ | ❌ |
| Theo dõi tiến trình & Hủy đơn hàng của mình | ✅ | ❌ | ❌ |
| Đánh giá sản phẩm đã mua | ✅ | ❌ | ❌ |
| Gửi liên hệ & Nhận thông báo hệ thống | ✅ | ❌ | ❌ |
| Xem bảng điều khiển & Thống kê doanh thu | ❌ | Theo quyền `dashboard` | ✅ |
| Quản lý Đơn hàng (Duyệt, Đổi trạng thái, In phiếu, Xóa) | ❌ | Theo quyền `orders` | ✅ |
| Lập phiếu nhập kho & Xem lịch sử kho | ❌ | Theo quyền `inventory` | ✅ |
| Tiếp nhận, Phản hồi & Xóa liên hệ khách hàng | ❌ | Theo quyền `contacts` | ✅ |
| Quản lý Sản phẩm, Biến thể, Đa ảnh | ❌ | Theo quyền `catalog` | ✅ |
| Quản lý Cây thông số kỹ thuật động | ❌ | Theo quyền `catalog` | ✅ |
| Quản lý Danh mục & Thương hiệu | ❌ | Theo quyền `catalog` | ✅ |
| Tạo & Phát hành Voucher khuyến mãi | ❌ | Theo quyền `vouchers` | ✅ |
| Quản lý Nhân sự & Bảng lương nhân viên | ❌ | ❌ | ✅ |
| Quản lý Tài khoản & Phân quyền vai trò | ❌ | ❌ | ✅ |
| Kiểm duyệt & Xóa đánh giá | ❌ | Theo quyền `reviews` | ✅ |
| Xem, In & Xuất báo cáo ra file Excel | ❌ | Theo quyền `reports` | ✅ |
| Cấp hoặc thu hồi nhóm quyền cho nhân viên | ❌ | ❌ | ✅ |

---

## 6. DANH MỤC CÁC BẢNG DỮ LIỆU CHÍNH (DATABASE SCHEMA)

1. `tai_khoan`: Quản lý thông tin đăng nhập, vai trò, trạng thái khóa, `token_version`.
2. `nhan_vien`: Hồ sơ nhân sự, chức vụ, tiền lương, ngày vào làm.
   - `staff_permissions`: Quyền nghiệp vụ của từng tài khoản nhân viên; danh sách JSON các mã nhóm quyền, tự xóa khi tài khoản bị xóa.
3. `danh_muc`: Phân loại nhóm thiết bị gia dụng.
4. `thuong_hieu`: Các hãng sản xuất và xuất xứ thương hiệu.
5. `san_pham`: Bảng sản phẩm chính, giá niêm yết, tồn kho tổng, bảo hành, ảnh đại diện.
6. `san_pham_bien_the`: Các phiên bản biến thể theo công suất/màu sắc, mã SKU, giá riêng, tồn kho riêng, `thong_so_json`.
7. `hinh_anh_san_pham`: Bộ sưu tập nhiều ảnh cho mỗi sản phẩm.
8. `nhom_thong_so`: Nhóm thông số kỹ thuật chuẩn hóa.
9. `thong_so`: Định nghĩa thông số, đơn vị đo, kiểu dữ liệu, cờ lọc.
10. `danh_muc_thong_so`: Bảng liên kết cấu hình thông số áp dụng cho từng danh mục.
11. `thong_so_san_pham`: Giá trị thông số thực tế của từng sản phẩm.
12. `gio_hang` & `chi_tiet_gio_hang`: Lưu trữ giỏ hàng người dùng theo sản phẩm và biến thể.
13. `don_hang` & `chi_tiet_don_hang`: Quản lý đơn hàng, người nhận, địa chỉ, phí ship, voucher, trạng thái vòng đời.
14. `checkout_requests`: Bảng lưu vết request thanh toán đảm bảo tính Idempotency.
15. `voucher`: Mã giảm giá, hạn mức, điều kiện đơn tối thiểu, số lượt dùng.
16. `dia_chi_giao_hang`: Sổ địa chỉ nhận hàng của khách hàng.
17. `danh_gia`: Đánh giá số sao và bình luận của người mua thực tế.
18. `lien_he`: Kênh tin nhắn liên hệ giữa khách hàng và bộ phận hỗ trợ.
19. `nhap_kho`: Nhật ký các đợt nhập hàng bổ sung tồn kho.
20. `thong_bao`: Hộp thư thông báo trong ứng dụng phát tự động qua DB Trigger.
21. `auth_sessions`: Quản lý phiên đăng nhập và thu hồi token thiết bị.
