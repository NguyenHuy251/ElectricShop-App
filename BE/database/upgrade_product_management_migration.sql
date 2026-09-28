-- =========================================================
-- MIGRATION NANG CAP QUAN LY SAN PHAM / THONG SO KY THUAT
-- Database dang co: dien_gia_dung
-- Yeu cau: MySQL 8.0+
-- KHONG xoa database va khong xoa bang don hang/gio hang.
-- Nen backup database truoc khi chay.
-- =========================================================

USE dien_gia_dung;

-- 1. Giu bang cu tam thoi de chuyen du lieu.
RENAME TABLE chi_tiet_san_pham TO chi_tiet_san_pham_legacy;

-- =========================================================
-- 6. HE THONG THONG SO KY THUAT - NORMALIZED
-- =========================================================
-- Thay cho chi_tiet_san_pham dang gom nhieu truong co dinh.
-- Mo hinh moi: Nhom thong so -> Dinh nghia thong so -> Gia tri cua san pham.

CREATE TABLE nhom_thong_so (
    ma_nhom_thong_so INT AUTO_INCREMENT PRIMARY KEY,
    ten_nhom_thong_so VARCHAR(100) NOT NULL UNIQUE,
    thu_tu_hien_thi INT DEFAULT 0,
    trang_thai BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE thong_so (
    ma_thong_so INT AUTO_INCREMENT PRIMARY KEY,
    ma_nhom_thong_so INT NOT NULL,
    ten_thong_so VARCHAR(150) NOT NULL,
    kieu_du_lieu ENUM('TEXT', 'NUMBER', 'BOOLEAN', 'OPTION') DEFAULT 'TEXT',
    don_vi VARCHAR(30) NULL,
    cho_phep_loc BOOLEAN DEFAULT FALSE,
    thu_tu_hien_thi INT DEFAULT 0,
    trang_thai BOOLEAN DEFAULT TRUE,

    UNIQUE KEY uq_thong_so_nhom_ten (ma_nhom_thong_so, ten_thong_so),

    FOREIGN KEY (ma_nhom_thong_so)
        REFERENCES nhom_thong_so(ma_nhom_thong_so)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Xac dinh thong so nao duoc su dung cho tung danh muc san pham.
CREATE TABLE danh_muc_thong_so (
    ma_danh_muc INT NOT NULL,
    ma_thong_so INT NOT NULL,
    bat_buoc BOOLEAN DEFAULT FALSE,
    thu_tu_hien_thi INT DEFAULT 0,

    PRIMARY KEY (ma_danh_muc, ma_thong_so),

    FOREIGN KEY (ma_danh_muc)
        REFERENCES danh_muc(ma_danh_muc)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (ma_thong_so)
        REFERENCES thong_so(ma_thong_so)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Moi dong la 1 thong so rieng cua 1 san pham.
CREATE TABLE thong_so_san_pham (
    ma_san_pham INT NOT NULL,
    ma_thong_so INT NOT NULL,
    gia_tri VARCHAR(1000) NULL,
    gia_tri_so DECIMAL(18,4) NULL,
    gia_tri_bool BOOLEAN NULL,

    PRIMARY KEY (ma_san_pham, ma_thong_so),
    INDEX idx_tsp_thong_so_text (ma_thong_so, gia_tri(191)),
    INDEX idx_tsp_thong_so_number (ma_thong_so, gia_tri_so),

    FOREIGN KEY (ma_san_pham)
        REFERENCES san_pham(ma_san_pham)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (ma_thong_so)
        REFERENCES thong_so(ma_thong_so)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Cho phep mot san pham co nhieu anh, anh chinh tach rieng khoi duong dan anh.
CREATE TABLE hinh_anh_san_pham (
    ma_hinh_anh INT AUTO_INCREMENT PRIMARY KEY,
    ma_san_pham INT NOT NULL,
    duong_dan VARCHAR(500) NOT NULL,
    mo_ta VARCHAR(255),
    la_anh_chinh BOOLEAN DEFAULT FALSE,
    thu_tu_hien_thi INT DEFAULT 0,

    FOREIGN KEY (ma_san_pham)
        REFERENCES san_pham(ma_san_pham)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_hinh_anh_san_pham (ma_san_pham, thu_tu_hien_thi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- DU LIEU MAU - NHOM THONG SO / DINH NGHIA THONG SO
-- =========================================================
INSERT INTO nhom_thong_so (ten_nhom_thong_so, thu_tu_hien_thi)
VALUES
('Thong tin co ban', 1),
('Kich thuoc va nang luc', 2),
('Dien nang va hieu suat', 3),
('Cong nghe', 4),
('Van hanh va an toan', 5);

INSERT INTO thong_so
(ma_nhom_thong_so, ten_thong_so, kieu_du_lieu, don_vi, cho_phep_loc, thu_tu_hien_thi)
VALUES
-- Thong tin co ban
(1, 'Mau sac', 'TEXT', NULL, TRUE, 1),
(1, 'Xuat xu', 'TEXT', NULL, TRUE, 2),
(1, 'Loai san pham', 'OPTION', NULL, TRUE, 3),
(1, 'So cua', 'NUMBER', 'cua', TRUE, 4),

-- Kich thuoc va nang luc
(2, 'Kich thuoc', 'TEXT', 'cm', FALSE, 1),
(2, 'Dung tich', 'NUMBER', 'L', TRUE, 2),
(2, 'Khoi luong giat', 'NUMBER', 'kg', TRUE, 3),
(2, 'So vung nau', 'NUMBER', 'vung', TRUE, 4),
(2, 'So loi loc', 'NUMBER', 'loi', TRUE, 5),

-- Dien nang va hieu suat
(3, 'Cong suat', 'NUMBER', 'W', TRUE, 1),
(3, 'Cong suat lam lanh', 'NUMBER', 'BTU', TRUE, 2),
(3, 'Toc do vat', 'NUMBER', 'vong/phut', TRUE, 3),

-- Cong nghe
(4, 'Cong nghe tiet kiem dien', 'TEXT', NULL, TRUE, 1),
(4, 'Cong nghe lam lanh', 'TEXT', NULL, TRUE, 2),
(4, 'Kieu may / kieu cua', 'OPTION', NULL, TRUE, 3),
(4, 'Hien thi', 'TEXT', NULL, TRUE, 4),
(4, 'Bo loc', 'TEXT', NULL, TRUE, 5),
(4, 'Cong nghe loc nuoc', 'TEXT', NULL, TRUE, 6),
(4, 'Loai noi / be mat', 'TEXT', NULL, TRUE, 7),
(4, 'So canh quat', 'NUMBER', 'canh', TRUE, 8),

-- Van hanh va an toan
(5, 'Tinh nang an toan', 'TEXT', NULL, FALSE, 1),
(5, 'Loai gas', 'OPTION', NULL, TRUE, 2),
(5, 'Chuc nang', 'TEXT', NULL, FALSE, 3);

-- =========================================================
-- THONG SO THEO DANH MUC
-- =========================================================
-- Tu lanh
INSERT INTO danh_muc_thong_so (ma_danh_muc, ma_thong_so, bat_buoc, thu_tu_hien_thi)
SELECT 1, ma_thong_so, TRUE, thu_tu_hien_thi FROM thong_so
WHERE ma_thong_so IN (1,2,4,5,6,10,13,14);

-- May giat
INSERT INTO danh_muc_thong_so (ma_danh_muc, ma_thong_so, bat_buoc, thu_tu_hien_thi)
SELECT 2, ma_thong_so, TRUE, thu_tu_hien_thi FROM thong_so
WHERE ma_thong_so IN (1,2,5,7,10,12,15,16);

-- Lo vi song
INSERT INTO danh_muc_thong_so (ma_danh_muc, ma_thong_so, bat_buoc, thu_tu_hien_thi)
SELECT 3, ma_thong_so, TRUE, thu_tu_hien_thi FROM thong_so
WHERE ma_thong_so IN (1,2,5,6,10,16,19);

-- Dieu hoa
INSERT INTO danh_muc_thong_so (ma_danh_muc, ma_thong_so, bat_buoc, thu_tu_hien_thi)
SELECT 4, ma_thong_so, TRUE, thu_tu_hien_thi FROM thong_so
WHERE ma_thong_so IN (1,2,5,10,11,13,17,22,23);

-- Bep dien
INSERT INTO danh_muc_thong_so (ma_danh_muc, ma_thong_so, bat_buoc, thu_tu_hien_thi)
SELECT 5, ma_thong_so, TRUE, thu_tu_hien_thi FROM thong_so
WHERE ma_thong_so IN (1,2,5,8,10,19,21);

-- Noi com dien
INSERT INTO danh_muc_thong_so (ma_danh_muc, ma_thong_so, bat_buoc, thu_tu_hien_thi)
SELECT 6, ma_thong_so, TRUE, thu_tu_hien_thi FROM thong_so
WHERE ma_thong_so IN (1,2,5,6,10,19,21);

-- May hut bui
INSERT INTO danh_muc_thong_so (ma_danh_muc, ma_thong_so, bat_buoc, thu_tu_hien_thi)
SELECT 7, ma_thong_so, TRUE, thu_tu_hien_thi FROM thong_so
WHERE ma_thong_so IN (1,2,5,10,17,21);

-- Am sieu toc
INSERT INTO danh_muc_thong_so (ma_danh_muc, ma_thong_so, bat_buoc, thu_tu_hien_thi)
SELECT 8, ma_thong_so, TRUE, thu_tu_hien_thi FROM thong_so
WHERE ma_thong_so IN (1,2,5,6,10,21);

-- May loc nuoc
INSERT INTO danh_muc_thong_so (ma_danh_muc, ma_thong_so, bat_buoc, thu_tu_hien_thi)
SELECT 9, ma_thong_so, TRUE, thu_tu_hien_thi FROM thong_so
WHERE ma_thong_so IN (1,2,5,9,10,18,21);

-- Quat dien
INSERT INTO danh_muc_thong_so (ma_danh_muc, ma_thong_so, bat_buoc, thu_tu_hien_thi)
SELECT 10, ma_thong_so, TRUE, thu_tu_hien_thi FROM thong_so
WHERE ma_thong_so IN (1,2,5,10,20,24);

-- =========================================================
-- DU LIEU MAU - THONG SO SAN PHAM
-- =========================================================
-- Tieu chi chung duoc chuyen tu du lieu cu sang tung dong rieng.
INSERT INTO thong_so_san_pham (ma_san_pham, ma_thong_so, gia_tri, gia_tri_so)
SELECT c.ma_san_pham, 1, c.mau_sac, NULL FROM chi_tiet_san_pham_legacy c WHERE c.mau_sac IS NOT NULL;
INSERT INTO thong_so_san_pham (ma_san_pham, ma_thong_so, gia_tri, gia_tri_so)
SELECT c.ma_san_pham, 2, c.xuat_xu, NULL FROM chi_tiet_san_pham_legacy c WHERE c.xuat_xu IS NOT NULL;
INSERT INTO thong_so_san_pham (ma_san_pham, ma_thong_so, gia_tri, gia_tri_so)
SELECT c.ma_san_pham, 5, c.kich_thuoc, NULL FROM chi_tiet_san_pham_legacy c WHERE c.kich_thuoc IS NOT NULL;

-- Dung tich cua tu lanh, lo vi song, noi com, am sieu toc.
INSERT INTO thong_so_san_pham (ma_san_pham, ma_thong_so, gia_tri, gia_tri_so)
SELECT c.ma_san_pham, 6, c.dung_tich,
       CAST(REPLACE(REGEXP_SUBSTR(c.dung_tich, '[0-9]+(\.[0-9]+)?'), ',', '.') AS DECIMAL(18,4))
FROM chi_tiet_san_pham_legacy c
JOIN san_pham sp ON sp.ma_san_pham=c.ma_san_pham
WHERE c.dung_tich IS NOT NULL AND sp.ma_danh_muc IN (1,3,6,8);

-- Khoi luong giat.
INSERT INTO thong_so_san_pham (ma_san_pham, ma_thong_so, gia_tri, gia_tri_so)
SELECT c.ma_san_pham, 7, c.dung_tich,
       CAST(REGEXP_SUBSTR(c.dung_tich, '[0-9]+(\.[0-9]+)?') AS DECIMAL(18,4))
FROM chi_tiet_san_pham_legacy c
JOIN san_pham sp ON sp.ma_san_pham=c.ma_san_pham
WHERE c.dung_tich IS NOT NULL AND sp.ma_danh_muc=2;

-- Cong suat dien.
INSERT INTO thong_so_san_pham (ma_san_pham, ma_thong_so, gia_tri, gia_tri_so)
SELECT c.ma_san_pham, 10, c.cong_suat,
       CAST(REGEXP_SUBSTR(c.cong_suat, '[0-9]+(\.[0-9]+)?') AS DECIMAL(18,4))
FROM chi_tiet_san_pham_legacy c
JOIN san_pham sp ON sp.ma_san_pham=c.ma_san_pham
WHERE c.cong_suat IS NOT NULL AND sp.ma_danh_muc NOT IN (4);

-- So loi loc cua may loc nuoc tu gia tri dung_tich cu.
INSERT INTO thong_so_san_pham (ma_san_pham, ma_thong_so, gia_tri, gia_tri_so)
SELECT c.ma_san_pham, 9, c.dung_tich,
       CAST(REGEXP_SUBSTR(c.dung_tich, '[0-9]+') AS DECIMAL(18,4))
FROM chi_tiet_san_pham_legacy c
JOIN san_pham sp ON sp.ma_san_pham=c.ma_san_pham
WHERE sp.ma_danh_muc=9 AND c.dung_tich LIKE '%loi';

-- Cong suat lam lanh cua dieu hoa.
INSERT INTO thong_so_san_pham (ma_san_pham, ma_thong_so, gia_tri, gia_tri_so)
SELECT c.ma_san_pham, 11, c.cong_suat,
       CAST(REGEXP_SUBSTR(c.cong_suat, '[0-9]+(\.[0-9]+)?') AS DECIMAL(18,4))
FROM chi_tiet_san_pham_legacy c
JOIN san_pham sp ON sp.ma_san_pham=c.ma_san_pham
WHERE c.cong_suat IS NOT NULL AND sp.ma_danh_muc=4;

-- Chuyen gia tri thong_so_khac cua du lieu mau thanh cac thong so co nghia.
INSERT INTO thong_so_san_pham (ma_san_pham, ma_thong_so, gia_tri, gia_tri_so)
SELECT ma_san_pham, 13, thong_so_khac, NULL
FROM chi_tiet_san_pham_legacy c JOIN san_pham sp USING (ma_san_pham)
WHERE sp.ma_danh_muc IN (1,4) AND thong_so_khac IS NOT NULL;

-- May giat: Cua truoc la kieu cua; Inverter la cong nghe tiet kiem dien.
INSERT INTO thong_so_san_pham (ma_san_pham, ma_thong_so, gia_tri, gia_tri_so)
SELECT ma_san_pham, 15, thong_so_khac, NULL
FROM chi_tiet_san_pham_legacy c JOIN san_pham sp USING (ma_san_pham)
WHERE sp.ma_danh_muc=2 AND thong_so_khac='Cua truoc';
INSERT INTO thong_so_san_pham (ma_san_pham, ma_thong_so, gia_tri, gia_tri_so)
SELECT ma_san_pham, 13, thong_so_khac, NULL
FROM chi_tiet_san_pham_legacy c JOIN san_pham sp USING (ma_san_pham)
WHERE sp.ma_danh_muc=2 AND thong_so_khac='Inverter';

INSERT INTO thong_so_san_pham (ma_san_pham, ma_thong_so, gia_tri, gia_tri_so)
SELECT ma_san_pham, 16, thong_so_khac, NULL
FROM chi_tiet_san_pham_legacy c JOIN san_pham sp USING (ma_san_pham)
WHERE sp.ma_danh_muc=3 AND thong_so_khac IS NOT NULL;

INSERT INTO thong_so_san_pham (ma_san_pham, ma_thong_so, gia_tri, gia_tri_so)
SELECT ma_san_pham, 19, thong_so_khac, NULL
FROM chi_tiet_san_pham_legacy c JOIN san_pham sp USING (ma_san_pham)
WHERE sp.ma_danh_muc IN (5,6) AND thong_so_khac IS NOT NULL;

INSERT INTO thong_so_san_pham (ma_san_pham, ma_thong_so, gia_tri, gia_tri_so)
SELECT ma_san_pham, 17, thong_so_khac, NULL
FROM chi_tiet_san_pham_legacy c JOIN san_pham sp USING (ma_san_pham)
WHERE sp.ma_danh_muc=7 AND thong_so_khac IS NOT NULL;

INSERT INTO thong_so_san_pham (ma_san_pham, ma_thong_so, gia_tri, gia_tri_so)
SELECT ma_san_pham, 21, thong_so_khac, NULL
FROM chi_tiet_san_pham_legacy c JOIN san_pham sp USING (ma_san_pham)
WHERE sp.ma_danh_muc=8 AND thong_so_khac IS NOT NULL;

INSERT INTO thong_so_san_pham (ma_san_pham, ma_thong_so, gia_tri, gia_tri_so)
SELECT ma_san_pham, 18, thong_so_khac, NULL
FROM chi_tiet_san_pham_legacy c JOIN san_pham sp USING (ma_san_pham)
WHERE sp.ma_danh_muc=9 AND thong_so_khac IS NOT NULL;

INSERT INTO thong_so_san_pham (ma_san_pham, ma_thong_so, gia_tri, gia_tri_so)
SELECT ma_san_pham, 20, REPLACE(thong_so_khac, ' canh', ''),
       CAST(REGEXP_SUBSTR(thong_so_khac, '[0-9]+') AS DECIMAL(18,4))
FROM chi_tiet_san_pham_legacy c JOIN san_pham sp USING (ma_san_pham)
WHERE sp.ma_danh_muc=10 AND thong_so_khac IS NOT NULL;

-- Anh san pham hien tai duoc chuyen sang bang anh rieng.
INSERT INTO hinh_anh_san_pham (ma_san_pham, duong_dan, mo_ta, la_anh_chinh, thu_tu_hien_thi)
SELECT ma_san_pham, hinh_anh, ten_san_pham, TRUE, 1
FROM san_pham
WHERE hinh_anh IS NOT NULL AND hinh_anh <> '';

DROP TABLE chi_tiet_san_pham_legacy;

DROP PROCEDURE IF EXISTS sp_san_pham_list$$
CREATE PROCEDURE sp_san_pham_list(
    IN p_search VARCHAR(200), IN p_ma_danh_muc INT, IN p_ma_thuong_hieu INT,
    IN p_min_price DECIMAL(15,2), IN p_max_price DECIMAL(15,2), IN p_limit INT, IN p_offset INT)
BEGIN
    SELECT COUNT(*) AS total
    FROM san_pham sp
    LEFT JOIN danh_muc dm ON dm.ma_danh_muc = sp.ma_danh_muc
    WHERE (p_search IS NULL OR p_search = ''
        OR sp.ten_san_pham LIKE CONCAT('%', p_search, '%')
        OR sp.ma_san_pham_code LIKE CONCAT('%', p_search, '%')
        OR dm.ten_danh_muc LIKE CONCAT('%', p_search, '%'))
      AND (p_ma_danh_muc IS NULL OR sp.ma_danh_muc = p_ma_danh_muc)
      AND (p_ma_thuong_hieu IS NULL OR sp.ma_thuong_hieu = p_ma_thuong_hieu)
      AND (p_min_price IS NULL OR sp.gia_ban >= p_min_price)
      AND (p_max_price IS NULL OR sp.gia_ban <= p_max_price);

    SELECT
        sp.*, dm.ten_danh_muc, th.ten_thuong_hieu,
        COALESCE((
            SELECT JSON_ARRAYAGG(JSON_OBJECT(
                'ma_thong_so', tsp.ma_thong_so,
                'ten_thong_so', ts.ten_thong_so,
                'don_vi', ts.don_vi,
                'kieu_du_lieu', ts.kieu_du_lieu,
                'gia_tri', tsp.gia_tri,
                'gia_tri_so', tsp.gia_tri_so,
                'gia_tri_bool', tsp.gia_tri_bool,
                'ten_nhom', nts.ten_nhom_thong_so,
                'thu_tu_nhom', nts.thu_tu_hien_thi,
                'thu_tu_thong_so', ts.thu_tu_hien_thi
            ))
            FROM thong_so_san_pham tsp
            JOIN thong_so ts ON ts.ma_thong_so = tsp.ma_thong_so
            JOIN nhom_thong_so nts ON nts.ma_nhom_thong_so = ts.ma_nhom_thong_so
            WHERE tsp.ma_san_pham = sp.ma_san_pham
        ), JSON_ARRAY()) AS thong_so_ky_thuat,
        COALESCE((
            SELECT JSON_ARRAYAGG(JSON_OBJECT(
                'ma_hinh_anh', hsp.ma_hinh_anh,
                'duong_dan', hsp.duong_dan,
                'mo_ta', hsp.mo_ta,
                'la_anh_chinh', hsp.la_anh_chinh,
                'thu_tu_hien_thi', hsp.thu_tu_hien_thi
            ))
            FROM hinh_anh_san_pham hsp
            WHERE hsp.ma_san_pham = sp.ma_san_pham
        ), JSON_ARRAY()) AS danh_sach_hinh_anh
    FROM san_pham sp
    LEFT JOIN danh_muc dm ON dm.ma_danh_muc = sp.ma_danh_muc
    LEFT JOIN thuong_hieu th ON th.ma_thuong_hieu = sp.ma_thuong_hieu
    WHERE (p_search IS NULL OR p_search = ''
        OR sp.ten_san_pham LIKE CONCAT('%', p_search, '%')
        OR sp.ma_san_pham_code LIKE CONCAT('%', p_search, '%')
        OR dm.ten_danh_muc LIKE CONCAT('%', p_search, '%'))
      AND (p_ma_danh_muc IS NULL OR sp.ma_danh_muc = p_ma_danh_muc)
      AND (p_ma_thuong_hieu IS NULL OR sp.ma_thuong_hieu = p_ma_thuong_hieu)
      AND (p_min_price IS NULL OR sp.gia_ban >= p_min_price)
      AND (p_max_price IS NULL OR sp.gia_ban <= p_max_price)
    ORDER BY sp.ma_san_pham DESC
    LIMIT p_limit OFFSET p_offset;
END$$

DROP PROCEDURE IF EXISTS sp_san_pham_get_by_id$$
CREATE PROCEDURE sp_san_pham_get_by_id(IN p_id INT)
BEGIN
    SELECT
        sp.*, dm.ten_danh_muc, th.ten_thuong_hieu,
        COALESCE((
            SELECT JSON_ARRAYAGG(JSON_OBJECT(
                'ma_thong_so', tsp.ma_thong_so,
                'ten_thong_so', ts.ten_thong_so,
                'don_vi', ts.don_vi,
                'kieu_du_lieu', ts.kieu_du_lieu,
                'gia_tri', tsp.gia_tri,
                'gia_tri_so', tsp.gia_tri_so,
                'gia_tri_bool', tsp.gia_tri_bool,
                'ten_nhom', nts.ten_nhom_thong_so,
                'thu_tu_nhom', nts.thu_tu_hien_thi,
                'thu_tu_thong_so', ts.thu_tu_hien_thi
            ))
            FROM thong_so_san_pham tsp
            JOIN thong_so ts ON ts.ma_thong_so = tsp.ma_thong_so
            JOIN nhom_thong_so nts ON nts.ma_nhom_thong_so = ts.ma_nhom_thong_so
            WHERE tsp.ma_san_pham = sp.ma_san_pham
        ), JSON_ARRAY()) AS thong_so_ky_thuat,
        COALESCE((
            SELECT JSON_ARRAYAGG(JSON_OBJECT(
                'ma_hinh_anh', hsp.ma_hinh_anh,
                'duong_dan', hsp.duong_dan,
                'mo_ta', hsp.mo_ta,
                'la_anh_chinh', hsp.la_anh_chinh,
                'thu_tu_hien_thi', hsp.thu_tu_hien_thi
            ))
            FROM hinh_anh_san_pham hsp
            WHERE hsp.ma_san_pham = sp.ma_san_pham
        ), JSON_ARRAY()) AS danh_sach_hinh_anh
    FROM san_pham sp
    LEFT JOIN danh_muc dm ON dm.ma_danh_muc = sp.ma_danh_muc
    LEFT JOIN thuong_hieu th ON th.ma_thuong_hieu = sp.ma_thuong_hieu
    WHERE sp.ma_san_pham = p_id;

    SELECT
        dmt.ma_danh_muc,
        ts.ma_thong_so,
        nts.ten_nhom_thong_so,
        ts.ten_thong_so,
        ts.kieu_du_lieu,
        ts.don_vi,
        ts.cho_phep_loc,
        dmt.bat_buoc,
        dmt.thu_tu_hien_thi
    FROM danh_muc_thong_so dmt
    JOIN thong_so ts ON ts.ma_thong_so = dmt.ma_thong_so
    JOIN nhom_thong_so nts ON nts.ma_nhom_thong_so = ts.ma_nhom_thong_so
    JOIN san_pham sp ON sp.ma_danh_muc = dmt.ma_danh_muc
    WHERE sp.ma_san_pham = p_id
    ORDER BY nts.thu_tu_hien_thi, dmt.thu_tu_hien_thi, ts.thu_tu_hien_thi;
END$$

DROP PROCEDURE IF EXISTS sp_san_pham_find_by_code$$
CREATE PROCEDURE sp_san_pham_find_by_code(IN p_code VARCHAR(50))
BEGIN
    SELECT ma_san_pham FROM san_pham WHERE ma_san_pham_code = p_code;
END$$

DROP PROCEDURE IF EXISTS sp_san_pham_create$$
CREATE PROCEDURE sp_san_pham_create(
    IN p_ma_danh_muc INT, IN p_ma_thuong_hieu INT, IN p_code VARCHAR(50), IN p_ten VARCHAR(200), IN p_mo_ta TEXT,
    IN p_gia_nhap DECIMAL(15,2), IN p_gia_ban DECIMAL(15,2), IN p_so_luong INT, IN p_bao_hanh INT,
    IN p_hinh_anh VARCHAR(255), IN p_trang_thai VARCHAR(20), IN p_thong_so_json JSON)
BEGIN
    DECLARE v_ma_san_pham INT;
    DECLARE v_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

    START TRANSACTION;

    INSERT INTO san_pham
        (ma_danh_muc, ma_thuong_hieu, ma_san_pham_code, ten_san_pham, mo_ta,
         gia_nhap, gia_ban, so_luong, bao_hanh, hinh_anh, trang_thai)
    VALUES
        (p_ma_danh_muc, p_ma_thuong_hieu, p_code, p_ten, p_mo_ta,
         p_gia_nhap, p_gia_ban, p_so_luong, p_bao_hanh, p_hinh_anh, p_trang_thai);

    SET v_ma_san_pham = LAST_INSERT_ID();

    -- Kiem tra thong so gui len phai thuoc danh muc cua san pham.
    SELECT COUNT(*) INTO v_count
    FROM JSON_TABLE(
        COALESCE(p_thong_so_json, JSON_ARRAY()), '$[*]'
        COLUMNS (ma_thong_so INT PATH '$.ma_thong_so')
    ) jt
    LEFT JOIN danh_muc_thong_so dmt
        ON dmt.ma_danh_muc = p_ma_danh_muc AND dmt.ma_thong_so = jt.ma_thong_so
    WHERE dmt.ma_thong_so IS NULL;

    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Co thong so khong hop le voi danh muc san pham';
    END IF;

    INSERT INTO thong_so_san_pham (ma_san_pham, ma_thong_so, gia_tri, gia_tri_so, gia_tri_bool)
    SELECT
        v_ma_san_pham,
        jt.ma_thong_so,
        jt.gia_tri,
        jt.gia_tri_so,
        jt.gia_tri_bool
    FROM JSON_TABLE(
        COALESCE(p_thong_so_json, JSON_ARRAY()), '$[*]'
        COLUMNS (
            ma_thong_so INT PATH '$.ma_thong_so',
            gia_tri VARCHAR(1000) PATH '$.gia_tri' NULL ON EMPTY,
            gia_tri_so DECIMAL(18,4) PATH '$.gia_tri_so' NULL ON EMPTY,
            gia_tri_bool BOOLEAN PATH '$.gia_tri_bool' NULL ON EMPTY
        )
    ) jt;

    -- Tu dong tao anh chinh tu truong hinh_anh cu de giu tuong thich.
    IF p_hinh_anh IS NOT NULL AND p_hinh_anh <> '' THEN
        INSERT INTO hinh_anh_san_pham (ma_san_pham, duong_dan, la_anh_chinh, thu_tu_hien_thi)
        VALUES (v_ma_san_pham, p_hinh_anh, TRUE, 1);
    END IF;

    COMMIT;
    SELECT v_ma_san_pham AS insertId, 1 AS affectedRows;
END$$

DROP PROCEDURE IF EXISTS sp_san_pham_update$$
CREATE PROCEDURE sp_san_pham_update(
    IN p_id INT, IN p_ma_danh_muc INT, IN p_ma_thuong_hieu INT, IN p_code VARCHAR(50), IN p_ten VARCHAR(200), IN p_mo_ta TEXT,
    IN p_gia_nhap DECIMAL(15,2), IN p_gia_ban DECIMAL(15,2), IN p_so_luong INT, IN p_bao_hanh INT,
    IN p_hinh_anh VARCHAR(255), IN p_trang_thai VARCHAR(20), IN p_thong_so_json JSON)
BEGIN
    DECLARE v_ma_danh_muc INT;
    DECLARE v_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

    START TRANSACTION;

    SELECT ma_danh_muc INTO v_ma_danh_muc FROM san_pham WHERE ma_san_pham = p_id FOR UPDATE;
    IF v_ma_danh_muc IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Khong tim thay san pham';
    END IF;
    IF p_ma_danh_muc IS NOT NULL AND p_ma_danh_muc <> v_ma_danh_muc THEN
        DELETE FROM thong_so_san_pham WHERE ma_san_pham = p_id;
    END IF;

    SET v_ma_danh_muc = COALESCE(p_ma_danh_muc, v_ma_danh_muc);

    SELECT COUNT(*) INTO v_count
    FROM JSON_TABLE(
        COALESCE(p_thong_so_json, JSON_ARRAY()), '$[*]'
        COLUMNS (ma_thong_so INT PATH '$.ma_thong_so')
    ) jt
    LEFT JOIN danh_muc_thong_so dmt
        ON dmt.ma_danh_muc = v_ma_danh_muc AND dmt.ma_thong_so = jt.ma_thong_so
    WHERE dmt.ma_thong_so IS NULL;

    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Co thong so khong hop le voi danh muc san pham';
    END IF;

    UPDATE san_pham
    SET ma_danh_muc = COALESCE(p_ma_danh_muc, ma_danh_muc),
        ma_thuong_hieu = COALESCE(p_ma_thuong_hieu, ma_thuong_hieu),
        ma_san_pham_code = COALESCE(p_code, ma_san_pham_code),
        ten_san_pham = COALESCE(p_ten, ten_san_pham),
        mo_ta = COALESCE(p_mo_ta, mo_ta),
        gia_nhap = COALESCE(p_gia_nhap, gia_nhap),
        gia_ban = COALESCE(p_gia_ban, gia_ban),
        so_luong = COALESCE(p_so_luong, so_luong),
        bao_hanh = COALESCE(p_bao_hanh, bao_hanh),
        hinh_anh = COALESCE(p_hinh_anh, hinh_anh),
        trang_thai = COALESCE(p_trang_thai, trang_thai)
    WHERE ma_san_pham = p_id;

    -- Neu gui p_thong_so_json thi thay toan bo thong so cu bang bo thong so moi.
    IF p_thong_so_json IS NOT NULL THEN
        DELETE FROM thong_so_san_pham WHERE ma_san_pham = p_id;
        INSERT INTO thong_so_san_pham (ma_san_pham, ma_thong_so, gia_tri, gia_tri_so, gia_tri_bool)
        SELECT
            p_id, jt.ma_thong_so, jt.gia_tri, jt.gia_tri_so, jt.gia_tri_bool
        FROM JSON_TABLE(
            p_thong_so_json, '$[*]'
            COLUMNS (
                ma_thong_so INT PATH '$.ma_thong_so',
                gia_tri VARCHAR(1000) PATH '$.gia_tri' NULL ON EMPTY,
                gia_tri_so DECIMAL(18,4) PATH '$.gia_tri_so' NULL ON EMPTY,
                gia_tri_bool BOOLEAN PATH '$.gia_tri_bool' NULL ON EMPTY
            )
        ) jt;
    END IF;

    IF p_hinh_anh IS NOT NULL AND p_hinh_anh <> '' THEN
        UPDATE hinh_anh_san_pham SET la_anh_chinh = FALSE WHERE ma_san_pham = p_id;
        INSERT INTO hinh_anh_san_pham (ma_san_pham, duong_dan, la_anh_chinh, thu_tu_hien_thi)
        VALUES (p_id, p_hinh_anh, TRUE, 1);
    END IF;

    COMMIT;
    SELECT p_id AS ma_san_pham, 1 AS affectedRows;
END$$

DROP PROCEDURE IF EXISTS sp_san_pham_delete$$
CREATE PROCEDURE sp_san_pham_delete(IN p_id INT)
BEGIN
    DELETE FROM san_pham WHERE ma_san_pham = p_id;
    SELECT ROW_COUNT() AS affectedRows;
END$$

DROP PROCEDURE IF EXISTS sp_thong_so_list_by_category$$
CREATE PROCEDURE sp_thong_so_list_by_category(IN p_ma_danh_muc INT)
BEGIN
    SELECT
        dmt.ma_danh_muc,
        ts.ma_thong_so,
        nts.ma_nhom_thong_so,
        nts.ten_nhom_thong_so,
        ts.ten_thong_so,
        ts.kieu_du_lieu,
        ts.don_vi,
        ts.cho_phep_loc,
        dmt.bat_buoc,
        dmt.thu_tu_hien_thi
    FROM danh_muc_thong_so dmt
    JOIN thong_so ts ON ts.ma_thong_so = dmt.ma_thong_so
    JOIN nhom_thong_so nts ON nts.ma_nhom_thong_so = ts.ma_nhom_thong_so
    WHERE dmt.ma_danh_muc = p_ma_danh_muc
      AND ts.trang_thai = TRUE
      AND nts.trang_thai = TRUE
    ORDER BY nts.thu_tu_hien_thi, dmt.thu_tu_hien_thi, ts.thu_tu_hien_thi;
END$$

DROP PROCEDURE IF EXISTS sp_thong_so_get_by_product$$
CREATE PROCEDURE sp_thong_so_get_by_product(IN p_ma_san_pham INT)
BEGIN
    SELECT
        tsp.ma_san_pham,
        ts.ma_thong_so,
        nts.ten_nhom_thong_so,
        ts.ten_thong_so,
        ts.kieu_du_lieu,
        ts.don_vi,
        tsp.gia_tri,
        tsp.gia_tri_so,
        tsp.gia_tri_bool
    FROM thong_so_san_pham tsp
    JOIN thong_so ts ON ts.ma_thong_so = tsp.ma_thong_so
    JOIN nhom_thong_so nts ON nts.ma_nhom_thong_so = ts.ma_nhom_thong_so
    WHERE tsp.ma_san_pham = p_ma_san_pham
    ORDER BY nts.thu_tu_hien_thi, ts.thu_tu_hien_thi;
END$$


DELIMITER ;

-- 3. Kiem tra sau migration
SELECT COUNT(*) AS tong_san_pham FROM san_pham;
SELECT COUNT(*) AS tong_thong_so_dinh_nghia FROM thong_so;
SELECT COUNT(*) AS tong_thong_so_san_pham FROM thong_so_san_pham;
SELECT COUNT(*) AS tong_hinh_anh FROM hinh_anh_san_pham;
