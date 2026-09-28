-- RESUME: tao lai cac stored procedure sau khi phan bang/thong so da chay thanh cong
-- Dung file nay neu database da co: nhom_thong_so, thong_so, danh_muc_thong_so, thong_so_san_pham, hinh_anh_san_pham
-- va da xoa chi_tiet_san_pham_legacy.
USE dien_gia_dung;

DELIMITER $$

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
