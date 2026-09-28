-- Additive migration: preserves all existing orders and products.
CREATE TABLE IF NOT EXISTS checkout_requests (
    ma_tai_khoan INT NOT NULL,
    request_id VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    request_hash CHAR(64) CHARACTER SET ascii NOT NULL,
    response_json JSON NOT NULL,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ma_tai_khoan, request_id),
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
