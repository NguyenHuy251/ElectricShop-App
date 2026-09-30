-- Restore Vietnamese accents in existing catalog display text.
-- Only exact original values and primary keys are matched; safe to rerun.
-- Customer data, order history, identifiers, prices and stock are unchanged.
SET NAMES utf8mb4;
START TRANSACTION;

-- Tu lanh -> Tủ lạnh
UPDATE `danh_muc` SET `ten_danh_muc` = CONVERT(0x54e1bba7206ce1baa16e68 USING utf8mb4) WHERE `ma_danh_muc` = 1 AND BINARY `ten_danh_muc` = BINARY CONVERT(0x5475206c616e68 USING utf8mb4);

-- Cac loai tu lanh gia dinh -> Các loại tủ lạnh gia đình
UPDATE `danh_muc` SET `mo_ta` = CONVERT(0x43c3a163206c6fe1baa1692074e1bba7206ce1baa16e682067696120c491c3ac6e68 USING utf8mb4) WHERE `ma_danh_muc` = 1 AND BINARY `mo_ta` = BINARY CONVERT(0x436163206c6f6169207475206c616e68206769612064696e68 USING utf8mb4);

-- May giat -> Máy giặt
UPDATE `danh_muc` SET `ten_danh_muc` = CONVERT(0x4dc3a179206769e1bab774 USING utf8mb4) WHERE `ma_danh_muc` = 2 AND BINARY `ten_danh_muc` = BINARY CONVERT(0x4d61792067696174 USING utf8mb4);

-- May giat cua tren va cua truoc -> Máy giặt cửa trên và cửa trước
UPDATE `danh_muc` SET `mo_ta` = CONVERT(0x4dc3a179206769e1bab7742063e1bbad61207472c3aa6e2076c3a02063e1bbad61207472c6b0e1bb9b63 USING utf8mb4) WHERE `ma_danh_muc` = 2 AND BINARY `mo_ta` = BINARY CONVERT(0x4d6179206769617420637561207472656e20766120637561207472756f63 USING utf8mb4);

-- Lo vi song -> Lò vi sóng
UPDATE `danh_muc` SET `ten_danh_muc` = CONVERT(0x4cc3b22076692073c3b36e67 USING utf8mb4) WHERE `ma_danh_muc` = 3 AND BINARY `ten_danh_muc` = BINARY CONVERT(0x4c6f20766920736f6e67 USING utf8mb4);

-- Lo vi song gia dinh -> Lò vi sóng gia đình
UPDATE `danh_muc` SET `mo_ta` = CONVERT(0x4cc3b22076692073c3b36e672067696120c491c3ac6e68 USING utf8mb4) WHERE `ma_danh_muc` = 3 AND BINARY `mo_ta` = BINARY CONVERT(0x4c6f20766920736f6e67206769612064696e68 USING utf8mb4);

-- Dieu hoa -> Điều hòa
UPDATE `danh_muc` SET `ten_danh_muc` = CONVERT(0xc49069e1bb81752068c3b261 USING utf8mb4) WHERE `ma_danh_muc` = 4 AND BINARY `ten_danh_muc` = BINARY CONVERT(0x4469657520686f61 USING utf8mb4);

-- Dieu hoa nhiet do -> Điều hòa nhiệt độ
UPDATE `danh_muc` SET `mo_ta` = CONVERT(0xc49069e1bb81752068c3b261206e6869e1bb877420c491e1bb99 USING utf8mb4) WHERE `ma_danh_muc` = 4 AND BINARY `mo_ta` = BINARY CONVERT(0x4469657520686f61206e6869657420646f USING utf8mb4);

-- Bep dien -> Bếp điện
UPDATE `danh_muc` SET `ten_danh_muc` = CONVERT(0x42e1babf7020c49169e1bb876e USING utf8mb4) WHERE `ma_danh_muc` = 5 AND BINARY `ten_danh_muc` = BINARY CONVERT(0x426570206469656e USING utf8mb4);

-- Bep tu va bep dien -> Bếp từ và bếp điện
UPDATE `danh_muc` SET `mo_ta` = CONVERT(0x42e1babf702074e1bbab2076c3a02062e1babf7020c49169e1bb876e USING utf8mb4) WHERE `ma_danh_muc` = 5 AND BINARY `mo_ta` = BINARY CONVERT(0x42657020747520766120626570206469656e USING utf8mb4);

-- Noi com dien -> Nồi cơm điện
UPDATE `danh_muc` SET `ten_danh_muc` = CONVERT(0x4ee1bb93692063c6a16d20c49169e1bb876e USING utf8mb4) WHERE `ma_danh_muc` = 6 AND BINARY `ten_danh_muc` = BINARY CONVERT(0x4e6f6920636f6d206469656e USING utf8mb4);

-- Noi com dien gia dinh -> Nồi cơm điện gia đình
UPDATE `danh_muc` SET `mo_ta` = CONVERT(0x4ee1bb93692063c6a16d20c49169e1bb876e2067696120c491c3ac6e68 USING utf8mb4) WHERE `ma_danh_muc` = 6 AND BINARY `mo_ta` = BINARY CONVERT(0x4e6f6920636f6d206469656e206769612064696e68 USING utf8mb4);

-- May hut bui -> Máy hút bụi
UPDATE `danh_muc` SET `ten_danh_muc` = CONVERT(0x4dc3a1792068c3ba742062e1bba569 USING utf8mb4) WHERE `ma_danh_muc` = 7 AND BINARY `ten_danh_muc` = BINARY CONVERT(0x4d61792068757420627569 USING utf8mb4);

-- May hut bui gia dinh -> Máy hút bụi gia đình
UPDATE `danh_muc` SET `mo_ta` = CONVERT(0x4dc3a1792068c3ba742062e1bba5692067696120c491c3ac6e68 USING utf8mb4) WHERE `ma_danh_muc` = 7 AND BINARY `mo_ta` = BINARY CONVERT(0x4d61792068757420627569206769612064696e68 USING utf8mb4);

-- Am sieu toc -> Ấm siêu tốc
UPDATE `danh_muc` SET `ten_danh_muc` = CONVERT(0xe1baa46d207369c3aa752074e1bb9163 USING utf8mb4) WHERE `ma_danh_muc` = 8 AND BINARY `ten_danh_muc` = BINARY CONVERT(0x416d207369657520746f63 USING utf8mb4);

-- Am dun nuoc sieu toc -> Ấm đun nước siêu tốc
UPDATE `danh_muc` SET `mo_ta` = CONVERT(0xe1baa46d20c491756e206ec6b0e1bb9b63207369c3aa752074e1bb9163 USING utf8mb4) WHERE `ma_danh_muc` = 8 AND BINARY `mo_ta` = BINARY CONVERT(0x416d2064756e206e756f63207369657520746f63 USING utf8mb4);

-- May loc nuoc -> Máy lọc nước
UPDATE `danh_muc` SET `ten_danh_muc` = CONVERT(0x4dc3a179206ce1bb8d63206ec6b0e1bb9b63 USING utf8mb4) WHERE `ma_danh_muc` = 9 AND BINARY `ten_danh_muc` = BINARY CONVERT(0x4d6179206c6f63206e756f63 USING utf8mb4);

-- May loc nuoc gia dinh -> Máy lọc nước gia đình
UPDATE `danh_muc` SET `mo_ta` = CONVERT(0x4dc3a179206ce1bb8d63206ec6b0e1bb9b632067696120c491c3ac6e68 USING utf8mb4) WHERE `ma_danh_muc` = 9 AND BINARY `mo_ta` = BINARY CONVERT(0x4d6179206c6f63206e756f63206769612064696e68 USING utf8mb4);

-- Quat dien -> Quạt điện
UPDATE `danh_muc` SET `ten_danh_muc` = CONVERT(0x5175e1baa17420c49169e1bb876e USING utf8mb4) WHERE `ma_danh_muc` = 10 AND BINARY `ten_danh_muc` = BINARY CONVERT(0x51756174206469656e USING utf8mb4);

-- Quat dien gia dung -> Quạt điện gia dụng
UPDATE `danh_muc` SET `mo_ta` = CONVERT(0x5175e1baa17420c49169e1bb876e206769612064e1bba56e67 USING utf8mb4) WHERE `ma_danh_muc` = 10 AND BINARY `mo_ta` = BINARY CONVERT(0x51756174206469656e206769612064756e67 USING utf8mb4);

-- Han Quoc -> Hàn Quốc
UPDATE `thuong_hieu` SET `quoc_gia` = CONVERT(0x48c3a06e205175e1bb9163 USING utf8mb4) WHERE `ma_thuong_hieu` = 1 AND BINARY `quoc_gia` = BINARY CONVERT(0x48616e2051756f63 USING utf8mb4);

-- Thiet bi dien tu va gia dung -> Thiết bị điện tử và gia dụng
UPDATE `thuong_hieu` SET `mo_ta` = CONVERT(0x546869e1babf742062e1bb8b20c49169e1bb876e2074e1bbad2076c3a0206769612064e1bba56e67 USING utf8mb4) WHERE `ma_thuong_hieu` = 1 AND BINARY `mo_ta` = BINARY CONVERT(0x5468696574206269206469656e207475207661206769612064756e67 USING utf8mb4);

