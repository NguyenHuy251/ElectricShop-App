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
