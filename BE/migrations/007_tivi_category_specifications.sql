-- Category fields only. Product values are entered separately for each Tivi.
-- Reuse existing fields, including the existing 'Loại Tivi:' label.
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
