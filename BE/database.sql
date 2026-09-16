-- =========================================================
-- CUA HANG DIEN GIA DUNG
-- DATABASE DON GIAN - CHAY TRUC TIEP TREN MYSQL WORKBENCH
-- =========================================================

DROP DATABASE IF EXISTS dien_gia_dung;

CREATE DATABASE dien_gia_dung
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

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
('admin', '123456', 'Quan tri vien', 'admin@gmail.com', '0900000001', 'Hung Yen', 'Admin'),
('nhanvien01', '123456', 'Nguyen Van An', 'nhanvien@gmail.com', '0900000002', 'Hung Yen', 'NhanVien'),
('huy2005', '123456', 'Nguyen Duc Huy', 'huy@gmail.com', '0900000003', 'Hung Yen', 'KhachHang'),
('ngoc2004', '123456', 'Tran Thi Ngoc', 'ngoc@gmail.com', '0900000004', 'Ha Noi', 'KhachHang'),
('nam2003', '123456', 'Le Van Nam', 'nam@gmail.com', '0900000005', 'Hai Phong', 'KhachHang');

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
