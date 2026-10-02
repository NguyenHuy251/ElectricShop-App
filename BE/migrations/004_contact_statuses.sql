UPDATE lien_he SET trang_thai = 'ChoPhanHoi' WHERE trang_thai IN ('ChuaXuLy', 'DangXuLy');
UPDATE lien_he SET trang_thai = 'DaPhanHoi' WHERE trang_thai = 'DaXuLy';
ALTER TABLE lien_he MODIFY COLUMN trang_thai ENUM('ChoPhanHoi', 'DaPhanHoi') DEFAULT 'ChoPhanHoi';
