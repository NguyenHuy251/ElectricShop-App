-- =========================================================
-- CUA HANG DIEN GIA DUNG
-- DATABASE DON GIAN - CHAY TRUC TIEP TREN MYSQL WORKBENCH
-- =========================================================

DROP DATABASE IF EXISTS dien_gia_dung;

CREATE DATABASE dien_gia_dung
CHARACTER SET utf8mb4
COLLATE utf8mb4_0900_ai_ci;

USE dien_gia_dung;

-- =========================================================
-- 1. TAI KHOAN
-- =========================================================
CREATE TABLE tai_khoan (
    ma_tai_khoan INT AUTO_INCREMENT PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE,
    mat_khau VARCHAR(255) NOT NULL,
    ho_ten VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    so_dien_thoai VARCHAR(15),
    dia_chi VARCHAR(255),
    vai_tro ENUM('Admin', 'NhanVien', 'KhachHang') DEFAULT 'KhachHang',
    trang_thai ENUM('HoatDong', 'Khoa') DEFAULT 'HoatDong',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 2. NHAN VIEN
-- =========================================================
CREATE TABLE nhan_vien (
    ma_nhan_vien INT AUTO_INCREMENT PRIMARY KEY,
    ma_tai_khoan INT UNIQUE,
    ho_ten VARCHAR(100) NOT NULL,
    chuc_vu VARCHAR(100),
    so_dien_thoai VARCHAR(15),
    email VARCHAR(100),
    ngay_vao_lam DATE,
    luong DECIMAL(15,2) DEFAULT 0,
    trang_thai ENUM('DangLam', 'NghiLam') DEFAULT 'DangLam',

    FOREIGN KEY (ma_tai_khoan)
        REFERENCES tai_khoan(ma_tai_khoan)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 3. DANH MUC
-- =========================================================
CREATE TABLE danh_muc (
    ma_danh_muc INT AUTO_INCREMENT PRIMARY KEY,
    ten_danh_muc VARCHAR(100) NOT NULL UNIQUE,
    mo_ta TEXT,
    trang_thai BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 4. THUONG HIEU
-- =========================================================
CREATE TABLE thuong_hieu (
    ma_thuong_hieu INT AUTO_INCREMENT PRIMARY KEY,
    ten_thuong_hieu VARCHAR(100) NOT NULL UNIQUE,
    quoc_gia VARCHAR(100),
    mo_ta TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 5. SAN PHAM
-- =========================================================
CREATE TABLE san_pham (
    ma_san_pham INT AUTO_INCREMENT PRIMARY KEY,
    ma_danh_muc INT NOT NULL,
    ma_thuong_hieu INT NOT NULL,
    ma_san_pham_code VARCHAR(50) NOT NULL UNIQUE,
    ten_san_pham VARCHAR(200) NOT NULL,
    mo_ta TEXT,
    gia_nhap DECIMAL(15,2) DEFAULT 0,
    gia_ban DECIMAL(15,2) NOT NULL,
    so_luong INT DEFAULT 0,
    bao_hanh INT DEFAULT 12,
    hinh_anh VARCHAR(255),
    trang_thai ENUM('DangBan', 'HetHang', 'NgungBan') DEFAULT 'DangBan',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (ma_danh_muc)
        REFERENCES danh_muc(ma_danh_muc)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (ma_thuong_hieu)
        REFERENCES thuong_hieu(ma_thuong_hieu)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 6. CHI TIET SAN PHAM
-- =========================================================
CREATE TABLE chi_tiet_san_pham (
    ma_chi_tiet INT AUTO_INCREMENT PRIMARY KEY,
    ma_san_pham INT NOT NULL UNIQUE,
    cong_suat VARCHAR(100),
    dung_tich VARCHAR(100),
    kich_thuoc VARCHAR(100),
    mau_sac VARCHAR(50),
    xuat_xu VARCHAR(100),
    thong_so_khac TEXT,

    FOREIGN KEY (ma_san_pham)
        REFERENCES san_pham(ma_san_pham)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 7. GIO HANG
-- =========================================================
CREATE TABLE gio_hang (
    ma_gio_hang INT AUTO_INCREMENT PRIMARY KEY,
    ma_tai_khoan INT NOT NULL UNIQUE,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (ma_tai_khoan)
        REFERENCES tai_khoan(ma_tai_khoan)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 8. CHI TIET GIO HANG
-- =========================================================
CREATE TABLE chi_tiet_gio_hang (
    ma_gio_hang INT NOT NULL,
    ma_san_pham INT NOT NULL,
    so_luong INT NOT NULL DEFAULT 1,

    PRIMARY KEY (ma_gio_hang, ma_san_pham),

    FOREIGN KEY (ma_gio_hang)
        REFERENCES gio_hang(ma_gio_hang)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (ma_san_pham)
        REFERENCES san_pham(ma_san_pham)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 9. DON HANG
-- =========================================================
CREATE TABLE don_hang (
    ma_don_hang INT AUTO_INCREMENT PRIMARY KEY,
    ma_tai_khoan INT NOT NULL,

    ho_ten_nguoi_nhan VARCHAR(100) NOT NULL,
    so_dien_thoai VARCHAR(15) NOT NULL,
    dia_chi_giao_hang VARCHAR(255) NOT NULL,

    tong_tien DECIMAL(15,2) DEFAULT 0,

    phuong_thuc_thanh_toan ENUM(
        'TienMat',
        'ChuyenKhoan',
        'ThanhToanKhiNhanHang'
    ) DEFAULT 'ThanhToanKhiNhanHang',

    trang_thai ENUM(
        'ChoXacNhan',
        'DaXacNhan',
        'DangGiao',
        'DaGiao',
        'DaHuy'
    ) DEFAULT 'ChoXacNhan',

    ghi_chu TEXT,
    ngay_dat DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (ma_tai_khoan)
        REFERENCES tai_khoan(ma_tai_khoan)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 10. CHI TIET DON HANG
-- =========================================================
CREATE TABLE chi_tiet_don_hang (
    ma_don_hang INT NOT NULL,
    ma_san_pham INT NOT NULL,
    ten_san_pham VARCHAR(200) NOT NULL,
    so_luong INT NOT NULL,
    don_gia DECIMAL(15,2) NOT NULL,
    thanh_tien DECIMAL(15,2)
        GENERATED ALWAYS AS (so_luong * don_gia) STORED,

    PRIMARY KEY (ma_don_hang, ma_san_pham),

    FOREIGN KEY (ma_don_hang)
        REFERENCES don_hang(ma_don_hang)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (ma_san_pham)
        REFERENCES san_pham(ma_san_pham)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 11. DANH GIA
-- =========================================================
CREATE TABLE danh_gia (
    ma_danh_gia INT AUTO_INCREMENT PRIMARY KEY,
    ma_san_pham INT NOT NULL,
    ma_tai_khoan INT NOT NULL,
    so_sao INT NOT NULL,
    noi_dung TEXT,
    ngay_danh_gia DATETIME DEFAULT CURRENT_TIMESTAMP,

    CHECK (so_sao BETWEEN 1 AND 5),

    FOREIGN KEY (ma_san_pham)
        REFERENCES san_pham(ma_san_pham)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (ma_tai_khoan)
        REFERENCES tai_khoan(ma_tai_khoan)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 12. LIEN HE
-- =========================================================
CREATE TABLE lien_he (
    ma_lien_he INT AUTO_INCREMENT PRIMARY KEY,
    ma_tai_khoan INT NULL,
    ho_ten VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    so_dien_thoai VARCHAR(15),
    tieu_de VARCHAR(200),
    noi_dung TEXT NOT NULL,
    trang_thai ENUM('ChuaXuLy', 'DangXuLy', 'DaXuLy') DEFAULT 'ChuaXuLy',
    ngay_gui DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (ma_tai_khoan)
        REFERENCES tai_khoan(ma_tai_khoan)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- DU LIEU MAU - TAI KHOAN
-- =========================================================
INSERT INTO tai_khoan
(ten_dang_nhap, mat_khau, ho_ten, email, so_dien_thoai, dia_chi, vai_tro)
VALUES
('admin', '$2a$10$Dpg/C6khLzJNFiGh.Y8IZ.KzFITP5e1ewMb4PCbYAr1Y5AuGNzdhC', 'Quan tri vien', 'admin@gmail.com', '0900000001', 'Hung Yen', 'Admin'),
('nhanvien01', '$2a$10$Dpg/C6khLzJNFiGh.Y8IZ.KzFITP5e1ewMb4PCbYAr1Y5AuGNzdhC', 'Nguyen Van An', 'nhanvien@gmail.com', '0900000002', 'Hung Yen', 'NhanVien'),
('huy2005', '$2a$10$Tbh39eZ98b9nBys59G32qOkyP8iEWMkKcrrwqinI6whTs.8kQoete', 'Nguyen Duc Huy', 'huy@gmail.com', '0900000003', 'Hung Yen', 'KhachHang'),
('ngoc2004', '$2a$10$Tbh39eZ98b9nBys59G32qOkyP8iEWMkKcrrwqinI6whTs.8kQoete', 'Tran Thi Ngoc', 'ngoc@gmail.com', '0900000004', 'Ha Noi', 'KhachHang'),
('nam2003', '$2a$10$Tbh39eZ98b9nBys59G32qOkyP8iEWMkKcrrwqinI6whTs.8kQoete', 'Le Van Nam', 'nam@gmail.com', '0900000005', 'Hai Phong', 'KhachHang');

-- =========================================================
-- DU LIEU MAU - NHAN VIEN
-- =========================================================
INSERT INTO nhan_vien
(ma_tai_khoan, ho_ten, chuc_vu, so_dien_thoai, email, ngay_vao_lam, luong)
VALUES
(2, 'Nguyen Van An', 'Nhan vien ban hang', '0900000002',
 'nhanvien@gmail.com', '2026-01-10', 8500000);

-- =========================================================
-- DU LIEU MAU - DANH MUC
-- =========================================================
INSERT INTO danh_muc (ten_danh_muc, mo_ta)
VALUES
('Tu lanh', 'Cac loai tu lanh gia dinh'),
('May giat', 'May giat cua tren va cua truoc'),
('Lo vi song', 'Lo vi song gia dinh'),
('Dieu hoa', 'Dieu hoa nhiet do'),
('Bep dien', 'Bep tu va bep dien'),
('Noi com dien', 'Noi com dien gia dinh'),
('May hut bui', 'May hut bui gia dinh'),
('Am sieu toc', 'Am dun nuoc sieu toc'),
('May loc nuoc', 'May loc nuoc gia dinh'),
('Quat dien', 'Quat dien gia dung');

-- =========================================================
-- DU LIEU MAU - THUONG HIEU
-- =========================================================
INSERT INTO thuong_hieu (ten_thuong_hieu, quoc_gia, mo_ta)
VALUES
('Samsung', 'Han Quoc', 'Thiet bi dien tu va gia dung'),
('LG', 'Han Quoc', 'Dien may va gia dung'),
('Panasonic', 'Nhat Ban', 'Thiet bi dien va gia dung'),
('Toshiba', 'Nhat Ban', 'Dien may gia dung'),
('Sharp', 'Nhat Ban', 'Dien gia dung'),
('Electrolux', 'Thuy Dien', 'Thiet bi gia dung'),
('Aqua', 'Nhat Ban', 'Dien lanh gia dung'),
('Daikin', 'Nhat Ban', 'Dieu hoa va thiet bi khong khi'),
('Midea', 'Trung Quoc', 'Dien gia dung'),
('Sunhouse', 'Viet Nam', 'Gia dung Viet Nam');

-- =========================================================
-- DU LIEU MAU - SAN PHAM
-- =========================================================
INSERT INTO san_pham
(ma_danh_muc, ma_thuong_hieu, ma_san_pham_code, ten_san_pham,
 mo_ta, gia_nhap, gia_ban, so_luong, bao_hanh, hinh_anh)
VALUES
(1, 1, 'TL001', 'Tu lanh Samsung Inverter 236 lit',
 'Tu lanh Samsung tiet kiem dien',
 6500000, 7990000, 20, 24, 'tu-lanh-samsung-236.jpg'),

(1, 2, 'TL002', 'Tu lanh LG Inverter 474 lit',
 'Tu lanh LG dung tich lon',
 10500000, 12990000, 15, 24, 'tu-lanh-lg-474.jpg'),

(1, 4, 'TL003', 'Tu lanh Toshiba 180 lit',
 'Tu lanh Toshiba cho gia dinh',
 5200000, 6490000, 18, 24, 'tu-lanh-toshiba-180.jpg'),

(2, 1, 'MG001', 'May giat Samsung 9 kg',
 'May giat Samsung cua truoc',
 7000000, 8990000, 12, 24, 'may-giat-samsung-9kg.jpg'),

(2, 2, 'MG002', 'May giat LG Inverter 10 kg',
 'May giat LG Inverter',
 8500000, 10990000, 10, 24, 'may-giat-lg-10kg.jpg'),

(2, 3, 'MG003', 'May giat Panasonic 9 kg',
 'May giat Panasonic',
 6500000, 8290000, 11, 24, 'may-giat-panasonic-9kg.jpg'),

(3, 5, 'LVS001', 'Lo vi song Sharp 20 lit',
 'Lo vi song Sharp 20 lit',
 1500000, 1990000, 25, 12, 'lo-vi-song-sharp-20.jpg'),

(3, 3, 'LVS002', 'Lo vi song Panasonic 25 lit',
 'Lo vi song Panasonic',
 2200000, 2890000, 16, 12, 'lo-vi-song-panasonic-25.jpg'),

(4, 8, 'DH001', 'Dieu hoa Daikin 1.5 HP',
 'Dieu hoa Daikin Inverter',
 9000000, 11990000, 8, 24, 'dieu-hoa-daikin-15.jpg'),

(4, 2, 'DH002', 'Dieu hoa LG 1.5 HP',
 'Dieu hoa LG Dual Inverter',
 7800000, 10290000, 7, 24, 'dieu-hoa-lg-15.jpg'),

(5, 3, 'BT001', 'Bep tu Panasonic',
 'Bep tu Panasonic',
 2500000, 3290000, 18, 12, 'bep-tu-panasonic.jpg'),

(5, 10, 'BT002', 'Bep tu Sunhouse',
 'Bep tu Sunhouse',
 1600000, 2290000, 20, 12, 'bep-tu-sunhouse.jpg'),

(6, 4, 'NC001', 'Noi com dien Toshiba 1.8 lit',
 'Noi com dien Toshiba',
 1000000, 1490000, 30, 12, 'noi-com-toshiba.jpg'),

(6, 10, 'NC002', 'Noi com dien Sunhouse 1.8 lit',
 'Noi com dien Sunhouse',
 700000, 990000, 35, 12, 'noi-com-sunhouse.jpg'),

(7, 2, 'HB001', 'May hut bui LG',
 'May hut bui gia dinh LG',
 3000000, 4290000, 14, 12, 'may-hut-bui-lg.jpg'),

(7, 6, 'HB002', 'May hut bui Electrolux',
 'May hut bui Electrolux',
 3500000, 4690000, 8, 24, 'may-hut-bui-electrolux.jpg'),

(8, 4, 'AST001', 'Am sieu toc Toshiba 1.7 lit',
 'Am sieu toc Toshiba',
 400000, 690000, 40, 12, 'am-sieu-toc-toshiba.jpg'),

(8, 3, 'AST002', 'Am sieu toc Panasonic 1.7 lit',
 'Am sieu toc Panasonic',
 500000, 790000, 35, 12, 'am-sieu-toc-panasonic.jpg'),

(9, 10, 'MLN001', 'May loc nuoc Sunhouse 10 loi',
 'May loc nuoc Sunhouse',
 4200000, 5490000, 12, 24, 'may-loc-nuoc-sunhouse.jpg'),

(9, 3, 'MLN002', 'May loc nuoc Panasonic RO',
 'May loc nuoc Panasonic RO',
 5200000, 6990000, 8, 24, 'may-loc-nuoc-panasonic.jpg'),

(10, 3, 'Q001', 'Quat Panasonic dung',
 'Quat dung Panasonic',
 900000, 1290000, 25, 12, 'quat-panasonic.jpg'),

(10, 10, 'Q002', 'Quat Sunhouse dung',
 'Quat dung Sunhouse',
 650000, 990000, 30, 12, 'quat-sunhouse.jpg');

-- =========================================================
-- DU LIEU MAU - CHI TIET SAN PHAM
-- =========================================================
INSERT INTO chi_tiet_san_pham
(ma_san_pham, cong_suat, dung_tich, kich_thuoc, mau_sac, xuat_xu, thong_so_khac)
VALUES
(1, '150W', '236 lit', '158 x 55 x 63 cm', 'Den', 'Viet Nam', 'Inverter'),
(2, '180W', '474 lit', '172 x 70 x 68 cm', 'Bac', 'Viet Nam', 'Inverter'),
(3, '140W', '180 lit', '140 x 55 x 60 cm', 'Xam', 'Viet Nam', 'Inverter'),
(4, '2000W', '9 kg', '60 x 55 x 65 cm', 'Den', 'Viet Nam', 'Cua truoc'),
(5, '2200W', '10 kg', '60 x 56 x 65 cm', 'Xam', 'Viet Nam', 'Inverter'),
(6, '2100W', '9 kg', '60 x 55 x 62 cm', 'Trang', 'Viet Nam', 'Cua truoc'),
(7, '800W', '20 lit', '45 x 35 x 30 cm', 'Den', 'Thai Lan', 'Hien thi LED'),
(8, '900W', '25 lit', '50 x 40 x 30 cm', 'Den', 'Viet Nam', 'Hien thi LED'),
(9, '12000 BTU', NULL, '80 x 30 x 22 cm', 'Trang', 'Thai Lan', 'Inverter'),
(10, '12000 BTU', NULL, '84 x 30 x 22 cm', 'Trang', 'Viet Nam', 'Dual Inverter'),
(11, '2000W', NULL, '30 x 40 x 8 cm', 'Den', 'Viet Nam', 'Mat kinh'),
(12, '1800W', NULL, '29 x 36 x 7 cm', 'Den', 'Viet Nam', 'Mat kinh'),
(13, '700W', '1.8 lit', '30 x 25 x 30 cm', 'Trang', 'Viet Nam', 'Long noi chong dinh'),
(14, '700W', '1.8 lit', '29 x 25 x 29 cm', 'Trang', 'Viet Nam', 'Long noi chong dinh'),
(15, '1600W', NULL, '30 x 30 x 110 cm', 'Do', 'Viet Nam', 'Loc HEPA'),
(16, '1600W', NULL, '28 x 28 x 108 cm', 'Xam', 'Trung Quoc', 'Loc HEPA'),
(17, '1500W', '1.7 lit', '25 x 23 x 120 cm', 'Den', 'Viet Nam', 'Tu ngat khi soi'),
(18, '1800W', '1.7 lit', '30 x 23 x 120 cm', 'Trang', 'Viet Nam', 'Tu ngat khi soi'),
(19, '30W', '10 loi', '45 x 30 x 120 cm', 'Trang', 'Viet Nam', 'RO'),
(20, '35W', 'RO', '45 x 30 x 120 cm', 'Trang', 'Viet Nam', 'RO'),
(21, '55W', NULL, '45 x 45 x 135 cm', 'Den', 'Viet Nam', '3 canh'),
(22, '50W', NULL, '45 x 45 x 130 cm', 'Trang', 'Viet Nam', '3 canh');

-- =========================================================
-- DU LIEU MAU - GIO HANG
-- =========================================================
INSERT INTO gio_hang (ma_tai_khoan)
VALUES (3), (4), (5);

INSERT INTO chi_tiet_gio_hang
(ma_gio_hang, ma_san_pham, so_luong)
VALUES
(1, 4, 1),
(1, 17, 2),
(2, 1, 1),
(2, 7, 1),
(3, 11, 1),
(3, 19, 1);

-- =========================================================
-- DU LIEU MAU - DON HANG
-- =========================================================
INSERT INTO don_hang
(ma_tai_khoan, ho_ten_nguoi_nhan, so_dien_thoai,
 dia_chi_giao_hang, tong_tien, phuong_thuc_thanh_toan,
 trang_thai, ghi_chu)
VALUES
(3, 'Nguyen Duc Huy', '0900000003',
 'Hung Yen - My Hao - Nhan Hoa',
 8990000, 'ThanhToanKhiNhanHang', 'DaGiao',
 'Giao gio hanh chinh'),

(4, 'Tran Thi Ngoc', '0900000004',
 'Ha Noi - Cau Giay',
 7990000, 'ChuyenKhoan', 'DangGiao',
 'Goi truoc khi giao'),

(5, 'Le Van Nam', '0900000005',
 'Hai Phong - Le Chan',
 3290000, 'TienMat', 'ChoXacNhan',
 '');

INSERT INTO chi_tiet_don_hang
(ma_don_hang, ma_san_pham, ten_san_pham, so_luong, don_gia)
VALUES
(1, 4, 'May giat Samsung 9 kg', 1, 8990000),
(2, 1, 'Tu lanh Samsung Inverter 236 lit', 1, 7990000),
(3, 11, 'Bep tu Panasonic', 1, 3290000);

-- =========================================================
-- DU LIEU MAU - DANH GIA
-- =========================================================
INSERT INTO danh_gia
(ma_san_pham, ma_tai_khoan, so_sao, noi_dung)
VALUES
(4, 3, 5, 'May giat chay em, giat sach'),
(1, 4, 4, 'Tu lanh dep, lam lanh tot'),
(11, 5, 5, 'Bep de su dung'),
(9, 3, 5, 'Dieu hoa lam lanh nhanh');

-- =========================================================
-- DU LIEU MAU - LIEN HE
-- =========================================================
INSERT INTO lien_he
(ma_tai_khoan, ho_ten, email, so_dien_thoai, tieu_de, noi_dung, trang_thai)
VALUES
(3, 'Nguyen Duc Huy', 'huy@gmail.com', '0900000003',
 'Hoi ve may giat Samsung',
 'Cua hang con may giat Samsung 9 kg khong?',
 'DaXuLy'),

(NULL, 'Nguyen Thi Lan', 'lan@gmail.com', '0911111111',
 'Tu van tu lanh',
 'Toi muon duoc tu van tu lanh phu hop cho gia dinh 4 nguoi.',
 'ChuaXuLy');

-- =========================================================
-- STORED PROCEDURES CHO CAC CHUC NANG API
-- =========================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_auth_register$$
CREATE PROCEDURE sp_auth_register(
    IN p_ten_dang_nhap VARCHAR(50), IN p_mat_khau VARCHAR(255), IN p_ho_ten VARCHAR(100),
    IN p_email VARCHAR(100), IN p_so_dien_thoai VARCHAR(15), IN p_dia_chi VARCHAR(255))
BEGIN
    INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, ho_ten, email, so_dien_thoai, dia_chi, vai_tro, trang_thai)
    VALUES (p_ten_dang_nhap, p_mat_khau, p_ho_ten, p_email, p_so_dien_thoai, p_dia_chi, 'KhachHang', 'HoatDong');
    SELECT LAST_INSERT_ID() AS insertId, ROW_COUNT() AS affectedRows;
END$$

DROP PROCEDURE IF EXISTS sp_auth_find_by_username$$
CREATE PROCEDURE sp_auth_find_by_username(IN p_ten_dang_nhap VARCHAR(50))
BEGIN
    SELECT ma_tai_khoan, ten_dang_nhap, mat_khau, ho_ten, email, so_dien_thoai, dia_chi, vai_tro, trang_thai
    FROM tai_khoan WHERE ten_dang_nhap = p_ten_dang_nhap;
END$$
DROP PROCEDURE IF EXISTS sp_auth_check_duplicate$$
CREATE PROCEDURE sp_auth_check_duplicate(IN p_ten_dang_nhap VARCHAR(50), IN p_email VARCHAR(100), IN p_exclude_id INT)
BEGIN SELECT ma_tai_khoan FROM tai_khoan WHERE (ten_dang_nhap=p_ten_dang_nhap OR email=p_email) AND ma_tai_khoan<>COALESCE(p_exclude_id,0); END$$

DROP PROCEDURE IF EXISTS sp_auth_find_by_id$$
CREATE PROCEDURE sp_auth_find_by_id(IN p_ma_tai_khoan INT)
BEGIN
    SELECT ma_tai_khoan, ten_dang_nhap, ho_ten, email, so_dien_thoai, dia_chi, vai_tro, trang_thai, ngay_tao
    FROM tai_khoan WHERE ma_tai_khoan = p_ma_tai_khoan;
END$$

DROP PROCEDURE IF EXISTS sp_auth_update_profile$$
CREATE PROCEDURE sp_auth_update_profile(
    IN p_ma_tai_khoan INT, IN p_ho_ten VARCHAR(100), IN p_email VARCHAR(100),
    IN p_so_dien_thoai VARCHAR(15), IN p_dia_chi VARCHAR(255))
BEGIN
    UPDATE tai_khoan SET ho_ten = p_ho_ten, email = p_email, so_dien_thoai = p_so_dien_thoai, dia_chi = p_dia_chi
    WHERE ma_tai_khoan = p_ma_tai_khoan;
    SELECT ROW_COUNT() AS affectedRows;
END$$

DROP PROCEDURE IF EXISTS sp_danh_muc_list$$
CREATE PROCEDURE sp_danh_muc_list() BEGIN SELECT * FROM danh_muc ORDER BY ma_danh_muc DESC; END$$
DROP PROCEDURE IF EXISTS sp_danh_muc_get_by_id$$
CREATE PROCEDURE sp_danh_muc_get_by_id(IN p_id INT) BEGIN SELECT * FROM danh_muc WHERE ma_danh_muc = p_id; END$$
DROP PROCEDURE IF EXISTS sp_danh_muc_create$$
CREATE PROCEDURE sp_danh_muc_create(IN p_ten VARCHAR(100), IN p_mo_ta TEXT, IN p_trang_thai BOOLEAN)
BEGIN INSERT INTO danh_muc (ten_danh_muc, mo_ta, trang_thai) VALUES (p_ten, p_mo_ta, p_trang_thai); SELECT LAST_INSERT_ID() AS insertId, ROW_COUNT() AS affectedRows; END$$
DROP PROCEDURE IF EXISTS sp_danh_muc_update$$
CREATE PROCEDURE sp_danh_muc_update(IN p_id INT, IN p_ten VARCHAR(100), IN p_mo_ta TEXT, IN p_trang_thai BOOLEAN)
BEGIN UPDATE danh_muc SET ten_danh_muc = COALESCE(p_ten, ten_danh_muc), mo_ta = COALESCE(p_mo_ta, mo_ta), trang_thai = COALESCE(p_trang_thai, trang_thai) WHERE ma_danh_muc = p_id; SELECT ROW_COUNT() AS affectedRows; END$$
DROP PROCEDURE IF EXISTS sp_danh_muc_delete$$
CREATE PROCEDURE sp_danh_muc_delete(IN p_id INT) BEGIN DELETE FROM danh_muc WHERE ma_danh_muc = p_id; SELECT ROW_COUNT() AS affectedRows; END$$

DROP PROCEDURE IF EXISTS sp_thuong_hieu_list$$
CREATE PROCEDURE sp_thuong_hieu_list() BEGIN SELECT * FROM thuong_hieu ORDER BY ma_thuong_hieu DESC; END$$
DROP PROCEDURE IF EXISTS sp_thuong_hieu_get_by_id$$
CREATE PROCEDURE sp_thuong_hieu_get_by_id(IN p_id INT) BEGIN SELECT * FROM thuong_hieu WHERE ma_thuong_hieu = p_id; END$$
DROP PROCEDURE IF EXISTS sp_thuong_hieu_create$$
CREATE PROCEDURE sp_thuong_hieu_create(IN p_ten VARCHAR(100), IN p_quoc_gia VARCHAR(100), IN p_mo_ta TEXT)
BEGIN INSERT INTO thuong_hieu (ten_thuong_hieu, quoc_gia, mo_ta) VALUES (p_ten, p_quoc_gia, p_mo_ta); SELECT LAST_INSERT_ID() AS insertId, ROW_COUNT() AS affectedRows; END$$
DROP PROCEDURE IF EXISTS sp_thuong_hieu_update$$
CREATE PROCEDURE sp_thuong_hieu_update(IN p_id INT, IN p_ten VARCHAR(100), IN p_quoc_gia VARCHAR(100), IN p_mo_ta TEXT)
BEGIN UPDATE thuong_hieu SET ten_thuong_hieu = COALESCE(p_ten, ten_thuong_hieu), quoc_gia = COALESCE(p_quoc_gia, quoc_gia), mo_ta = COALESCE(p_mo_ta, mo_ta) WHERE ma_thuong_hieu = p_id; SELECT ROW_COUNT() AS affectedRows; END$$
DROP PROCEDURE IF EXISTS sp_thuong_hieu_delete$$
CREATE PROCEDURE sp_thuong_hieu_delete(IN p_id INT) BEGIN DELETE FROM thuong_hieu WHERE ma_thuong_hieu = p_id; SELECT ROW_COUNT() AS affectedRows; END$$

DROP PROCEDURE IF EXISTS sp_san_pham_list$$
CREATE PROCEDURE sp_san_pham_list(
    IN p_search VARCHAR(200), IN p_ma_danh_muc INT, IN p_ma_thuong_hieu INT,
    IN p_min_price DECIMAL(15,2), IN p_max_price DECIMAL(15,2), IN p_limit INT, IN p_offset INT)
BEGIN
    SELECT COUNT(*) AS total
    FROM san_pham sp LEFT JOIN danh_muc dm ON dm.ma_danh_muc = sp.ma_danh_muc
    WHERE (p_search IS NULL OR p_search = '' OR sp.ten_san_pham LIKE CONCAT('%', p_search, '%') OR sp.ma_san_pham_code LIKE CONCAT('%', p_search, '%') OR dm.ten_danh_muc LIKE CONCAT('%', p_search, '%'))
      AND (p_ma_danh_muc IS NULL OR sp.ma_danh_muc = p_ma_danh_muc)
      AND (p_ma_thuong_hieu IS NULL OR sp.ma_thuong_hieu = p_ma_thuong_hieu)
      AND (p_min_price IS NULL OR sp.gia_ban >= p_min_price)
      AND (p_max_price IS NULL OR sp.gia_ban <= p_max_price);
    SELECT sp.*, dm.ten_danh_muc, th.ten_thuong_hieu,
           JSON_OBJECT('ma_chi_tiet', cts.ma_chi_tiet, 'ma_san_pham', cts.ma_san_pham,
             'cong_suat', cts.cong_suat, 'dung_tich', cts.dung_tich, 'kich_thuoc', cts.kich_thuoc,
             'mau_sac', cts.mau_sac, 'xuat_xu', cts.xuat_xu, 'thong_so_khac', cts.thong_so_khac) AS chi_tiet_san_pham
    FROM san_pham sp LEFT JOIN danh_muc dm ON dm.ma_danh_muc = sp.ma_danh_muc
    LEFT JOIN thuong_hieu th ON th.ma_thuong_hieu = sp.ma_thuong_hieu
    LEFT JOIN chi_tiet_san_pham cts ON cts.ma_san_pham = sp.ma_san_pham
    WHERE (p_search IS NULL OR p_search = '' OR sp.ten_san_pham LIKE CONCAT('%', p_search, '%') OR sp.ma_san_pham_code LIKE CONCAT('%', p_search, '%') OR dm.ten_danh_muc LIKE CONCAT('%', p_search, '%'))
      AND (p_ma_danh_muc IS NULL OR sp.ma_danh_muc = p_ma_danh_muc) AND (p_ma_thuong_hieu IS NULL OR sp.ma_thuong_hieu = p_ma_thuong_hieu)
      AND (p_min_price IS NULL OR sp.gia_ban >= p_min_price) AND (p_max_price IS NULL OR sp.gia_ban <= p_max_price)
    ORDER BY sp.ma_san_pham DESC LIMIT p_limit OFFSET p_offset;
END$$
DROP PROCEDURE IF EXISTS sp_san_pham_get_by_id$$
CREATE PROCEDURE sp_san_pham_get_by_id(IN p_id INT)
BEGIN
    SELECT sp.*, dm.ten_danh_muc, th.ten_thuong_hieu,
           JSON_OBJECT('ma_chi_tiet', cts.ma_chi_tiet, 'ma_san_pham', cts.ma_san_pham,
             'cong_suat', cts.cong_suat, 'dung_tich', cts.dung_tich, 'kich_thuoc', cts.kich_thuoc,
             'mau_sac', cts.mau_sac, 'xuat_xu', cts.xuat_xu, 'thong_so_khac', cts.thong_so_khac) AS chi_tiet_san_pham
    FROM san_pham sp LEFT JOIN danh_muc dm ON dm.ma_danh_muc = sp.ma_danh_muc LEFT JOIN thuong_hieu th ON th.ma_thuong_hieu = sp.ma_thuong_hieu
    LEFT JOIN chi_tiet_san_pham cts ON cts.ma_san_pham = sp.ma_san_pham WHERE sp.ma_san_pham = p_id;
END$$
DROP PROCEDURE IF EXISTS sp_san_pham_find_by_code$$
CREATE PROCEDURE sp_san_pham_find_by_code(IN p_code VARCHAR(50)) BEGIN SELECT ma_san_pham FROM san_pham WHERE ma_san_pham_code=p_code; END$$
DROP PROCEDURE IF EXISTS sp_san_pham_create$$
CREATE PROCEDURE sp_san_pham_create(
    IN p_ma_danh_muc INT, IN p_ma_thuong_hieu INT, IN p_code VARCHAR(50), IN p_ten VARCHAR(200), IN p_mo_ta TEXT,
    IN p_gia_nhap DECIMAL(15,2), IN p_gia_ban DECIMAL(15,2), IN p_so_luong INT, IN p_bao_hanh INT, IN p_hinh_anh VARCHAR(255), IN p_trang_thai VARCHAR(20),
    IN p_cong_suat VARCHAR(100), IN p_dung_tich VARCHAR(100), IN p_kich_thuoc VARCHAR(100), IN p_mau_sac VARCHAR(50), IN p_xuat_xu VARCHAR(100), IN p_thong_so_khac TEXT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    INSERT INTO san_pham (ma_danh_muc, ma_thuong_hieu, ma_san_pham_code, ten_san_pham, mo_ta, gia_nhap, gia_ban, so_luong, bao_hanh, hinh_anh, trang_thai)
    VALUES (p_ma_danh_muc, p_ma_thuong_hieu, p_code, p_ten, p_mo_ta, p_gia_nhap, p_gia_ban, p_so_luong, p_bao_hanh, p_hinh_anh, p_trang_thai);
    SET @ma_san_pham = LAST_INSERT_ID();
    INSERT INTO chi_tiet_san_pham (ma_san_pham, cong_suat, dung_tich, kich_thuoc, mau_sac, xuat_xu, thong_so_khac)
    VALUES (@ma_san_pham, p_cong_suat, p_dung_tich, p_kich_thuoc, p_mau_sac, p_xuat_xu, p_thong_so_khac);
    COMMIT; SELECT @ma_san_pham AS insertId, 1 AS affectedRows;
END$$
DROP PROCEDURE IF EXISTS sp_san_pham_update$$
CREATE PROCEDURE sp_san_pham_update(
    IN p_id INT, IN p_ma_danh_muc INT, IN p_ma_thuong_hieu INT, IN p_code VARCHAR(50), IN p_ten VARCHAR(200), IN p_mo_ta TEXT,
    IN p_gia_nhap DECIMAL(15,2), IN p_gia_ban DECIMAL(15,2), IN p_so_luong INT, IN p_bao_hanh INT, IN p_hinh_anh VARCHAR(255), IN p_trang_thai VARCHAR(20),
    IN p_cong_suat VARCHAR(100), IN p_dung_tich VARCHAR(100), IN p_kich_thuoc VARCHAR(100), IN p_mau_sac VARCHAR(50), IN p_xuat_xu VARCHAR(100), IN p_thong_so_khac TEXT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    UPDATE san_pham SET ma_danh_muc=COALESCE(p_ma_danh_muc,ma_danh_muc), ma_thuong_hieu=COALESCE(p_ma_thuong_hieu,ma_thuong_hieu), ma_san_pham_code=COALESCE(p_code,ma_san_pham_code), ten_san_pham=COALESCE(p_ten,ten_san_pham), mo_ta=COALESCE(p_mo_ta,mo_ta), gia_nhap=COALESCE(p_gia_nhap,gia_nhap), gia_ban=COALESCE(p_gia_ban,gia_ban), so_luong=COALESCE(p_so_luong,so_luong), bao_hanh=COALESCE(p_bao_hanh,bao_hanh), hinh_anh=COALESCE(p_hinh_anh,hinh_anh), trang_thai=COALESCE(p_trang_thai,trang_thai) WHERE ma_san_pham=p_id;
    UPDATE chi_tiet_san_pham SET cong_suat=COALESCE(p_cong_suat,cong_suat), dung_tich=COALESCE(p_dung_tich,dung_tich), kich_thuoc=COALESCE(p_kich_thuoc,kich_thuoc), mau_sac=COALESCE(p_mau_sac,mau_sac), xuat_xu=COALESCE(p_xuat_xu,xuat_xu), thong_so_khac=COALESCE(p_thong_so_khac,thong_so_khac) WHERE ma_san_pham=p_id;
    COMMIT; SELECT p_id AS ma_san_pham, ROW_COUNT() AS affectedRows;
END$$
DROP PROCEDURE IF EXISTS sp_san_pham_delete$$
CREATE PROCEDURE sp_san_pham_delete(IN p_id INT) BEGIN DELETE FROM san_pham WHERE ma_san_pham=p_id; SELECT ROW_COUNT() AS affectedRows; END$$

DROP PROCEDURE IF EXISTS sp_gio_hang_get$$
CREATE PROCEDURE sp_gio_hang_get(IN p_ma_tai_khoan INT)
BEGIN
    SELECT * FROM gio_hang WHERE ma_tai_khoan=p_ma_tai_khoan;
    SELECT cth.*, sp.ten_san_pham, sp.gia_ban, sp.hinh_anh FROM chi_tiet_gio_hang cth JOIN gio_hang gh ON gh.ma_gio_hang=cth.ma_gio_hang JOIN san_pham sp ON sp.ma_san_pham=cth.ma_san_pham WHERE gh.ma_tai_khoan=p_ma_tai_khoan;
END$$
DROP PROCEDURE IF EXISTS sp_gio_hang_add_item$$
CREATE PROCEDURE sp_gio_hang_add_item(IN p_ma_tai_khoan INT, IN p_ma_san_pham INT, IN p_so_luong INT)
BEGIN
    DECLARE v_cart INT;
    INSERT INTO gio_hang (ma_tai_khoan) SELECT p_ma_tai_khoan FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM gio_hang WHERE ma_tai_khoan=p_ma_tai_khoan);
    SELECT ma_gio_hang INTO v_cart FROM gio_hang WHERE ma_tai_khoan=p_ma_tai_khoan;
    INSERT INTO chi_tiet_gio_hang (ma_gio_hang,ma_san_pham,so_luong) VALUES (v_cart,p_ma_san_pham,p_so_luong) ON DUPLICATE KEY UPDATE so_luong=so_luong+p_so_luong;
    SELECT v_cart AS ma_gio_hang, ROW_COUNT() AS affectedRows;
END$$
DROP PROCEDURE IF EXISTS sp_gio_hang_update_item$$
CREATE PROCEDURE sp_gio_hang_update_item(IN p_ma_tai_khoan INT, IN p_ma_san_pham INT, IN p_so_luong INT) BEGIN UPDATE chi_tiet_gio_hang c JOIN gio_hang g ON g.ma_gio_hang=c.ma_gio_hang SET c.so_luong=p_so_luong WHERE g.ma_tai_khoan=p_ma_tai_khoan AND c.ma_san_pham=p_ma_san_pham; SELECT ROW_COUNT() AS affectedRows; END$$
DROP PROCEDURE IF EXISTS sp_gio_hang_delete_item$$
CREATE PROCEDURE sp_gio_hang_delete_item(IN p_ma_tai_khoan INT, IN p_ma_san_pham INT) BEGIN DELETE c FROM chi_tiet_gio_hang c JOIN gio_hang g ON g.ma_gio_hang=c.ma_gio_hang WHERE g.ma_tai_khoan=p_ma_tai_khoan AND c.ma_san_pham=p_ma_san_pham; SELECT ROW_COUNT() AS affectedRows; END$$
DROP PROCEDURE IF EXISTS sp_gio_hang_clear$$
CREATE PROCEDURE sp_gio_hang_clear(IN p_ma_tai_khoan INT) BEGIN DELETE c FROM chi_tiet_gio_hang c JOIN gio_hang g ON g.ma_gio_hang=c.ma_gio_hang WHERE g.ma_tai_khoan=p_ma_tai_khoan; SELECT ROW_COUNT() AS affectedRows; END$$

DROP PROCEDURE IF EXISTS sp_don_hang_create$$
CREATE PROCEDURE sp_don_hang_create(
    IN p_ma_tai_khoan INT, IN p_ho_ten_nguoi_nhan VARCHAR(100), IN p_so_dien_thoai VARCHAR(15),
    IN p_dia_chi_giao_hang VARCHAR(255), IN p_phuong_thuc_thanh_toan VARCHAR(30), IN p_ghi_chu TEXT)
BEGIN
    DECLARE v_cart INT;
    DECLARE v_order INT;
    DECLARE v_total DECIMAL(15,2);
    DECLARE v_count INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    SELECT ma_gio_hang INTO v_cart FROM gio_hang WHERE ma_tai_khoan=p_ma_tai_khoan FOR UPDATE;
    SELECT COUNT(*) INTO v_count FROM chi_tiet_gio_hang WHERE ma_gio_hang=v_cart;
    IF v_cart IS NULL OR v_count=0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Gio hang trong'; END IF;
    SELECT COUNT(*) INTO v_count FROM chi_tiet_gio_hang c JOIN san_pham p ON p.ma_san_pham=c.ma_san_pham WHERE c.ma_gio_hang=v_cart AND c.so_luong>p.so_luong;
    IF v_count>0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='San pham khong du so luong'; END IF;
    SELECT COALESCE(SUM(c.so_luong*p.gia_ban),0) INTO v_total FROM chi_tiet_gio_hang c JOIN san_pham p ON p.ma_san_pham=c.ma_san_pham WHERE c.ma_gio_hang=v_cart;
    INSERT INTO don_hang (ma_tai_khoan,ho_ten_nguoi_nhan,so_dien_thoai,dia_chi_giao_hang,tong_tien,phuong_thuc_thanh_toan,trang_thai,ghi_chu)
    VALUES (p_ma_tai_khoan,p_ho_ten_nguoi_nhan,p_so_dien_thoai,p_dia_chi_giao_hang,v_total,COALESCE(p_phuong_thuc_thanh_toan,'ThanhToanKhiNhanHang'),'ChoXacNhan',p_ghi_chu);
    SET v_order=LAST_INSERT_ID();
    INSERT INTO chi_tiet_don_hang (ma_don_hang,ma_san_pham,ten_san_pham,so_luong,don_gia)
    SELECT v_order,p.ma_san_pham,p.ten_san_pham,c.so_luong,p.gia_ban FROM chi_tiet_gio_hang c JOIN san_pham p ON p.ma_san_pham=c.ma_san_pham WHERE c.ma_gio_hang=v_cart;
    UPDATE san_pham p JOIN chi_tiet_gio_hang c ON c.ma_san_pham=p.ma_san_pham SET p.so_luong=p.so_luong-c.so_luong WHERE c.ma_gio_hang=v_cart;
    DELETE FROM chi_tiet_gio_hang WHERE ma_gio_hang=v_cart;
    COMMIT;
    SELECT v_order AS ma_don_hang, v_total AS tong_tien;
END$$

DROP PROCEDURE IF EXISTS sp_don_hang_list$$
CREATE PROCEDURE sp_don_hang_list(IN p_ma_tai_khoan INT, IN p_is_customer BOOLEAN)
BEGIN
    SELECT dh.*, tk.ten_dang_nhap, tk.ho_ten FROM don_hang dh JOIN tai_khoan tk ON tk.ma_tai_khoan=dh.ma_tai_khoan
    WHERE p_is_customer=FALSE OR dh.ma_tai_khoan=p_ma_tai_khoan ORDER BY dh.ma_don_hang DESC;
    SELECT ctdh.* FROM chi_tiet_don_hang ctdh JOIN don_hang dh ON dh.ma_don_hang=ctdh.ma_don_hang
    WHERE p_is_customer=FALSE OR dh.ma_tai_khoan=p_ma_tai_khoan ORDER BY ctdh.ma_don_hang;
END$$
DROP PROCEDURE IF EXISTS sp_don_hang_get_by_id$$
CREATE PROCEDURE sp_don_hang_get_by_id(IN p_id INT)
BEGIN
    SELECT dh.*, tk.ten_dang_nhap, tk.ho_ten FROM don_hang dh JOIN tai_khoan tk ON tk.ma_tai_khoan=dh.ma_tai_khoan WHERE dh.ma_don_hang=p_id;
    SELECT * FROM chi_tiet_don_hang WHERE ma_don_hang=p_id;
END$$

DROP PROCEDURE IF EXISTS sp_don_hang_update_status$$
CREATE PROCEDURE sp_don_hang_update_status(IN p_id INT, IN p_trang_thai VARCHAR(20))
BEGIN
    DECLARE v_old VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    SELECT trang_thai INTO v_old FROM don_hang WHERE ma_don_hang=p_id FOR UPDATE;
    IF v_old IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Khong tim thay don hang'; END IF;
    IF NOT ((v_old='ChoXacNhan' AND p_trang_thai IN ('DaXacNhan','DaHuy')) OR (v_old='DaXacNhan' AND p_trang_thai IN ('DangGiao','DaHuy')) OR (v_old='DangGiao' AND p_trang_thai IN ('DaGiao','DaHuy'))) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Chuyen trang thai khong hop le';
    END IF;
    IF p_trang_thai='DaHuy' THEN UPDATE san_pham p JOIN chi_tiet_don_hang c ON c.ma_san_pham=p.ma_san_pham SET p.so_luong=p.so_luong+c.so_luong WHERE c.ma_don_hang=p_id; END IF;
    UPDATE don_hang SET trang_thai=p_trang_thai WHERE ma_don_hang=p_id;
    COMMIT; SELECT p_id AS ma_don_hang, p_trang_thai AS trang_thai;
END$$

DROP PROCEDURE IF EXISTS sp_don_hang_cancel$$
CREATE PROCEDURE sp_don_hang_cancel(IN p_id INT, IN p_ma_tai_khoan INT)
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    SELECT trang_thai INTO v_status FROM don_hang WHERE ma_don_hang=p_id AND ma_tai_khoan=p_ma_tai_khoan FOR UPDATE;
    IF v_status IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Khong tim thay don hang cua ban'; END IF;
    IF v_status<>'ChoXacNhan' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Chi huy don dang cho xac nhan'; END IF;
    UPDATE san_pham p JOIN chi_tiet_don_hang c ON c.ma_san_pham=p.ma_san_pham SET p.so_luong=p.so_luong+c.so_luong WHERE c.ma_don_hang=p_id;
    UPDATE don_hang SET trang_thai='DaHuy' WHERE ma_don_hang=p_id;
    COMMIT; SELECT p_id AS ma_don_hang, 'DaHuy' AS trang_thai;
END$$
DROP PROCEDURE IF EXISTS sp_don_hang_delete$$
CREATE PROCEDURE sp_don_hang_delete(IN p_id INT) BEGIN DELETE FROM don_hang WHERE ma_don_hang=p_id AND trang_thai IN ('DaGiao','DaHuy'); SELECT ROW_COUNT() AS affectedRows; END$$

DROP PROCEDURE IF EXISTS sp_danh_gia_list$$
CREATE PROCEDURE sp_danh_gia_list(IN p_ma_san_pham INT, IN p_so_sao INT, IN p_limit INT, IN p_offset INT)
BEGIN
    SELECT COUNT(*) AS total FROM danh_gia WHERE (p_ma_san_pham IS NULL OR ma_san_pham=p_ma_san_pham) AND (p_so_sao IS NULL OR so_sao=p_so_sao);
    SELECT dg.*, tk.ho_ten, sp.ten_san_pham FROM danh_gia dg JOIN tai_khoan tk ON tk.ma_tai_khoan=dg.ma_tai_khoan JOIN san_pham sp ON sp.ma_san_pham=dg.ma_san_pham
    WHERE (p_ma_san_pham IS NULL OR dg.ma_san_pham=p_ma_san_pham) AND (p_so_sao IS NULL OR dg.so_sao=p_so_sao) ORDER BY dg.ma_danh_gia DESC LIMIT p_limit OFFSET p_offset;
END$$
DROP PROCEDURE IF EXISTS sp_danh_gia_list_by_product$$
CREATE PROCEDURE sp_danh_gia_list_by_product(IN p_ma_san_pham INT) BEGIN SELECT dg.*,tk.ho_ten FROM danh_gia dg JOIN tai_khoan tk ON tk.ma_tai_khoan=dg.ma_tai_khoan WHERE dg.ma_san_pham=p_ma_san_pham ORDER BY dg.ma_danh_gia DESC; END$$
DROP PROCEDURE IF EXISTS sp_danh_gia_get_by_id$$
CREATE PROCEDURE sp_danh_gia_get_by_id(IN p_id INT) BEGIN SELECT * FROM danh_gia WHERE ma_danh_gia=p_id; END$$
DROP PROCEDURE IF EXISTS sp_danh_gia_create$$
CREATE PROCEDURE sp_danh_gia_create(IN p_ma_san_pham INT, IN p_ma_tai_khoan INT, IN p_so_sao INT, IN p_noi_dung TEXT)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM san_pham WHERE ma_san_pham=p_ma_san_pham) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='San pham khong ton tai';
    END IF;
    INSERT INTO danh_gia (ma_san_pham,ma_tai_khoan,so_sao,noi_dung) VALUES (p_ma_san_pham,p_ma_tai_khoan,p_so_sao,p_noi_dung);
    SELECT LAST_INSERT_ID() AS insertId, ROW_COUNT() AS affectedRows;
END$$
DROP PROCEDURE IF EXISTS sp_danh_gia_update$$
CREATE PROCEDURE sp_danh_gia_update(IN p_id INT, IN p_so_sao INT, IN p_noi_dung TEXT) BEGIN UPDATE danh_gia SET so_sao=COALESCE(p_so_sao,so_sao), noi_dung=COALESCE(p_noi_dung,noi_dung) WHERE ma_danh_gia=p_id; SELECT ROW_COUNT() AS affectedRows; END$$
DROP PROCEDURE IF EXISTS sp_danh_gia_delete$$
CREATE PROCEDURE sp_danh_gia_delete(IN p_id INT) BEGIN DELETE FROM danh_gia WHERE ma_danh_gia=p_id; SELECT ROW_COUNT() AS affectedRows; END$$

DROP PROCEDURE IF EXISTS sp_lien_he_create$$
CREATE PROCEDURE sp_lien_he_create(IN p_ma_tai_khoan INT, IN p_ho_ten VARCHAR(100), IN p_email VARCHAR(100), IN p_so_dien_thoai VARCHAR(15), IN p_tieu_de VARCHAR(200), IN p_noi_dung TEXT)
BEGIN INSERT INTO lien_he (ma_tai_khoan,ho_ten,email,so_dien_thoai,tieu_de,noi_dung,trang_thai) VALUES (p_ma_tai_khoan,p_ho_ten,p_email,p_so_dien_thoai,p_tieu_de,p_noi_dung,'ChuaXuLy'); SELECT LAST_INSERT_ID() AS insertId, ROW_COUNT() AS affectedRows; END$$
DROP PROCEDURE IF EXISTS sp_lien_he_list$$
CREATE PROCEDURE sp_lien_he_list() BEGIN SELECT * FROM lien_he ORDER BY ma_lien_he DESC; END$$
DROP PROCEDURE IF EXISTS sp_lien_he_get_by_id$$
CREATE PROCEDURE sp_lien_he_get_by_id(IN p_id INT) BEGIN SELECT * FROM lien_he WHERE ma_lien_he=p_id; END$$
DROP PROCEDURE IF EXISTS sp_lien_he_update_status$$
CREATE PROCEDURE sp_lien_he_update_status(IN p_id INT, IN p_trang_thai VARCHAR(20)) BEGIN UPDATE lien_he SET trang_thai=p_trang_thai WHERE ma_lien_he=p_id; SELECT ROW_COUNT() AS affectedRows; END$$
DROP PROCEDURE IF EXISTS sp_lien_he_delete$$
CREATE PROCEDURE sp_lien_he_delete(IN p_id INT) BEGIN DELETE FROM lien_he WHERE ma_lien_he=p_id; SELECT ROW_COUNT() AS affectedRows; END$$

DROP PROCEDURE IF EXISTS sp_nhan_vien_list$$
CREATE PROCEDURE sp_nhan_vien_list() BEGIN SELECT * FROM nhan_vien ORDER BY ma_nhan_vien DESC; END$$
DROP PROCEDURE IF EXISTS sp_nhan_vien_get_by_id$$
CREATE PROCEDURE sp_nhan_vien_get_by_id(IN p_id INT) BEGIN SELECT * FROM nhan_vien WHERE ma_nhan_vien=p_id; END$$
DROP PROCEDURE IF EXISTS sp_nhan_vien_validate_account$$
CREATE PROCEDURE sp_nhan_vien_validate_account(IN p_ma_tai_khoan INT, IN p_ma_nhan_vien INT)
BEGIN
        SELECT ma_tai_khoan FROM tai_khoan WHERE ma_tai_khoan=p_ma_tai_khoan AND vai_tro IN ('Admin','NhanVien');
        SELECT ma_nhan_vien FROM nhan_vien WHERE ma_tai_khoan=p_ma_tai_khoan AND ma_nhan_vien<>COALESCE(p_ma_nhan_vien,0);
END$$
DROP PROCEDURE IF EXISTS sp_nhan_vien_create$$
CREATE PROCEDURE sp_nhan_vien_create(IN p_ma_tai_khoan INT, IN p_ho_ten VARCHAR(100), IN p_chuc_vu VARCHAR(100), IN p_so_dien_thoai VARCHAR(15), IN p_email VARCHAR(100), IN p_ngay_vao_lam DATE, IN p_luong DECIMAL(15,2), IN p_trang_thai VARCHAR(20))
BEGIN INSERT INTO nhan_vien (ma_tai_khoan,ho_ten,chuc_vu,so_dien_thoai,email,ngay_vao_lam,luong,trang_thai) VALUES (p_ma_tai_khoan,p_ho_ten,p_chuc_vu,p_so_dien_thoai,p_email,p_ngay_vao_lam,p_luong,p_trang_thai); SELECT LAST_INSERT_ID() AS insertId, ROW_COUNT() AS affectedRows; END$$
DROP PROCEDURE IF EXISTS sp_nhan_vien_update$$
CREATE PROCEDURE sp_nhan_vien_update(IN p_id INT, IN p_has_account BOOLEAN, IN p_ma_tai_khoan INT, IN p_ho_ten VARCHAR(100), IN p_chuc_vu VARCHAR(100), IN p_so_dien_thoai VARCHAR(15), IN p_email VARCHAR(100), IN p_ngay_vao_lam DATE, IN p_luong DECIMAL(15,2), IN p_trang_thai VARCHAR(20))
BEGIN UPDATE nhan_vien SET ma_tai_khoan=CASE WHEN p_has_account THEN p_ma_tai_khoan ELSE ma_tai_khoan END, ho_ten=COALESCE(p_ho_ten,ho_ten), chuc_vu=COALESCE(p_chuc_vu,chuc_vu), so_dien_thoai=COALESCE(p_so_dien_thoai,so_dien_thoai), email=COALESCE(p_email,email), ngay_vao_lam=COALESCE(p_ngay_vao_lam,ngay_vao_lam), luong=COALESCE(p_luong,luong), trang_thai=COALESCE(p_trang_thai,trang_thai) WHERE ma_nhan_vien=p_id; SELECT ROW_COUNT() AS affectedRows; END$$
DROP PROCEDURE IF EXISTS sp_nhan_vien_delete$$
CREATE PROCEDURE sp_nhan_vien_delete(IN p_id INT) BEGIN DELETE FROM nhan_vien WHERE ma_nhan_vien=p_id; SELECT ROW_COUNT() AS affectedRows; END$$

DROP PROCEDURE IF EXISTS sp_tai_khoan_list$$
CREATE PROCEDURE sp_tai_khoan_list() BEGIN SELECT ma_tai_khoan,ten_dang_nhap,ho_ten,email,so_dien_thoai,dia_chi,vai_tro,trang_thai,ngay_tao FROM tai_khoan ORDER BY ma_tai_khoan DESC; END$$
DROP PROCEDURE IF EXISTS sp_tai_khoan_get_by_id$$
CREATE PROCEDURE sp_tai_khoan_get_by_id(IN p_id INT) BEGIN SELECT ma_tai_khoan,ten_dang_nhap,ho_ten,email,so_dien_thoai,dia_chi,vai_tro,trang_thai,ngay_tao FROM tai_khoan WHERE ma_tai_khoan=p_id; END$$
DROP PROCEDURE IF EXISTS sp_tai_khoan_find_by_email$$
CREATE PROCEDURE sp_tai_khoan_find_by_email(IN p_email VARCHAR(100), IN p_exclude_id INT) BEGIN SELECT ma_tai_khoan,email FROM tai_khoan WHERE email=p_email AND ma_tai_khoan<>COALESCE(p_exclude_id,0); END$$
DROP PROCEDURE IF EXISTS sp_tai_khoan_update$$
CREATE PROCEDURE sp_tai_khoan_update(IN p_id INT, IN p_ho_ten VARCHAR(100), IN p_email VARCHAR(100), IN p_so_dien_thoai VARCHAR(15), IN p_dia_chi VARCHAR(255), IN p_vai_tro VARCHAR(20), IN p_trang_thai VARCHAR(20))
BEGIN UPDATE tai_khoan SET ho_ten=COALESCE(p_ho_ten,ho_ten), email=COALESCE(p_email,email), so_dien_thoai=COALESCE(p_so_dien_thoai,so_dien_thoai), dia_chi=COALESCE(p_dia_chi,dia_chi), vai_tro=COALESCE(p_vai_tro,vai_tro), trang_thai=COALESCE(p_trang_thai,trang_thai) WHERE ma_tai_khoan=p_id; SELECT ROW_COUNT() AS affectedRows; END$$
DROP PROCEDURE IF EXISTS sp_tai_khoan_delete$$
CREATE PROCEDURE sp_tai_khoan_delete(IN p_id INT) BEGIN DELETE FROM tai_khoan WHERE ma_tai_khoan=p_id; SELECT ROW_COUNT() AS affectedRows; END$$

DROP PROCEDURE IF EXISTS sp_dashboard_summary$$
CREATE PROCEDURE sp_dashboard_summary()
BEGIN
        SELECT (SELECT COUNT(*) FROM san_pham) AS tong_san_pham, (SELECT COUNT(*) FROM tai_khoan WHERE vai_tro='KhachHang') AS tong_khach_hang,
            (SELECT COUNT(*) FROM nhan_vien) AS tong_nhan_vien, (SELECT COUNT(*) FROM don_hang) AS tong_don_hang,
            (SELECT COALESCE(SUM(tong_tien),0) FROM don_hang WHERE trang_thai='DaGiao') AS tong_doanh_thu,
            (SELECT COUNT(*) FROM don_hang WHERE trang_thai='DaXacNhan') AS so_don_da_xac_nhan, (SELECT COUNT(*) FROM don_hang WHERE trang_thai='ChoXacNhan') AS so_don_cho_xac_nhan,
            (SELECT COUNT(*) FROM don_hang WHERE trang_thai='DangGiao') AS so_don_dang_giao, (SELECT COUNT(*) FROM don_hang WHERE trang_thai='DaGiao') AS so_don_da_giao,
            (SELECT COUNT(*) FROM don_hang WHERE trang_thai='DaHuy') AS so_don_da_huy;
        SELECT DATE_FORMAT(ngay_dat,'%Y-%m') AS thang, SUM(tong_tien) AS doanh_thu FROM don_hang WHERE trang_thai='DaGiao' AND ngay_dat>=DATE_FORMAT(DATE_SUB(CURDATE(),INTERVAL 11 MONTH),'%Y-%m-01') GROUP BY DATE_FORMAT(ngay_dat,'%Y-%m') ORDER BY thang;
END$$

DELIMITER ;

-- =========================================================
-- CAC LENH KIEM TRA
-- =========================================================
SELECT 'TAI KHOAN' AS bang, COUNT(*) AS so_luong FROM tai_khoan
UNION ALL
SELECT 'NHAN VIEN', COUNT(*) FROM nhan_vien
UNION ALL
SELECT 'DANH MUC', COUNT(*) FROM danh_muc
UNION ALL
SELECT 'THUONG HIEU', COUNT(*) FROM thuong_hieu
UNION ALL
SELECT 'SAN PHAM', COUNT(*) FROM san_pham
UNION ALL
SELECT 'CHI TIET SAN PHAM', COUNT(*) FROM chi_tiet_san_pham
UNION ALL
SELECT 'GIO HANG', COUNT(*) FROM gio_hang
UNION ALL
SELECT 'CHI TIET GIO HANG', COUNT(*) FROM chi_tiet_gio_hang
UNION ALL
SELECT 'DON HANG', COUNT(*) FROM don_hang
UNION ALL
SELECT 'CHI TIET DON HANG', COUNT(*) FROM chi_tiet_don_hang
UNION ALL
SELECT 'DANH GIA', COUNT(*) FROM danh_gia
UNION ALL
SELECT 'LIEN HE', COUNT(*) FROM lien_he;

-- Xem danh sach san pham
SELECT
    sp.ma_san_pham,
    sp.ma_san_pham_code,
    sp.ten_san_pham,
    dm.ten_danh_muc,
    th.ten_thuong_hieu,
    sp.gia_ban,
    sp.so_luong
FROM san_pham sp
JOIN danh_muc dm
    ON sp.ma_danh_muc = dm.ma_danh_muc
JOIN thuong_hieu th
    ON sp.ma_thuong_hieu = th.ma_thuong_hieu;

-- Xem don hang
SELECT
    dh.ma_don_hang,
    tk.ho_ten,
    dh.tong_tien,
    dh.phuong_thuc_thanh_toan,
    dh.trang_thai,
    dh.ngay_dat
FROM don_hang dh
JOIN tai_khoan tk
    ON dh.ma_tai_khoan = tk.ma_tai_khoan;

-- =========================================================
-- KET THUC
-- =========================================================