-- Han Quoc -> Hàn Quốc
UPDATE `thuong_hieu` SET `quoc_gia` = CONVERT(0x48c3a06e205175e1bb9163 USING utf8mb4) WHERE `ma_thuong_hieu` = 2 AND BINARY `quoc_gia` = BINARY CONVERT(0x48616e2051756f63 USING utf8mb4);

-- Dien may va gia dung -> Điện máy và gia dụng
UPDATE `thuong_hieu` SET `mo_ta` = CONVERT(0xc49069e1bb876e206dc3a1792076c3a0206769612064e1bba56e67 USING utf8mb4) WHERE `ma_thuong_hieu` = 2 AND BINARY `mo_ta` = BINARY CONVERT(0x4469656e206d6179207661206769612064756e67 USING utf8mb4);

-- Nhat Ban -> Nhật Bản
UPDATE `thuong_hieu` SET `quoc_gia` = CONVERT(0x4e68e1baad742042e1baa36e USING utf8mb4) WHERE `ma_thuong_hieu` = 3 AND BINARY `quoc_gia` = BINARY CONVERT(0x4e6861742042616e USING utf8mb4);

-- Thiet bi dien va gia dung -> Thiết bị điện và gia dụng
UPDATE `thuong_hieu` SET `mo_ta` = CONVERT(0x546869e1babf742062e1bb8b20c49169e1bb876e2076c3a0206769612064e1bba56e67 USING utf8mb4) WHERE `ma_thuong_hieu` = 3 AND BINARY `mo_ta` = BINARY CONVERT(0x5468696574206269206469656e207661206769612064756e67 USING utf8mb4);

-- Nhat Ban -> Nhật Bản
UPDATE `thuong_hieu` SET `quoc_gia` = CONVERT(0x4e68e1baad742042e1baa36e USING utf8mb4) WHERE `ma_thuong_hieu` = 4 AND BINARY `quoc_gia` = BINARY CONVERT(0x4e6861742042616e USING utf8mb4);

-- Dien may gia dung -> Điện máy gia dụng
UPDATE `thuong_hieu` SET `mo_ta` = CONVERT(0xc49069e1bb876e206dc3a179206769612064e1bba56e67 USING utf8mb4) WHERE `ma_thuong_hieu` = 4 AND BINARY `mo_ta` = BINARY CONVERT(0x4469656e206d6179206769612064756e67 USING utf8mb4);

-- Nhat Ban -> Nhật Bản
UPDATE `thuong_hieu` SET `quoc_gia` = CONVERT(0x4e68e1baad742042e1baa36e USING utf8mb4) WHERE `ma_thuong_hieu` = 5 AND BINARY `quoc_gia` = BINARY CONVERT(0x4e6861742042616e USING utf8mb4);

-- Dien gia dung -> Điện gia dụng
UPDATE `thuong_hieu` SET `mo_ta` = CONVERT(0xc49069e1bb876e206769612064e1bba56e67 USING utf8mb4) WHERE `ma_thuong_hieu` = 5 AND BINARY `mo_ta` = BINARY CONVERT(0x4469656e206769612064756e67 USING utf8mb4);

-- Thuy Dien -> Thụy Điển
UPDATE `thuong_hieu` SET `quoc_gia` = CONVERT(0x5468e1bba57920c49069e1bb836e USING utf8mb4) WHERE `ma_thuong_hieu` = 6 AND BINARY `quoc_gia` = BINARY CONVERT(0x54687579204469656e USING utf8mb4);

-- Thiet bi gia dung -> Thiết bị gia dụng
UPDATE `thuong_hieu` SET `mo_ta` = CONVERT(0x546869e1babf742062e1bb8b206769612064e1bba56e67 USING utf8mb4) WHERE `ma_thuong_hieu` = 6 AND BINARY `mo_ta` = BINARY CONVERT(0x5468696574206269206769612064756e67 USING utf8mb4);

-- Nhat Ban -> Nhật Bản
UPDATE `thuong_hieu` SET `quoc_gia` = CONVERT(0x4e68e1baad742042e1baa36e USING utf8mb4) WHERE `ma_thuong_hieu` = 7 AND BINARY `quoc_gia` = BINARY CONVERT(0x4e6861742042616e USING utf8mb4);

-- Dien lanh gia dung -> Điện lạnh gia dụng
UPDATE `thuong_hieu` SET `mo_ta` = CONVERT(0xc49069e1bb876e206ce1baa16e68206769612064e1bba56e67 USING utf8mb4) WHERE `ma_thuong_hieu` = 7 AND BINARY `mo_ta` = BINARY CONVERT(0x4469656e206c616e68206769612064756e67 USING utf8mb4);

-- Nhat Ban -> Nhật Bản
UPDATE `thuong_hieu` SET `quoc_gia` = CONVERT(0x4e68e1baad742042e1baa36e USING utf8mb4) WHERE `ma_thuong_hieu` = 8 AND BINARY `quoc_gia` = BINARY CONVERT(0x4e6861742042616e USING utf8mb4);

-- Dieu hoa va thiet bi khong khi -> Điều hòa và thiết bị không khí
UPDATE `thuong_hieu` SET `mo_ta` = CONVERT(0xc49069e1bb81752068c3b2612076c3a020746869e1babf742062e1bb8b206b68c3b46e67206b68c3ad USING utf8mb4) WHERE `ma_thuong_hieu` = 8 AND BINARY `mo_ta` = BINARY CONVERT(0x4469657520686f61207661207468696574206269206b686f6e67206b6869 USING utf8mb4);

-- Trung Quoc -> Trung Quốc
UPDATE `thuong_hieu` SET `quoc_gia` = CONVERT(0x5472756e67205175e1bb9163 USING utf8mb4) WHERE `ma_thuong_hieu` = 9 AND BINARY `quoc_gia` = BINARY CONVERT(0x5472756e672051756f63 USING utf8mb4);

-- Dien gia dung -> Điện gia dụng
UPDATE `thuong_hieu` SET `mo_ta` = CONVERT(0xc49069e1bb876e206769612064e1bba56e67 USING utf8mb4) WHERE `ma_thuong_hieu` = 9 AND BINARY `mo_ta` = BINARY CONVERT(0x4469656e206769612064756e67 USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thuong_hieu` SET `quoc_gia` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_thuong_hieu` = 10 AND BINARY `quoc_gia` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- Gia dung Viet Nam -> Gia dụng Việt Nam
UPDATE `thuong_hieu` SET `mo_ta` = CONVERT(0x4769612064e1bba56e67205669e1bb8774204e616d USING utf8mb4) WHERE `ma_thuong_hieu` = 10 AND BINARY `mo_ta` = BINARY CONVERT(0x4769612064756e672056696574204e616d USING utf8mb4);

-- Tu lanh Samsung Inverter 236 lit -> Tủ lạnh Samsung Inverter 236 lít
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0x54e1bba7206ce1baa16e682053616d73756e6720496e76657274657220323336206cc3ad74 USING utf8mb4) WHERE `ma_san_pham` = 1 AND BINARY `ten_san_pham` = BINARY CONVERT(0x5475206c616e682053616d73756e6720496e76657274657220323336206c6974 USING utf8mb4);

-- Tu lanh Samsung tiet kiem dien -> Tủ lạnh Samsung tiết kiệm điện
UPDATE `san_pham` SET `mo_ta` = CONVERT(0x54e1bba7206ce1baa16e682053616d73756e67207469e1babf74206b69e1bb876d20c49169e1bb876e USING utf8mb4) WHERE `ma_san_pham` = 1 AND BINARY `mo_ta` = BINARY CONVERT(0x5475206c616e682053616d73756e672074696574206b69656d206469656e USING utf8mb4);

-- Tu lanh LG Inverter 474 lit -> Tủ lạnh LG Inverter 474 lít
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0x54e1bba7206ce1baa16e68204c4720496e76657274657220343734206cc3ad74 USING utf8mb4) WHERE `ma_san_pham` = 2 AND BINARY `ten_san_pham` = BINARY CONVERT(0x5475206c616e68204c4720496e76657274657220343734206c6974 USING utf8mb4);

-- Tu lanh LG dung tich lon -> Tủ lạnh LG dung tích lớn
UPDATE `san_pham` SET `mo_ta` = CONVERT(0x54e1bba7206ce1baa16e68204c472064756e672074c3ad6368206ce1bb9b6e USING utf8mb4) WHERE `ma_san_pham` = 2 AND BINARY `mo_ta` = BINARY CONVERT(0x5475206c616e68204c472064756e672074696368206c6f6e USING utf8mb4);

-- Tu lanh Toshiba 180 lit -> Tủ lạnh Toshiba 180 lít
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0x54e1bba7206ce1baa16e6820546f736869626120313830206cc3ad74 USING utf8mb4) WHERE `ma_san_pham` = 3 AND BINARY `ten_san_pham` = BINARY CONVERT(0x5475206c616e6820546f736869626120313830206c6974 USING utf8mb4);

