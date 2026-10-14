export const CHECKOUT_REQUESTS_SQL = `
CREATE TABLE IF NOT EXISTS checkout_requests (
    ma_tai_khoan INT NOT NULL,
    request_id VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    request_hash CHAR(64) CHARACTER SET ascii NOT NULL,
    response_json JSON NOT NULL,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ma_tai_khoan, request_id),
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export const PRODUCT_VARIANTS_SQL = `
CREATE TABLE IF NOT EXISTS san_pham_bien_the (
    ma_bien_the INT AUTO_INCREMENT PRIMARY KEY,
    ma_san_pham INT NOT NULL,
    ma_sku VARCHAR(80) NOT NULL UNIQUE,
    ten_bien_the VARCHAR(100) NOT NULL,
    gia_ban DECIMAL(15,2) NOT NULL,
    so_luong INT NOT NULL DEFAULT 0,
    trang_thai ENUM('DangBan', 'HetHang', 'NgungBan') DEFAULT 'DangBan',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_san_pham_bien_the_ten (ma_san_pham, ten_bien_the),
    CONSTRAINT fk_bien_the_san_pham FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export const VARIANT_SPECIFICATIONS_SQL = `
ALTER TABLE san_pham_bien_the ADD COLUMN thong_so_json JSON NULL AFTER trang_thai;
`;

export const TIVI_SPECIFICATIONS_SQL = `
INSERT INTO danh_muc (ten_danh_muc, mo_ta, trang_thai)
SELECT 'Tivi', 'Tivi và thiết bị hiển thị', TRUE
WHERE NOT EXISTS (SELECT 1 FROM danh_muc WHERE ten_danh_muc = 'Tivi');

INSERT INTO thong_so (ma_nhom_thong_so, ten_thong_so, kieu_du_lieu, don_vi, cho_phep_loc, thu_tu_hien_thi, trang_thai)
SELECT nts.ma_nhom_thong_so, seed.name, seed.data_type, seed.unit, 0, seed.display_order, TRUE
FROM (
    SELECT 'Loại Tivi' AS name, 'Thông tin cơ bản' AS group_name, 'TEXT' AS data_type, NULL AS unit, 1 AS display_order
    UNION ALL SELECT 'Kích cỡ màn hình', 'Kích thước và năng lực', 'NUMBER', 'inch', 2
    UNION ALL SELECT 'Độ phân giải', 'Công nghệ', 'TEXT', NULL, 3
    UNION ALL SELECT 'Loại màn hình', 'Công nghệ', 'TEXT', NULL, 4
    UNION ALL SELECT 'Hệ điều hành', 'Công nghệ', 'TEXT', NULL, 5
    UNION ALL SELECT 'RAM', 'Công nghệ', 'TEXT', NULL, 6
    UNION ALL SELECT 'ROM (Bộ nhớ lưu trữ)', 'Công nghệ', 'TEXT', NULL, 7
    UNION ALL SELECT 'Chất liệu chân đế', 'Thông tin cơ bản', 'TEXT', NULL, 8
    UNION ALL SELECT 'Chất liệu viền tivi', 'Thông tin cơ bản', 'TEXT', NULL, 9
    UNION ALL SELECT 'Nơi sản xuất', 'Thông tin cơ bản', 'TEXT', NULL, 10
    UNION ALL SELECT 'Năm ra mắt', 'Thông tin cơ bản', 'NUMBER', NULL, 11
) seed
JOIN nhom_thong_so nts ON nts.ten_nhom_thong_so = seed.group_name
WHERE NOT EXISTS (
    SELECT 1 FROM thong_so ts
    WHERE TRIM(TRAILING ':' FROM TRIM(ts.ten_thong_so)) = seed.name
);

INSERT INTO danh_muc_thong_so (ma_danh_muc, ma_thong_so, bat_buoc, thu_tu_hien_thi)
SELECT dm.ma_danh_muc, ts.ma_thong_so, FALSE, seed.display_order
FROM (
    SELECT 'Loại Tivi' AS name, 1 AS display_order
    UNION ALL SELECT 'Kích cỡ màn hình', 2
    UNION ALL SELECT 'Độ phân giải', 3
    UNION ALL SELECT 'Loại màn hình', 4
    UNION ALL SELECT 'Hệ điều hành', 5
    UNION ALL SELECT 'RAM', 6
    UNION ALL SELECT 'ROM (Bộ nhớ lưu trữ)', 7
    UNION ALL SELECT 'Chất liệu chân đế', 8
    UNION ALL SELECT 'Chất liệu viền tivi', 9
    UNION ALL SELECT 'Nơi sản xuất', 10
    UNION ALL SELECT 'Năm ra mắt', 11
) seed
JOIN thong_so ts ON TRIM(TRAILING ':' FROM TRIM(ts.ten_thong_so)) = seed.name AND ts.trang_thai = TRUE
JOIN danh_muc dm ON dm.ten_danh_muc = 'Tivi'
WHERE NOT EXISTS (
    SELECT 1 FROM danh_muc_thong_so assigned
    WHERE assigned.ma_danh_muc = dm.ma_danh_muc AND assigned.ma_thong_so = ts.ma_thong_so
);
`;

export const LOCAL_SHOP_SQL = `
CREATE TABLE IF NOT EXISTS dia_chi_giao_hang (
  ma_dia_chi INT AUTO_INCREMENT PRIMARY KEY,
  ma_tai_khoan INT NOT NULL,
  ho_ten VARCHAR(100) NOT NULL,
  so_dien_thoai VARCHAR(15) NOT NULL,
  dia_chi VARCHAR(255) NOT NULL,
  mac_dinh BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS voucher (
  ma_voucher INT AUTO_INCREMENT PRIMARY KEY,
  ma_code VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  giam_tien DECIMAL(15,2) NOT NULL,
  don_toi_thieu DECIMAL(15,2) NOT NULL DEFAULT 0,
  so_luot INT NOT NULL,
  da_dung INT NOT NULL DEFAULT 0,
  bat_dau DATETIME NOT NULL,
  ket_thuc DATETIME NOT NULL,
  trang_thai BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS thong_bao (
  ma_thong_bao INT AUTO_INCREMENT PRIMARY KEY,
  ma_tai_khoan INT NOT NULL,
  noi_dung VARCHAR(500) NOT NULL,
  ma_don_hang INT NULL,
  da_doc BOOLEAN NOT NULL DEFAULT FALSE,
  ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS nhap_kho (
  ma_nhap INT AUTO_INCREMENT PRIMARY KEY,
  ma_san_pham INT NOT NULL,
  ma_bien_the INT NULL,
  ma_tai_khoan INT NOT NULL,
  so_luong INT NOT NULL,
  ghi_chu VARCHAR(500) NULL,
  ngay_nhap DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham) ON DELETE RESTRICT,
  FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  ma_tai_khoan INT NOT NULL,
  token_version INT NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE
);
`;
