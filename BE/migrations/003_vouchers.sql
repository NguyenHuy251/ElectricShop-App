CREATE TABLE IF NOT EXISTS voucher (
 ma_voucher INT AUTO_INCREMENT PRIMARY KEY,
 code VARCHAR(32) NOT NULL UNIQUE,
 loai ENUM('PhanTram','SoTien') NOT NULL,
 gia_tri DECIMAL(15,2) NOT NULL,
 don_toi_thieu DECIMAL(15,2) NOT NULL DEFAULT 0,
 giam_toi_da DECIMAL(15,2) NULL,
 bat_dau DATETIME NOT NULL,
 ket_thuc DATETIME NOT NULL,
 gioi_han INT NOT NULL,
 moi_khach INT NOT NULL DEFAULT 1,
 hoat_dong BOOLEAN NOT NULL DEFAULT 1,
 ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS voucher_su_dung (
 ma_don_hang INT NOT NULL PRIMARY KEY,
 ma_voucher INT NOT NULL,
 ma_tai_khoan INT NOT NULL,
 code VARCHAR(32) NOT NULL,
 tam_tinh DECIMAL(15,2) NOT NULL,
 tien_giam DECIMAL(15,2) NOT NULL,
 hoan_luot BOOLEAN NOT NULL DEFAULT 0,
 FOREIGN KEY (ma_voucher) REFERENCES voucher(ma_voucher),
 INDEX ix_voucher_user (ma_voucher, ma_tai_khoan, hoan_luot)
) ENGINE=InnoDB;