-- Tu lanh Toshiba cho gia dinh -> Tủ lạnh Toshiba cho gia đình
UPDATE `san_pham` SET `mo_ta` = CONVERT(0x54e1bba7206ce1baa16e6820546f73686962612063686f2067696120c491c3ac6e68 USING utf8mb4) WHERE `ma_san_pham` = 3 AND BINARY `mo_ta` = BINARY CONVERT(0x5475206c616e6820546f73686962612063686f206769612064696e68 USING utf8mb4);

-- May giat Samsung 9 kg -> Máy giặt Samsung 9 kg
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0x4dc3a179206769e1bab7742053616d73756e672039206b67 USING utf8mb4) WHERE `ma_san_pham` = 4 AND BINARY `ten_san_pham` = BINARY CONVERT(0x4d617920676961742053616d73756e672039206b67 USING utf8mb4);

-- May giat Samsung cua truoc -> Máy giặt Samsung cửa trước
UPDATE `san_pham` SET `mo_ta` = CONVERT(0x4dc3a179206769e1bab7742053616d73756e672063e1bbad61207472c6b0e1bb9b63 USING utf8mb4) WHERE `ma_san_pham` = 4 AND BINARY `mo_ta` = BINARY CONVERT(0x4d617920676961742053616d73756e6720637561207472756f63 USING utf8mb4);

-- May giat LG Inverter 10 kg -> Máy giặt LG Inverter 10 kg
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0x4dc3a179206769e1bab774204c4720496e766572746572203130206b67 USING utf8mb4) WHERE `ma_san_pham` = 5 AND BINARY `ten_san_pham` = BINARY CONVERT(0x4d61792067696174204c4720496e766572746572203130206b67 USING utf8mb4);

-- May giat LG Inverter -> Máy giặt LG Inverter
UPDATE `san_pham` SET `mo_ta` = CONVERT(0x4dc3a179206769e1bab774204c4720496e766572746572 USING utf8mb4) WHERE `ma_san_pham` = 5 AND BINARY `mo_ta` = BINARY CONVERT(0x4d61792067696174204c4720496e766572746572 USING utf8mb4);

-- May giat Panasonic 9 kg -> Máy giặt Panasonic 9 kg
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0x4dc3a179206769e1bab7742050616e61736f6e69632039206b67 USING utf8mb4) WHERE `ma_san_pham` = 6 AND BINARY `ten_san_pham` = BINARY CONVERT(0x4d617920676961742050616e61736f6e69632039206b67 USING utf8mb4);

-- May giat Panasonic -> Máy giặt Panasonic
UPDATE `san_pham` SET `mo_ta` = CONVERT(0x4dc3a179206769e1bab7742050616e61736f6e6963 USING utf8mb4) WHERE `ma_san_pham` = 6 AND BINARY `mo_ta` = BINARY CONVERT(0x4d617920676961742050616e61736f6e6963 USING utf8mb4);

-- Lo vi song Sharp 20 lit -> Lò vi sóng Sharp 20 lít
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0x4cc3b22076692073c3b36e67205368617270203230206cc3ad74 USING utf8mb4) WHERE `ma_san_pham` = 7 AND BINARY `ten_san_pham` = BINARY CONVERT(0x4c6f20766920736f6e67205368617270203230206c6974 USING utf8mb4);

-- Lo vi song Sharp 20 lit -> Lò vi sóng Sharp 20 lít
UPDATE `san_pham` SET `mo_ta` = CONVERT(0x4cc3b22076692073c3b36e67205368617270203230206cc3ad74 USING utf8mb4) WHERE `ma_san_pham` = 7 AND BINARY `mo_ta` = BINARY CONVERT(0x4c6f20766920736f6e67205368617270203230206c6974 USING utf8mb4);

-- Lo vi song Panasonic 25 lit -> Lò vi sóng Panasonic 25 lít
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0x4cc3b22076692073c3b36e672050616e61736f6e6963203235206cc3ad74 USING utf8mb4) WHERE `ma_san_pham` = 8 AND BINARY `ten_san_pham` = BINARY CONVERT(0x4c6f20766920736f6e672050616e61736f6e6963203235206c6974 USING utf8mb4);

-- Lo vi song Panasonic -> Lò vi sóng Panasonic
UPDATE `san_pham` SET `mo_ta` = CONVERT(0x4cc3b22076692073c3b36e672050616e61736f6e6963 USING utf8mb4) WHERE `ma_san_pham` = 8 AND BINARY `mo_ta` = BINARY CONVERT(0x4c6f20766920736f6e672050616e61736f6e6963 USING utf8mb4);

-- Dieu hoa Daikin 1.5 HP -> Điều hòa Daikin 1.5 HP
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0xc49069e1bb81752068c3b261204461696b696e20312e35204850 USING utf8mb4) WHERE `ma_san_pham` = 9 AND BINARY `ten_san_pham` = BINARY CONVERT(0x4469657520686f61204461696b696e20312e35204850 USING utf8mb4);

-- Dieu hoa Daikin Inverter -> Điều hòa Daikin Inverter
UPDATE `san_pham` SET `mo_ta` = CONVERT(0xc49069e1bb81752068c3b261204461696b696e20496e766572746572 USING utf8mb4) WHERE `ma_san_pham` = 9 AND BINARY `mo_ta` = BINARY CONVERT(0x4469657520686f61204461696b696e20496e766572746572 USING utf8mb4);

-- Dieu hoa LG 1.5 HP -> Điều hòa LG 1.5 HP
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0xc49069e1bb81752068c3b261204c4720312e35204850 USING utf8mb4) WHERE `ma_san_pham` = 10 AND BINARY `ten_san_pham` = BINARY CONVERT(0x4469657520686f61204c4720312e35204850 USING utf8mb4);

-- Dieu hoa LG Dual Inverter -> Điều hòa LG Dual Inverter
UPDATE `san_pham` SET `mo_ta` = CONVERT(0xc49069e1bb81752068c3b261204c47204475616c20496e766572746572 USING utf8mb4) WHERE `ma_san_pham` = 10 AND BINARY `mo_ta` = BINARY CONVERT(0x4469657520686f61204c47204475616c20496e766572746572 USING utf8mb4);

-- Bep tu Panasonic -> Bếp từ Panasonic
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0x42e1babf702074e1bbab2050616e61736f6e6963 USING utf8mb4) WHERE `ma_san_pham` = 11 AND BINARY `ten_san_pham` = BINARY CONVERT(0x4265702074752050616e61736f6e6963 USING utf8mb4);

-- Bep tu Panasonic -> Bếp từ Panasonic
UPDATE `san_pham` SET `mo_ta` = CONVERT(0x42e1babf702074e1bbab2050616e61736f6e6963 USING utf8mb4) WHERE `ma_san_pham` = 11 AND BINARY `mo_ta` = BINARY CONVERT(0x4265702074752050616e61736f6e6963 USING utf8mb4);

-- Bep tu Sunhouse -> Bếp từ Sunhouse
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0x42e1babf702074e1bbab2053756e686f757365 USING utf8mb4) WHERE `ma_san_pham` = 12 AND BINARY `ten_san_pham` = BINARY CONVERT(0x4265702074752053756e686f757365 USING utf8mb4);

-- Bep tu Sunhouse -> Bếp từ Sunhouse
UPDATE `san_pham` SET `mo_ta` = CONVERT(0x42e1babf702074e1bbab2053756e686f757365 USING utf8mb4) WHERE `ma_san_pham` = 12 AND BINARY `mo_ta` = BINARY CONVERT(0x4265702074752053756e686f757365 USING utf8mb4);

-- Noi com dien Toshiba 1.8 lit -> Nồi cơm điện Toshiba 1.8 lít
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0x4ee1bb93692063c6a16d20c49169e1bb876e20546f736869626120312e38206cc3ad74 USING utf8mb4) WHERE `ma_san_pham` = 13 AND BINARY `ten_san_pham` = BINARY CONVERT(0x4e6f6920636f6d206469656e20546f736869626120312e38206c6974 USING utf8mb4);

-- Noi com dien Toshiba -> Nồi cơm điện Toshiba
UPDATE `san_pham` SET `mo_ta` = CONVERT(0x4ee1bb93692063c6a16d20c49169e1bb876e20546f7368696261 USING utf8mb4) WHERE `ma_san_pham` = 13 AND BINARY `mo_ta` = BINARY CONVERT(0x4e6f6920636f6d206469656e20546f7368696261 USING utf8mb4);

-- Noi com dien Sunhouse 1.8 lit -> Nồi cơm điện Sunhouse 1.8 lít
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0x4ee1bb93692063c6a16d20c49169e1bb876e2053756e686f75736520312e38206cc3ad74 USING utf8mb4) WHERE `ma_san_pham` = 14 AND BINARY `ten_san_pham` = BINARY CONVERT(0x4e6f6920636f6d206469656e2053756e686f75736520312e38206c6974 USING utf8mb4);

-- Noi com dien Sunhouse -> Nồi cơm điện Sunhouse
UPDATE `san_pham` SET `mo_ta` = CONVERT(0x4ee1bb93692063c6a16d20c49169e1bb876e2053756e686f757365 USING utf8mb4) WHERE `ma_san_pham` = 14 AND BINARY `mo_ta` = BINARY CONVERT(0x4e6f6920636f6d206469656e2053756e686f757365 USING utf8mb4);

