CREATE TABLE IF NOT EXISTS bien_the_san_pham (
  ma_san_pham INT NOT NULL PRIMARY KEY,
  nhom_bien_the CHAR(36) NOT NULL,
  ten_thuoc_tinh VARCHAR(80) NOT NULL,
  gia_tri VARCHAR(80) NOT NULL,
  thu_tu INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_variant_label (nhom_bien_the, gia_tri),
  CONSTRAINT fk_variant_product FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
