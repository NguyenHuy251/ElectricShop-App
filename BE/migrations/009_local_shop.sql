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