-- May hut bui LG -> Máy hút bụi LG
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0x4dc3a1792068c3ba742062e1bba569204c47 USING utf8mb4) WHERE `ma_san_pham` = 15 AND BINARY `ten_san_pham` = BINARY CONVERT(0x4d61792068757420627569204c47 USING utf8mb4);

-- May hut bui gia dinh LG -> Máy hút bụi gia đình LG
UPDATE `san_pham` SET `mo_ta` = CONVERT(0x4dc3a1792068c3ba742062e1bba5692067696120c491c3ac6e68204c47 USING utf8mb4) WHERE `ma_san_pham` = 15 AND BINARY `mo_ta` = BINARY CONVERT(0x4d61792068757420627569206769612064696e68204c47 USING utf8mb4);

-- May hut bui Electrolux -> Máy hút bụi Electrolux
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0x4dc3a1792068c3ba742062e1bba56920456c656374726f6c7578 USING utf8mb4) WHERE `ma_san_pham` = 16 AND BINARY `ten_san_pham` = BINARY CONVERT(0x4d6179206875742062756920456c656374726f6c7578 USING utf8mb4);

-- May hut bui Electrolux -> Máy hút bụi Electrolux
UPDATE `san_pham` SET `mo_ta` = CONVERT(0x4dc3a1792068c3ba742062e1bba56920456c656374726f6c7578 USING utf8mb4) WHERE `ma_san_pham` = 16 AND BINARY `mo_ta` = BINARY CONVERT(0x4d6179206875742062756920456c656374726f6c7578 USING utf8mb4);

-- Am sieu toc Toshiba 1.7 lit -> Ấm siêu tốc Toshiba 1.7 lít
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0xe1baa46d207369c3aa752074e1bb916320546f736869626120312e37206cc3ad74 USING utf8mb4) WHERE `ma_san_pham` = 17 AND BINARY `ten_san_pham` = BINARY CONVERT(0x416d207369657520746f6320546f736869626120312e37206c6974 USING utf8mb4);

-- Am sieu toc Toshiba -> Ấm siêu tốc Toshiba
UPDATE `san_pham` SET `mo_ta` = CONVERT(0xe1baa46d207369c3aa752074e1bb916320546f7368696261 USING utf8mb4) WHERE `ma_san_pham` = 17 AND BINARY `mo_ta` = BINARY CONVERT(0x416d207369657520746f6320546f7368696261 USING utf8mb4);

-- Am sieu toc Panasonic 1.7 lit -> Ấm siêu tốc Panasonic 1.7 lít
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0xe1baa46d207369c3aa752074e1bb91632050616e61736f6e696320312e37206cc3ad74 USING utf8mb4) WHERE `ma_san_pham` = 18 AND BINARY `ten_san_pham` = BINARY CONVERT(0x416d207369657520746f632050616e61736f6e696320312e37206c6974 USING utf8mb4);

-- Am sieu toc Panasonic -> Ấm siêu tốc Panasonic
UPDATE `san_pham` SET `mo_ta` = CONVERT(0xe1baa46d207369c3aa752074e1bb91632050616e61736f6e6963 USING utf8mb4) WHERE `ma_san_pham` = 18 AND BINARY `mo_ta` = BINARY CONVERT(0x416d207369657520746f632050616e61736f6e6963 USING utf8mb4);

-- May loc nuoc Sunhouse 10 loi -> Máy lọc nước Sunhouse 10 lõi
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0x4dc3a179206ce1bb8d63206ec6b0e1bb9b632053756e686f757365203130206cc3b569 USING utf8mb4) WHERE `ma_san_pham` = 19 AND BINARY `ten_san_pham` = BINARY CONVERT(0x4d6179206c6f63206e756f632053756e686f757365203130206c6f69 USING utf8mb4);

-- May loc nuoc Sunhouse -> Máy lọc nước Sunhouse
UPDATE `san_pham` SET `mo_ta` = CONVERT(0x4dc3a179206ce1bb8d63206ec6b0e1bb9b632053756e686f757365 USING utf8mb4) WHERE `ma_san_pham` = 19 AND BINARY `mo_ta` = BINARY CONVERT(0x4d6179206c6f63206e756f632053756e686f757365 USING utf8mb4);

-- May loc nuoc Panasonic RO -> Máy lọc nước Panasonic RO
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0x4dc3a179206ce1bb8d63206ec6b0e1bb9b632050616e61736f6e696320524f USING utf8mb4) WHERE `ma_san_pham` = 20 AND BINARY `ten_san_pham` = BINARY CONVERT(0x4d6179206c6f63206e756f632050616e61736f6e696320524f USING utf8mb4);

-- May loc nuoc Panasonic RO -> Máy lọc nước Panasonic RO
UPDATE `san_pham` SET `mo_ta` = CONVERT(0x4dc3a179206ce1bb8d63206ec6b0e1bb9b632050616e61736f6e696320524f USING utf8mb4) WHERE `ma_san_pham` = 20 AND BINARY `mo_ta` = BINARY CONVERT(0x4d6179206c6f63206e756f632050616e61736f6e696320524f USING utf8mb4);

-- Quat Panasonic dung -> Quạt Panasonic đứng
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0x5175e1baa1742050616e61736f6e696320c491e1bba96e67 USING utf8mb4) WHERE `ma_san_pham` = 21 AND BINARY `ten_san_pham` = BINARY CONVERT(0x517561742050616e61736f6e69632064756e67 USING utf8mb4);

-- Quat dung Panasonic -> Quạt đứng Panasonic
UPDATE `san_pham` SET `mo_ta` = CONVERT(0x5175e1baa17420c491e1bba96e672050616e61736f6e6963 USING utf8mb4) WHERE `ma_san_pham` = 21 AND BINARY `mo_ta` = BINARY CONVERT(0x517561742064756e672050616e61736f6e6963 USING utf8mb4);

-- Quat Sunhouse dung -> Quạt Sunhouse đứng
UPDATE `san_pham` SET `ten_san_pham` = CONVERT(0x5175e1baa1742053756e686f75736520c491e1bba96e67 USING utf8mb4) WHERE `ma_san_pham` = 22 AND BINARY `ten_san_pham` = BINARY CONVERT(0x517561742053756e686f7573652064756e67 USING utf8mb4);

-- Quat dung Sunhouse -> Quạt đứng Sunhouse
UPDATE `san_pham` SET `mo_ta` = CONVERT(0x5175e1baa17420c491e1bba96e672053756e686f757365 USING utf8mb4) WHERE `ma_san_pham` = 22 AND BINARY `mo_ta` = BINARY CONVERT(0x517561742064756e672053756e686f757365 USING utf8mb4);

-- Cong nghe -> Công nghệ
UPDATE `nhom_thong_so` SET `ten_nhom_thong_so` = CONVERT(0x43c3b46e67206e6768e1bb87 USING utf8mb4) WHERE `ma_nhom_thong_so` = 4 AND BINARY `ten_nhom_thong_so` = BINARY CONVERT(0x436f6e67206e676865 USING utf8mb4);

-- Dien nang va hieu suat -> Điện năng và hiệu suất
UPDATE `nhom_thong_so` SET `ten_nhom_thong_so` = CONVERT(0xc49069e1bb876e206ec4836e672076c3a0206869e1bb8775207375e1baa574 USING utf8mb4) WHERE `ma_nhom_thong_so` = 3 AND BINARY `ten_nhom_thong_so` = BINARY CONVERT(0x4469656e206e616e6720766120686965752073756174 USING utf8mb4);

-- Kich thuoc va nang luc -> Kích thước và năng lực
UPDATE `nhom_thong_so` SET `ten_nhom_thong_so` = CONVERT(0x4bc3ad6368207468c6b0e1bb9b632076c3a0206ec4836e67206ce1bbb163 USING utf8mb4) WHERE `ma_nhom_thong_so` = 2 AND BINARY `ten_nhom_thong_so` = BINARY CONVERT(0x4b696368207468756f63207661206e616e67206c7563 USING utf8mb4);

-- Thong tin co ban -> Thông tin cơ bản
UPDATE `nhom_thong_so` SET `ten_nhom_thong_so` = CONVERT(0x5468c3b46e672074696e2063c6a12062e1baa36e USING utf8mb4) WHERE `ma_nhom_thong_so` = 1 AND BINARY `ten_nhom_thong_so` = BINARY CONVERT(0x54686f6e672074696e20636f2062616e USING utf8mb4);

-- Van hanh va an toan -> Vận hành và an toàn
UPDATE `nhom_thong_so` SET `ten_nhom_thong_so` = CONVERT(0x56e1baad6e2068c3a06e682076c3a020616e20746fc3a06e USING utf8mb4) WHERE `ma_nhom_thong_so` = 5 AND BINARY `ten_nhom_thong_so` = BINARY CONVERT(0x56616e2068616e6820766120616e20746f616e USING utf8mb4);

-- Mau sac -> Màu sắc
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x4dc3a0752073e1baaf63 USING utf8mb4) WHERE `ma_thong_so` = 1 AND BINARY `ten_thong_so` = BINARY CONVERT(0x4d617520736163 USING utf8mb4);

-- Xuat xu -> Xuất xứ
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x5875e1baa5742078e1bba9 USING utf8mb4) WHERE `ma_thong_so` = 2 AND BINARY `ten_thong_so` = BINARY CONVERT(0x58756174207875 USING utf8mb4);

-- Loai san pham -> Loại sản phẩm
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x4c6fe1baa1692073e1baa36e207068e1baa96d USING utf8mb4) WHERE `ma_thong_so` = 3 AND BINARY `ten_thong_so` = BINARY CONVERT(0x4c6f61692073616e207068616d USING utf8mb4);

-- So cua -> Số cửa
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x53e1bb912063e1bbad61 USING utf8mb4) WHERE `ma_thong_so` = 4 AND BINARY `ten_thong_so` = BINARY CONVERT(0x536f20637561 USING utf8mb4);

-- cua -> cửa
UPDATE `thong_so` SET `don_vi` = CONVERT(0x63e1bbad61 USING utf8mb4) WHERE `ma_thong_so` = 4 AND BINARY `don_vi` = BINARY CONVERT(0x637561 USING utf8mb4);

-- Kich thuoc -> Kích thước
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x4bc3ad6368207468c6b0e1bb9b63 USING utf8mb4) WHERE `ma_thong_so` = 5 AND BINARY `ten_thong_so` = BINARY CONVERT(0x4b696368207468756f63 USING utf8mb4);

-- Dung tich -> Dung tích
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x44756e672074c3ad6368 USING utf8mb4) WHERE `ma_thong_so` = 6 AND BINARY `ten_thong_so` = BINARY CONVERT(0x44756e672074696368 USING utf8mb4);

-- Khoi luong giat -> Khối lượng giặt
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x4b68e1bb9169206cc6b0e1bba36e67206769e1bab774 USING utf8mb4) WHERE `ma_thong_so` = 7 AND BINARY `ten_thong_so` = BINARY CONVERT(0x4b686f69206c756f6e672067696174 USING utf8mb4);

-- So vung nau -> Số vùng nấu
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x53e1bb912076c3b96e67206ee1baa575 USING utf8mb4) WHERE `ma_thong_so` = 8 AND BINARY `ten_thong_so` = BINARY CONVERT(0x536f2076756e67206e6175 USING utf8mb4);

-- vung -> vùng
UPDATE `thong_so` SET `don_vi` = CONVERT(0x76c3b96e67 USING utf8mb4) WHERE `ma_thong_so` = 8 AND BINARY `don_vi` = BINARY CONVERT(0x76756e67 USING utf8mb4);

-- So loi loc -> Số lõi lọc
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x53e1bb91206cc3b569206ce1bb8d63 USING utf8mb4) WHERE `ma_thong_so` = 9 AND BINARY `ten_thong_so` = BINARY CONVERT(0x536f206c6f69206c6f63 USING utf8mb4);

-- loi -> lõi
UPDATE `thong_so` SET `don_vi` = CONVERT(0x6cc3b569 USING utf8mb4) WHERE `ma_thong_so` = 9 AND BINARY `don_vi` = BINARY CONVERT(0x6c6f69 USING utf8mb4);

-- Cong suat -> Công suất
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x43c3b46e67207375e1baa574 USING utf8mb4) WHERE `ma_thong_so` = 10 AND BINARY `ten_thong_so` = BINARY CONVERT(0x436f6e672073756174 USING utf8mb4);

-- Cong suat lam lanh -> Công suất làm lạnh
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x43c3b46e67207375e1baa574206cc3a06d206ce1baa16e68 USING utf8mb4) WHERE `ma_thong_so` = 11 AND BINARY `ten_thong_so` = BINARY CONVERT(0x436f6e672073756174206c616d206c616e68 USING utf8mb4);

-- Toc do vat -> Tốc độ vắt
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x54e1bb916320c491e1bb992076e1baaf74 USING utf8mb4) WHERE `ma_thong_so` = 12 AND BINARY `ten_thong_so` = BINARY CONVERT(0x546f6320646f20766174 USING utf8mb4);

-- vong/phut -> vòng/phút
UPDATE `thong_so` SET `don_vi` = CONVERT(0x76c3b26e672f7068c3ba74 USING utf8mb4) WHERE `ma_thong_so` = 12 AND BINARY `don_vi` = BINARY CONVERT(0x766f6e672f70687574 USING utf8mb4);

-- Cong nghe tiet kiem dien -> Công nghệ tiết kiệm điện
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x43c3b46e67206e6768e1bb87207469e1babf74206b69e1bb876d20c49169e1bb876e USING utf8mb4) WHERE `ma_thong_so` = 13 AND BINARY `ten_thong_so` = BINARY CONVERT(0x436f6e67206e6768652074696574206b69656d206469656e USING utf8mb4);

-- Cong nghe lam lanh -> Công nghệ làm lạnh
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x43c3b46e67206e6768e1bb87206cc3a06d206ce1baa16e68 USING utf8mb4) WHERE `ma_thong_so` = 14 AND BINARY `ten_thong_so` = BINARY CONVERT(0x436f6e67206e676865206c616d206c616e68 USING utf8mb4);

-- Kieu may / kieu cua -> Kiểu máy / kiểu cửa
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x4b69e1bb8375206dc3a179202f206b69e1bb83752063e1bbad61 USING utf8mb4) WHERE `ma_thong_so` = 15 AND BINARY `ten_thong_so` = BINARY CONVERT(0x4b696575206d6179202f206b69657520637561 USING utf8mb4);

-- Hien thi -> Hiển thị
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x4869e1bb836e207468e1bb8b USING utf8mb4) WHERE `ma_thong_so` = 16 AND BINARY `ten_thong_so` = BINARY CONVERT(0x4869656e20746869 USING utf8mb4);

-- Bo loc -> Bộ lọc
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x42e1bb99206ce1bb8d63 USING utf8mb4) WHERE `ma_thong_so` = 17 AND BINARY `ten_thong_so` = BINARY CONVERT(0x426f206c6f63 USING utf8mb4);

-- Cong nghe loc nuoc -> Công nghệ lọc nước
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x43c3b46e67206e6768e1bb87206ce1bb8d63206ec6b0e1bb9b63 USING utf8mb4) WHERE `ma_thong_so` = 18 AND BINARY `ten_thong_so` = BINARY CONVERT(0x436f6e67206e676865206c6f63206e756f63 USING utf8mb4);

-- Loai noi / be mat -> Loại nồi / bề mặt
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x4c6fe1baa169206ee1bb9369202f2062e1bb81206de1bab774 USING utf8mb4) WHERE `ma_thong_so` = 19 AND BINARY `ten_thong_so` = BINARY CONVERT(0x4c6f6169206e6f69202f206265206d6174 USING utf8mb4);

-- So canh quat -> Số cánh quạt
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x53e1bb912063c3a16e68207175e1baa174 USING utf8mb4) WHERE `ma_thong_so` = 20 AND BINARY `ten_thong_so` = BINARY CONVERT(0x536f2063616e682071756174 USING utf8mb4);

-- canh -> cánh
UPDATE `thong_so` SET `don_vi` = CONVERT(0x63c3a16e68 USING utf8mb4) WHERE `ma_thong_so` = 20 AND BINARY `don_vi` = BINARY CONVERT(0x63616e68 USING utf8mb4);

-- Tinh nang an toan -> Tính năng an toàn
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x54c3ad6e68206ec4836e6720616e20746fc3a06e USING utf8mb4) WHERE `ma_thong_so` = 21 AND BINARY `ten_thong_so` = BINARY CONVERT(0x54696e68206e616e6720616e20746f616e USING utf8mb4);

-- Loai gas -> Loại gas
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x4c6fe1baa16920676173 USING utf8mb4) WHERE `ma_thong_so` = 22 AND BINARY `ten_thong_so` = BINARY CONVERT(0x4c6f616920676173 USING utf8mb4);

-- Chuc nang -> Chức năng
UPDATE `thong_so` SET `ten_thong_so` = CONVERT(0x4368e1bba963206ec4836e67 USING utf8mb4) WHERE `ma_thong_so` = 23 AND BINARY `ten_thong_so` = BINARY CONVERT(0x43687563206e616e67 USING utf8mb4);

-- Den -> Đen
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0xc490656e USING utf8mb4) WHERE `ma_san_pham` = 1 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x44656e USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_san_pham` = 1 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- 236 lit -> 236 lít
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x323336206cc3ad74 USING utf8mb4) WHERE `ma_san_pham` = 1 AND `ma_thong_so` = 6 AND BINARY `gia_tri` = BINARY CONVERT(0x323336206c6974 USING utf8mb4);

-- Bac -> Bạc
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x42e1baa163 USING utf8mb4) WHERE `ma_san_pham` = 2 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x426163 USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_san_pham` = 2 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- 474 lit -> 474 lít
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x343734206cc3ad74 USING utf8mb4) WHERE `ma_san_pham` = 2 AND `ma_thong_so` = 6 AND BINARY `gia_tri` = BINARY CONVERT(0x343734206c6974 USING utf8mb4);

-- Xam -> Xám
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x58c3a16d USING utf8mb4) WHERE `ma_san_pham` = 3 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x58616d USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_san_pham` = 3 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- 180 lit -> 180 lít
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x313830206cc3ad74 USING utf8mb4) WHERE `ma_san_pham` = 3 AND `ma_thong_so` = 6 AND BINARY `gia_tri` = BINARY CONVERT(0x313830206c6974 USING utf8mb4);

-- Den -> Đen
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0xc490656e USING utf8mb4) WHERE `ma_san_pham` = 4 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x44656e USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_san_pham` = 4 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- Cua truoc -> Cửa trước
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x43e1bbad61207472c6b0e1bb9b63 USING utf8mb4) WHERE `ma_san_pham` = 4 AND `ma_thong_so` = 15 AND BINARY `gia_tri` = BINARY CONVERT(0x437561207472756f63 USING utf8mb4);

-- Xam -> Xám
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x58c3a16d USING utf8mb4) WHERE `ma_san_pham` = 5 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x58616d USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_san_pham` = 5 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- Trang -> Trắng
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5472e1baaf6e67 USING utf8mb4) WHERE `ma_san_pham` = 6 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x5472616e67 USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_san_pham` = 6 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- Cua truoc -> Cửa trước
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x43e1bbad61207472c6b0e1bb9b63 USING utf8mb4) WHERE `ma_san_pham` = 6 AND `ma_thong_so` = 15 AND BINARY `gia_tri` = BINARY CONVERT(0x437561207472756f63 USING utf8mb4);

-- Den -> Đen
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0xc490656e USING utf8mb4) WHERE `ma_san_pham` = 7 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x44656e USING utf8mb4);

-- Thai Lan -> Thái Lan
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5468c3a169204c616e USING utf8mb4) WHERE `ma_san_pham` = 7 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x54686169204c616e USING utf8mb4);

-- 20 lit -> 20 lít
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x3230206cc3ad74 USING utf8mb4) WHERE `ma_san_pham` = 7 AND `ma_thong_so` = 6 AND BINARY `gia_tri` = BINARY CONVERT(0x3230206c6974 USING utf8mb4);

-- Hien thi LED -> Hiển thị LED
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x4869e1bb836e207468e1bb8b204c4544 USING utf8mb4) WHERE `ma_san_pham` = 7 AND `ma_thong_so` = 16 AND BINARY `gia_tri` = BINARY CONVERT(0x4869656e20746869204c4544 USING utf8mb4);

-- Den -> Đen
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0xc490656e USING utf8mb4) WHERE `ma_san_pham` = 8 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x44656e USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_san_pham` = 8 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- 25 lit -> 25 lít
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x3235206cc3ad74 USING utf8mb4) WHERE `ma_san_pham` = 8 AND `ma_thong_so` = 6 AND BINARY `gia_tri` = BINARY CONVERT(0x3235206c6974 USING utf8mb4);

-- Hien thi LED -> Hiển thị LED
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x4869e1bb836e207468e1bb8b204c4544 USING utf8mb4) WHERE `ma_san_pham` = 8 AND `ma_thong_so` = 16 AND BINARY `gia_tri` = BINARY CONVERT(0x4869656e20746869204c4544 USING utf8mb4);

-- Trang -> Trắng
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5472e1baaf6e67 USING utf8mb4) WHERE `ma_san_pham` = 9 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x5472616e67 USING utf8mb4);

-- Thai Lan -> Thái Lan
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5468c3a169204c616e USING utf8mb4) WHERE `ma_san_pham` = 9 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x54686169204c616e USING utf8mb4);

-- Trang -> Trắng
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5472e1baaf6e67 USING utf8mb4) WHERE `ma_san_pham` = 10 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x5472616e67 USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_san_pham` = 10 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- Den -> Đen
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0xc490656e USING utf8mb4) WHERE `ma_san_pham` = 11 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x44656e USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_san_pham` = 11 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- Mat kinh -> Mặt kính
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x4de1bab774206bc3ad6e68 USING utf8mb4) WHERE `ma_san_pham` = 11 AND `ma_thong_so` = 19 AND BINARY `gia_tri` = BINARY CONVERT(0x4d6174206b696e68 USING utf8mb4);

-- Den -> Đen
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0xc490656e USING utf8mb4) WHERE `ma_san_pham` = 12 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x44656e USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_san_pham` = 12 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- Mat kinh -> Mặt kính
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x4de1bab774206bc3ad6e68 USING utf8mb4) WHERE `ma_san_pham` = 12 AND `ma_thong_so` = 19 AND BINARY `gia_tri` = BINARY CONVERT(0x4d6174206b696e68 USING utf8mb4);

-- Trang -> Trắng
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5472e1baaf6e67 USING utf8mb4) WHERE `ma_san_pham` = 13 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x5472616e67 USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_san_pham` = 13 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- 1.8 lit -> 1.8 lít
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x312e38206cc3ad74 USING utf8mb4) WHERE `ma_san_pham` = 13 AND `ma_thong_so` = 6 AND BINARY `gia_tri` = BINARY CONVERT(0x312e38206c6974 USING utf8mb4);

-- Long noi chong dinh -> Lòng nồi chống dính
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x4cc3b26e67206ee1bb9369206368e1bb916e672064c3ad6e68 USING utf8mb4) WHERE `ma_san_pham` = 13 AND `ma_thong_so` = 19 AND BINARY `gia_tri` = BINARY CONVERT(0x4c6f6e67206e6f692063686f6e672064696e68 USING utf8mb4);

-- Trang -> Trắng
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5472e1baaf6e67 USING utf8mb4) WHERE `ma_san_pham` = 14 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x5472616e67 USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_san_pham` = 14 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- 1.8 lit -> 1.8 lít
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x312e38206cc3ad74 USING utf8mb4) WHERE `ma_san_pham` = 14 AND `ma_thong_so` = 6 AND BINARY `gia_tri` = BINARY CONVERT(0x312e38206c6974 USING utf8mb4);

-- Long noi chong dinh -> Lòng nồi chống dính
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x4cc3b26e67206ee1bb9369206368e1bb916e672064c3ad6e68 USING utf8mb4) WHERE `ma_san_pham` = 14 AND `ma_thong_so` = 19 AND BINARY `gia_tri` = BINARY CONVERT(0x4c6f6e67206e6f692063686f6e672064696e68 USING utf8mb4);

-- Do -> Đỏ
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0xc490e1bb8f USING utf8mb4) WHERE `ma_san_pham` = 15 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x446f USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_san_pham` = 15 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- Loc HEPA -> Lọc HEPA
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x4ce1bb8d632048455041 USING utf8mb4) WHERE `ma_san_pham` = 15 AND `ma_thong_so` = 17 AND BINARY `gia_tri` = BINARY CONVERT(0x4c6f632048455041 USING utf8mb4);

-- Xam -> Xám
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x58c3a16d USING utf8mb4) WHERE `ma_san_pham` = 16 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x58616d USING utf8mb4);

-- Trung Quoc -> Trung Quốc
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5472756e67205175e1bb9163 USING utf8mb4) WHERE `ma_san_pham` = 16 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x5472756e672051756f63 USING utf8mb4);

-- Loc HEPA -> Lọc HEPA
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x4ce1bb8d632048455041 USING utf8mb4) WHERE `ma_san_pham` = 16 AND `ma_thong_so` = 17 AND BINARY `gia_tri` = BINARY CONVERT(0x4c6f632048455041 USING utf8mb4);

-- Den -> Đen
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0xc490656e USING utf8mb4) WHERE `ma_san_pham` = 17 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x44656e USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_san_pham` = 17 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- 1.7 lit -> 1.7 lít
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x312e37206cc3ad74 USING utf8mb4) WHERE `ma_san_pham` = 17 AND `ma_thong_so` = 6 AND BINARY `gia_tri` = BINARY CONVERT(0x312e37206c6974 USING utf8mb4);

-- Tu ngat khi soi -> Tự ngắt khi sôi
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x54e1bbb1206e67e1baaf74206b68692073c3b469 USING utf8mb4) WHERE `ma_san_pham` = 17 AND `ma_thong_so` = 21 AND BINARY `gia_tri` = BINARY CONVERT(0x5475206e676174206b686920736f69 USING utf8mb4);

-- Trang -> Trắng
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5472e1baaf6e67 USING utf8mb4) WHERE `ma_san_pham` = 18 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x5472616e67 USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_san_pham` = 18 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- 1.7 lit -> 1.7 lít
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x312e37206cc3ad74 USING utf8mb4) WHERE `ma_san_pham` = 18 AND `ma_thong_so` = 6 AND BINARY `gia_tri` = BINARY CONVERT(0x312e37206c6974 USING utf8mb4);

-- Tu ngat khi soi -> Tự ngắt khi sôi
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x54e1bbb1206e67e1baaf74206b68692073c3b469 USING utf8mb4) WHERE `ma_san_pham` = 18 AND `ma_thong_so` = 21 AND BINARY `gia_tri` = BINARY CONVERT(0x5475206e676174206b686920736f69 USING utf8mb4);

-- Trang -> Trắng
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5472e1baaf6e67 USING utf8mb4) WHERE `ma_san_pham` = 19 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x5472616e67 USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_san_pham` = 19 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- 10 loi -> 10 lõi
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x3130206cc3b569 USING utf8mb4) WHERE `ma_san_pham` = 19 AND `ma_thong_so` = 9 AND BINARY `gia_tri` = BINARY CONVERT(0x3130206c6f69 USING utf8mb4);

-- Trang -> Trắng
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5472e1baaf6e67 USING utf8mb4) WHERE `ma_san_pham` = 20 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x5472616e67 USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_san_pham` = 20 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- Den -> Đen
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0xc490656e USING utf8mb4) WHERE `ma_san_pham` = 21 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x44656e USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_san_pham` = 21 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- Trang -> Trắng
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5472e1baaf6e67 USING utf8mb4) WHERE `ma_san_pham` = 22 AND `ma_thong_so` = 1 AND BINARY `gia_tri` = BINARY CONVERT(0x5472616e67 USING utf8mb4);

-- Viet Nam -> Việt Nam
UPDATE `thong_so_san_pham` SET `gia_tri` = CONVERT(0x5669e1bb8774204e616d USING utf8mb4) WHERE `ma_san_pham` = 22 AND `ma_thong_so` = 2 AND BINARY `gia_tri` = BINARY CONVERT(0x56696574204e616d USING utf8mb4);

-- Tu lanh Samsung Inverter 236 lit -> Tủ lạnh Samsung Inverter 236 lít
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x54e1bba7206ce1baa16e682053616d73756e6720496e76657274657220323336206cc3ad74 USING utf8mb4) WHERE `ma_hinh_anh` = 1 AND BINARY `mo_ta` = BINARY CONVERT(0x5475206c616e682053616d73756e6720496e76657274657220323336206c6974 USING utf8mb4);

-- Tu lanh LG Inverter 474 lit -> Tủ lạnh LG Inverter 474 lít
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x54e1bba7206ce1baa16e68204c4720496e76657274657220343734206cc3ad74 USING utf8mb4) WHERE `ma_hinh_anh` = 2 AND BINARY `mo_ta` = BINARY CONVERT(0x5475206c616e68204c4720496e76657274657220343734206c6974 USING utf8mb4);

-- Tu lanh Toshiba 180 lit -> Tủ lạnh Toshiba 180 lít
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x54e1bba7206ce1baa16e6820546f736869626120313830206cc3ad74 USING utf8mb4) WHERE `ma_hinh_anh` = 3 AND BINARY `mo_ta` = BINARY CONVERT(0x5475206c616e6820546f736869626120313830206c6974 USING utf8mb4);

-- May giat Samsung 9 kg -> Máy giặt Samsung 9 kg
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4dc3a179206769e1bab7742053616d73756e672039206b67 USING utf8mb4) WHERE `ma_hinh_anh` = 4 AND BINARY `mo_ta` = BINARY CONVERT(0x4d617920676961742053616d73756e672039206b67 USING utf8mb4);

-- May giat LG Inverter 10 kg -> Máy giặt LG Inverter 10 kg
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4dc3a179206769e1bab774204c4720496e766572746572203130206b67 USING utf8mb4) WHERE `ma_hinh_anh` = 5 AND BINARY `mo_ta` = BINARY CONVERT(0x4d61792067696174204c4720496e766572746572203130206b67 USING utf8mb4);

-- May giat Panasonic 9 kg -> Máy giặt Panasonic 9 kg
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4dc3a179206769e1bab7742050616e61736f6e69632039206b67 USING utf8mb4) WHERE `ma_hinh_anh` = 6 AND BINARY `mo_ta` = BINARY CONVERT(0x4d617920676961742050616e61736f6e69632039206b67 USING utf8mb4);

-- Lo vi song Sharp 20 lit -> Lò vi sóng Sharp 20 lít
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4cc3b22076692073c3b36e67205368617270203230206cc3ad74 USING utf8mb4) WHERE `ma_hinh_anh` = 7 AND BINARY `mo_ta` = BINARY CONVERT(0x4c6f20766920736f6e67205368617270203230206c6974 USING utf8mb4);

-- Lo vi song Panasonic 25 lit -> Lò vi sóng Panasonic 25 lít
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4cc3b22076692073c3b36e672050616e61736f6e6963203235206cc3ad74 USING utf8mb4) WHERE `ma_hinh_anh` = 8 AND BINARY `mo_ta` = BINARY CONVERT(0x4c6f20766920736f6e672050616e61736f6e6963203235206c6974 USING utf8mb4);

-- Dieu hoa Daikin 1.5 HP -> Điều hòa Daikin 1.5 HP
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0xc49069e1bb81752068c3b261204461696b696e20312e35204850 USING utf8mb4) WHERE `ma_hinh_anh` = 9 AND BINARY `mo_ta` = BINARY CONVERT(0x4469657520686f61204461696b696e20312e35204850 USING utf8mb4);

-- Dieu hoa LG 1.5 HP -> Điều hòa LG 1.5 HP
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0xc49069e1bb81752068c3b261204c4720312e35204850 USING utf8mb4) WHERE `ma_hinh_anh` = 10 AND BINARY `mo_ta` = BINARY CONVERT(0x4469657520686f61204c4720312e35204850 USING utf8mb4);

-- Bep tu Panasonic -> Bếp từ Panasonic
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x42e1babf702074e1bbab2050616e61736f6e6963 USING utf8mb4) WHERE `ma_hinh_anh` = 11 AND BINARY `mo_ta` = BINARY CONVERT(0x4265702074752050616e61736f6e6963 USING utf8mb4);

-- Bep tu Sunhouse -> Bếp từ Sunhouse
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x42e1babf702074e1bbab2053756e686f757365 USING utf8mb4) WHERE `ma_hinh_anh` = 12 AND BINARY `mo_ta` = BINARY CONVERT(0x4265702074752053756e686f757365 USING utf8mb4);

-- Noi com dien Toshiba 1.8 lit -> Nồi cơm điện Toshiba 1.8 lít
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4ee1bb93692063c6a16d20c49169e1bb876e20546f736869626120312e38206cc3ad74 USING utf8mb4) WHERE `ma_hinh_anh` = 13 AND BINARY `mo_ta` = BINARY CONVERT(0x4e6f6920636f6d206469656e20546f736869626120312e38206c6974 USING utf8mb4);

-- Noi com dien Sunhouse 1.8 lit -> Nồi cơm điện Sunhouse 1.8 lít
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4ee1bb93692063c6a16d20c49169e1bb876e2053756e686f75736520312e38206cc3ad74 USING utf8mb4) WHERE `ma_hinh_anh` = 14 AND BINARY `mo_ta` = BINARY CONVERT(0x4e6f6920636f6d206469656e2053756e686f75736520312e38206c6974 USING utf8mb4);

-- May hut bui LG -> Máy hút bụi LG
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4dc3a1792068c3ba742062e1bba569204c47 USING utf8mb4) WHERE `ma_hinh_anh` = 15 AND BINARY `mo_ta` = BINARY CONVERT(0x4d61792068757420627569204c47 USING utf8mb4);

-- May hut bui Electrolux -> Máy hút bụi Electrolux
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4dc3a1792068c3ba742062e1bba56920456c656374726f6c7578 USING utf8mb4) WHERE `ma_hinh_anh` = 16 AND BINARY `mo_ta` = BINARY CONVERT(0x4d6179206875742062756920456c656374726f6c7578 USING utf8mb4);

-- Am sieu toc Toshiba 1.7 lit -> Ấm siêu tốc Toshiba 1.7 lít
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0xe1baa46d207369c3aa752074e1bb916320546f736869626120312e37206cc3ad74 USING utf8mb4) WHERE `ma_hinh_anh` = 17 AND BINARY `mo_ta` = BINARY CONVERT(0x416d207369657520746f6320546f736869626120312e37206c6974 USING utf8mb4);

-- Am sieu toc Panasonic 1.7 lit -> Ấm siêu tốc Panasonic 1.7 lít
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0xe1baa46d207369c3aa752074e1bb91632050616e61736f6e696320312e37206cc3ad74 USING utf8mb4) WHERE `ma_hinh_anh` = 18 AND BINARY `mo_ta` = BINARY CONVERT(0x416d207369657520746f632050616e61736f6e696320312e37206c6974 USING utf8mb4);

-- May loc nuoc Sunhouse 10 loi -> Máy lọc nước Sunhouse 10 lõi
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4dc3a179206ce1bb8d63206ec6b0e1bb9b632053756e686f757365203130206cc3b569 USING utf8mb4) WHERE `ma_hinh_anh` = 19 AND BINARY `mo_ta` = BINARY CONVERT(0x4d6179206c6f63206e756f632053756e686f757365203130206c6f69 USING utf8mb4);

-- May loc nuoc Panasonic RO -> Máy lọc nước Panasonic RO
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4dc3a179206ce1bb8d63206ec6b0e1bb9b632050616e61736f6e696320524f USING utf8mb4) WHERE `ma_hinh_anh` = 20 AND BINARY `mo_ta` = BINARY CONVERT(0x4d6179206c6f63206e756f632050616e61736f6e696320524f USING utf8mb4);

-- Quat Panasonic dung -> Quạt Panasonic đứng
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x5175e1baa1742050616e61736f6e696320c491e1bba96e67 USING utf8mb4) WHERE `ma_hinh_anh` = 21 AND BINARY `mo_ta` = BINARY CONVERT(0x517561742050616e61736f6e69632064756e67 USING utf8mb4);

-- Quat Sunhouse dung -> Quạt Sunhouse đứng
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x5175e1baa1742053756e686f75736520c491e1bba96e67 USING utf8mb4) WHERE `ma_hinh_anh` = 22 AND BINARY `mo_ta` = BINARY CONVERT(0x517561742053756e686f7573652064756e67 USING utf8mb4);

-- Tu lanh Samsung Inverter 236 lit -> Tủ lạnh Samsung Inverter 236 lít
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x54e1bba7206ce1baa16e682053616d73756e6720496e76657274657220323336206cc3ad74 USING utf8mb4) WHERE `ma_hinh_anh` = 32 AND BINARY `mo_ta` = BINARY CONVERT(0x5475206c616e682053616d73756e6720496e76657274657220323336206c6974 USING utf8mb4);

-- Tu lanh LG Inverter 474 lit -> Tủ lạnh LG Inverter 474 lít
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x54e1bba7206ce1baa16e68204c4720496e76657274657220343734206cc3ad74 USING utf8mb4) WHERE `ma_hinh_anh` = 33 AND BINARY `mo_ta` = BINARY CONVERT(0x5475206c616e68204c4720496e76657274657220343734206c6974 USING utf8mb4);

-- Tu lanh Toshiba 180 lit -> Tủ lạnh Toshiba 180 lít
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x54e1bba7206ce1baa16e6820546f736869626120313830206cc3ad74 USING utf8mb4) WHERE `ma_hinh_anh` = 34 AND BINARY `mo_ta` = BINARY CONVERT(0x5475206c616e6820546f736869626120313830206c6974 USING utf8mb4);

-- May giat Samsung 9 kg -> Máy giặt Samsung 9 kg
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4dc3a179206769e1bab7742053616d73756e672039206b67 USING utf8mb4) WHERE `ma_hinh_anh` = 35 AND BINARY `mo_ta` = BINARY CONVERT(0x4d617920676961742053616d73756e672039206b67 USING utf8mb4);

-- May giat LG Inverter 10 kg -> Máy giặt LG Inverter 10 kg
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4dc3a179206769e1bab774204c4720496e766572746572203130206b67 USING utf8mb4) WHERE `ma_hinh_anh` = 36 AND BINARY `mo_ta` = BINARY CONVERT(0x4d61792067696174204c4720496e766572746572203130206b67 USING utf8mb4);

-- May giat Panasonic 9 kg -> Máy giặt Panasonic 9 kg
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4dc3a179206769e1bab7742050616e61736f6e69632039206b67 USING utf8mb4) WHERE `ma_hinh_anh` = 37 AND BINARY `mo_ta` = BINARY CONVERT(0x4d617920676961742050616e61736f6e69632039206b67 USING utf8mb4);

-- Lo vi song Sharp 20 lit -> Lò vi sóng Sharp 20 lít
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4cc3b22076692073c3b36e67205368617270203230206cc3ad74 USING utf8mb4) WHERE `ma_hinh_anh` = 38 AND BINARY `mo_ta` = BINARY CONVERT(0x4c6f20766920736f6e67205368617270203230206c6974 USING utf8mb4);

-- Lo vi song Panasonic 25 lit -> Lò vi sóng Panasonic 25 lít
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4cc3b22076692073c3b36e672050616e61736f6e6963203235206cc3ad74 USING utf8mb4) WHERE `ma_hinh_anh` = 39 AND BINARY `mo_ta` = BINARY CONVERT(0x4c6f20766920736f6e672050616e61736f6e6963203235206c6974 USING utf8mb4);

-- Dieu hoa Daikin 1.5 HP -> Điều hòa Daikin 1.5 HP
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0xc49069e1bb81752068c3b261204461696b696e20312e35204850 USING utf8mb4) WHERE `ma_hinh_anh` = 40 AND BINARY `mo_ta` = BINARY CONVERT(0x4469657520686f61204461696b696e20312e35204850 USING utf8mb4);

-- Dieu hoa LG 1.5 HP -> Điều hòa LG 1.5 HP
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0xc49069e1bb81752068c3b261204c4720312e35204850 USING utf8mb4) WHERE `ma_hinh_anh` = 41 AND BINARY `mo_ta` = BINARY CONVERT(0x4469657520686f61204c4720312e35204850 USING utf8mb4);

-- Bep tu Panasonic -> Bếp từ Panasonic
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x42e1babf702074e1bbab2050616e61736f6e6963 USING utf8mb4) WHERE `ma_hinh_anh` = 42 AND BINARY `mo_ta` = BINARY CONVERT(0x4265702074752050616e61736f6e6963 USING utf8mb4);

-- Bep tu Sunhouse -> Bếp từ Sunhouse
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x42e1babf702074e1bbab2053756e686f757365 USING utf8mb4) WHERE `ma_hinh_anh` = 43 AND BINARY `mo_ta` = BINARY CONVERT(0x4265702074752053756e686f757365 USING utf8mb4);

-- Noi com dien Toshiba 1.8 lit -> Nồi cơm điện Toshiba 1.8 lít
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4ee1bb93692063c6a16d20c49169e1bb876e20546f736869626120312e38206cc3ad74 USING utf8mb4) WHERE `ma_hinh_anh` = 44 AND BINARY `mo_ta` = BINARY CONVERT(0x4e6f6920636f6d206469656e20546f736869626120312e38206c6974 USING utf8mb4);

-- Noi com dien Sunhouse 1.8 lit -> Nồi cơm điện Sunhouse 1.8 lít
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4ee1bb93692063c6a16d20c49169e1bb876e2053756e686f75736520312e38206cc3ad74 USING utf8mb4) WHERE `ma_hinh_anh` = 45 AND BINARY `mo_ta` = BINARY CONVERT(0x4e6f6920636f6d206469656e2053756e686f75736520312e38206c6974 USING utf8mb4);

-- May hut bui LG -> Máy hút bụi LG
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4dc3a1792068c3ba742062e1bba569204c47 USING utf8mb4) WHERE `ma_hinh_anh` = 46 AND BINARY `mo_ta` = BINARY CONVERT(0x4d61792068757420627569204c47 USING utf8mb4);

-- May hut bui Electrolux -> Máy hút bụi Electrolux
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4dc3a1792068c3ba742062e1bba56920456c656374726f6c7578 USING utf8mb4) WHERE `ma_hinh_anh` = 47 AND BINARY `mo_ta` = BINARY CONVERT(0x4d6179206875742062756920456c656374726f6c7578 USING utf8mb4);

-- Am sieu toc Toshiba 1.7 lit -> Ấm siêu tốc Toshiba 1.7 lít
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0xe1baa46d207369c3aa752074e1bb916320546f736869626120312e37206cc3ad74 USING utf8mb4) WHERE `ma_hinh_anh` = 48 AND BINARY `mo_ta` = BINARY CONVERT(0x416d207369657520746f6320546f736869626120312e37206c6974 USING utf8mb4);

-- Am sieu toc Panasonic 1.7 lit -> Ấm siêu tốc Panasonic 1.7 lít
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0xe1baa46d207369c3aa752074e1bb91632050616e61736f6e696320312e37206cc3ad74 USING utf8mb4) WHERE `ma_hinh_anh` = 49 AND BINARY `mo_ta` = BINARY CONVERT(0x416d207369657520746f632050616e61736f6e696320312e37206c6974 USING utf8mb4);

-- May loc nuoc Sunhouse 10 loi -> Máy lọc nước Sunhouse 10 lõi
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4dc3a179206ce1bb8d63206ec6b0e1bb9b632053756e686f757365203130206cc3b569 USING utf8mb4) WHERE `ma_hinh_anh` = 50 AND BINARY `mo_ta` = BINARY CONVERT(0x4d6179206c6f63206e756f632053756e686f757365203130206c6f69 USING utf8mb4);

-- May loc nuoc Panasonic RO -> Máy lọc nước Panasonic RO
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x4dc3a179206ce1bb8d63206ec6b0e1bb9b632050616e61736f6e696320524f USING utf8mb4) WHERE `ma_hinh_anh` = 51 AND BINARY `mo_ta` = BINARY CONVERT(0x4d6179206c6f63206e756f632050616e61736f6e696320524f USING utf8mb4);

-- Quat Panasonic dung -> Quạt Panasonic đứng
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x5175e1baa1742050616e61736f6e696320c491e1bba96e67 USING utf8mb4) WHERE `ma_hinh_anh` = 52 AND BINARY `mo_ta` = BINARY CONVERT(0x517561742050616e61736f6e69632064756e67 USING utf8mb4);

-- Quat Sunhouse dung -> Quạt Sunhouse đứng
UPDATE `hinh_anh_san_pham` SET `mo_ta` = CONVERT(0x5175e1baa1742053756e686f75736520c491e1bba96e67 USING utf8mb4) WHERE `ma_hinh_anh` = 53 AND BINARY `mo_ta` = BINARY CONVERT(0x517561742053756e686f7573652064756e67 USING utf8mb4);

COMMIT;
