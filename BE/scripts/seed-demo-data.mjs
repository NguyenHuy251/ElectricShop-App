// Seed du lieu mau (~60 ban ghi / bang). Chay: node scripts/seed-demo-data.mjs
// Idempotent: chay lai nhieu lan khong nhan doi du lieu (kiem tra theo so luong / khoa duy nhat).
// Hinh anh lay tu Wikimedia Commons (mien phi ban quyen, URL on dinh).
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const TARGET = 60;
const c = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
});

// ---------- helpers ----------
let seed = 20261008;
const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const count = async (t) => (await c.query(`SELECT COUNT(*) n FROM \`${t}\``))[0][0].n;
const q = async (sql, params) => (await c.query(sql, params))[0];
const bulk = async (sql, rows) => { if (rows.length) await c.query(sql, [rows]); };
const pad = (n) => String(n).padStart(2, '0');
const daysAgo = (d, h = ri(7, 21)) => { const x = new Date(Date.now() - d * 86400000); x.setHours(h, ri(0, 59), ri(0, 59), 0); return x; };
const strip = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- image search (Wikimedia Commons) ----------
const imgCache = new Map();
const imgUse = new Map();
const BAD = /interior|drum|pictogram|diagram|logo|icon|map|capacit|night|inside|repair|manual|schematic|crowd|people|woman|man |girl|boy|kitchen|room|factory|museum|store|shop|shelf|part|label|plug|sign|symbol|cutaway|old |vintage|antique|1[89]\d\d/i;
async function imgs(query) {
  if (imgCache.has(query)) return imgCache.get(query);
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' +
    encodeURIComponent(query + ' filetype:bitmap') + '&gsrnamespace=6&gsrlimit=40&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=800&format=json&origin=*';
  let out = [];
  for (let attempt = 0; attempt < 3 && !out.length; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'ElectricShopSeed/1.0 (student project)' } });
      const j = await r.json();
      const pages = Object.values(j.query?.pages || {}).sort((a, b) => a.index - b.index);
      out = pages
        .filter((p) => !BAD.test(p.title))
        .map((p) => p.imageinfo?.[0])
        .filter((i) => i && /jpeg|png/.test(i.mime) && i.width >= 500 && i.height >= 400)
        .map((i) => (i.thumburl || i.url).replace('thumb.wikimedia.org', 'upload.wikimedia.org').split('?')[0])
        .filter((u) => u.length <= 240);
    } catch { await sleep(800); }
    await sleep(250);
  }
  imgCache.set(query, out);
  return out;
}
async function nextImg(query, extra = 0) {
  let list = await imgs(query);
  if (!list.length) list = await imgs('home appliance');
  const k = (imgUse.get(query) || 0);
  imgUse.set(query, k + 1 + extra);
  return list[(k + extra) % list.length] || null;
}

// ---------- reference data ----------
const BRANDS = [['Sanaky', 'Việt Nam'], ['Alaska', 'Việt Nam'], ['Kangaroo', 'Việt Nam'], ['Karofi', 'Việt Nam'], ['Philips', 'Hà Lan'], ['Tefal', 'Pháp'], ['Xiaomi', 'Trung Quốc'], ['Hitachi', 'Nhật Bản'], ['Bosch', 'Đức'], ['Casper', 'Thái Lan'], ['Mitsubishi Electric', 'Nhật Bản'], ['Gree', 'Trung Quốc'], ['Whirlpool', 'Mỹ'], ['Haier', 'Trung Quốc'], ['Hisense', 'Trung Quốc'], ['TCL', 'Trung Quốc'], ['Sony', 'Nhật Bản'], ['Comfee', 'Trung Quốc'], ['Mutosi', 'Việt Nam'], ['Ariston', 'Ý'], ['Russell Hobbs', 'Anh'], ['Kalite', 'Việt Nam'], ['Nagakawa', 'Việt Nam'], ['Fuji', 'Nhật Bản'], ['Rinnai', 'Nhật Bản'], ['Paloma', 'Nhật Bản'], ['Carrier', 'Mỹ'], ['Beko', 'Thổ Nhĩ Kỳ'], ['Smeg', 'Ý'], ['Siemens', 'Đức'], ['Miele', 'Đức'], ['Dyson', 'Anh'], ['Ecovacs', 'Trung Quốc'], ['Roborock', 'Trung Quốc'], ['iRobot', 'Mỹ'], ['Deerma', 'Trung Quốc'], ['Elmich', 'Việt Nam'], ['Zojirushi', 'Nhật Bản'], ['Cuckoo', 'Hàn Quốc'], ["De'Longhi", 'Ý'], ['Kenwood', 'Anh'], ['Braun', 'Đức'], ['Hafele', 'Đức'], ['Sakura', 'Việt Nam'], ['Hatari', 'Thái Lan'], ['Senko', 'Việt Nam'], ['Asia', 'Việt Nam'], ['Bluestone', 'Việt Nam'], ['Zanussi', 'Ý'], ['Sơn Hà', 'Việt Nam']];
const CATS = ['Máy sấy quần áo', 'Máy rửa bát', 'Tủ đông', 'Tủ mát', 'Máy hút mùi', 'Bếp gas', 'Bếp hồng ngoại', 'Lò nướng', 'Nồi chiên không dầu', 'Nồi áp suất điện', 'Máy xay sinh tố', 'Máy ép trái cây', 'Máy pha cà phê', 'Bình thủy điện', 'Máy làm sữa hạt', 'Máy đánh trứng', 'Bàn ủi', 'Bàn ủi hơi nước', 'Robot hút bụi', 'Máy lọc không khí', 'Máy tạo ẩm', 'Máy hút ẩm', 'Quạt điều hòa', 'Quạt treo tường', 'Quạt trần', 'Quạt sưởi', 'Máy sưởi dầu', 'Bình nước nóng', 'Máy nước nóng năng lượng mặt trời', 'Máy sấy tóc', 'Máy cạo râu', 'Nồi lẩu điện', 'Nồi nấu chậm', 'Máy nướng bánh mì', 'Máy làm bánh mì', 'Lò vi sóng có nướng', 'Máy xay thịt', 'Máy hút chân không', 'Cân điện tử', 'Đèn bàn LED', 'Đèn LED âm trần', 'Ổ cắm điện', 'Ổ cắm thông minh', 'Camera an ninh', 'Chuông cửa thông minh', 'Khóa cửa điện tử', 'Loa Bluetooth', 'Soundbar', 'Máy chiếu mini'];
// [danh muc, thuong hieu, ten, gia ban, tu khoa tim anh]
const PRODUCTS = [
  ['Máy sấy quần áo', 'Electrolux', 'Máy sấy quần áo Electrolux 8 kg', 9990000, 'clothes dryer'],
  ['Máy rửa bát', 'Bosch', 'Máy rửa bát Bosch 13 bộ', 15900000, 'dishwasher'],
  ['Tủ đông', 'Sanaky', 'Tủ đông Sanaky 300 lít', 6490000, 'chest freezer'],
  ['Tủ mát', 'Alaska', 'Tủ mát Alaska 450 lít', 8990000, 'display refrigerator'],
  ['Máy hút mùi', 'Hafele', 'Máy hút mùi Hafele 70 cm', 7490000, 'range hood'],
  ['Bếp gas', 'Rinnai', 'Bếp gas âm Rinnai', 3290000, 'gas stove'],
  ['Bếp hồng ngoại', 'Kangaroo', 'Bếp hồng ngoại Kangaroo', 1590000, 'infrared cooker'],
  ['Lò nướng', 'Kangaroo', 'Lò nướng Kangaroo 32 lít', 1890000, 'toaster oven'],
  ['Nồi chiên không dầu', 'Philips', 'Nồi chiên không dầu Philips 4.1 lít', 2990000, 'air fryer'],
  ['Nồi áp suất điện', 'Tefal', 'Nồi áp suất điện Tefal 6 lít', 2590000, 'electric pressure cooker'],
  ['Máy xay sinh tố', 'Philips', 'Máy xay sinh tố Philips 2 lít', 1390000, 'blender'],
  ['Máy ép trái cây', 'Kenwood', 'Máy ép trái cây Kenwood', 2190000, 'juicer'],
  ['Máy pha cà phê', "De'Longhi", "Máy pha cà phê De'Longhi", 7990000, 'espresso machine'],
  ['Bình thủy điện', 'Zojirushi', 'Bình thủy điện Zojirushi 3 lít', 3490000, 'electric kettle'],
  ['Máy làm sữa hạt', 'Midea', 'Máy làm sữa hạt Midea', 2290000, 'soy milk maker'],
  ['Máy đánh trứng', 'Braun', 'Máy đánh trứng Braun', 990000, 'hand mixer'],
  ['Bàn ủi', 'Philips', 'Bàn ủi khô Philips', 490000, 'clothes iron'],
  ['Bàn ủi hơi nước', 'Tefal', 'Bàn ủi hơi nước Tefal', 1290000, 'steam iron'],
  ['Robot hút bụi', 'Ecovacs', 'Robot hút bụi Ecovacs Deebot', 8990000, 'robot vacuum cleaner'],
  ['Máy lọc không khí', 'Xiaomi', 'Máy lọc không khí Xiaomi 4 Pro', 4990000, 'air purifier'],
  ['Máy tạo ẩm', 'Deerma', 'Máy tạo ẩm Deerma 4 lít', 790000, 'humidifier'],
  ['Máy hút ẩm', 'Kalite', 'Máy hút ẩm Kalite 20 lít', 4590000, 'dehumidifier'],
  ['Quạt điều hòa', 'Kangaroo', 'Quạt điều hòa Kangaroo 40 lít', 3490000, 'evaporative air cooler'],
  ['Quạt treo tường', 'Senko', 'Quạt treo tường Senko', 490000, 'wall mounted fan'],
  ['Quạt trần', 'Asia', 'Quạt trần Asia 3 cánh', 1190000, 'ceiling fan'],
  ['Quạt sưởi', 'Hatari', 'Quạt sưởi Hatari', 790000, 'fan heater'],
  ['Máy sưởi dầu', 'Sanaky', 'Máy sưởi dầu Sanaky 11 thanh', 1490000, 'oil heater'],
  ['Bình nước nóng', 'Ariston', 'Bình nước nóng Ariston 30 lít', 3290000, 'electric water heater'],
  ['Máy nước nóng năng lượng mặt trời', 'Sơn Hà', 'Máy nước nóng NLMT Sơn Hà 150 lít', 6990000, 'solar water heater'],
  ['Máy sấy tóc', 'Panasonic', 'Máy sấy tóc Panasonic', 590000, 'hair dryer'],
  ['Máy cạo râu', 'Braun', 'Máy cạo râu Braun Series 5', 2490000, 'electric shaver'],
  ['Nồi lẩu điện', 'Sunhouse', 'Nồi lẩu điện Sunhouse 5 lít', 590000, 'electric hot pot'],
  ['Nồi nấu chậm', 'Elmich', 'Nồi nấu chậm Elmich 3.5 lít', 790000, 'slow cooker'],
  ['Máy nướng bánh mì', 'Russell Hobbs', 'Máy nướng bánh mì Russell Hobbs', 1290000, 'bread toaster'],
  ['Máy làm bánh mì', 'Kenwood', 'Máy làm bánh mì Kenwood', 3990000, 'bread machine'],
  ['Lò vi sóng có nướng', 'Samsung', 'Lò vi sóng Samsung 23 lít có nướng', 2790000, 'microwave oven'],
  ['Máy xay thịt', 'Philips', 'Máy xay thịt Philips', 1590000, 'meat grinder'],
  ['Máy hút chân không', 'Tefal', 'Máy hút chân không thực phẩm Tefal', 1190000, 'vacuum sealer'],
];
const OLD_CAT_QUERY = { 'Tủ lạnh': 'refrigerator', 'Máy giặt': 'washing machine', 'Lò vi sóng': 'microwave oven', 'Điều hòa': 'air conditioner', 'Bếp điện': 'induction cooktop', 'Nồi cơm điện': 'rice cooker', 'Máy hút bụi': 'vacuum cleaner', 'Ấm siêu tốc': 'electric kettle', 'Máy lọc nước': 'water purifier', 'Quạt điện': 'electric fan', 'Tivi': 'television' };
const COLORS = ['Trắng', 'Đen', 'Bạc', 'Xám', 'Xanh navy', 'Đỏ', 'Vàng đồng'];
const ORIGINS = ['Việt Nam', 'Trung Quốc', 'Thái Lan', 'Nhật Bản', 'Hàn Quốc', 'Đức', 'Malaysia'];

const LAST = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const MID = ['Văn', 'Thị', 'Đức', 'Minh', 'Ngọc', 'Quang', 'Thanh', 'Hữu', 'Anh', 'Gia', 'Hoài', 'Bảo'];
const FIRST = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hà', 'Hải', 'Hạnh', 'Hiếu', 'Hoa', 'Hùng', 'Khánh', 'Lan', 'Linh', 'Long', 'Mai', 'Nam', 'Nga', 'Phong', 'Phúc', 'Quân', 'Sơn', 'Thảo', 'Trang', 'Tú', 'Tuấn', 'Vy', 'Yến'];
const STREETS = ['Nguyễn Trãi', 'Lê Lợi', 'Trần Hưng Đạo', 'Phạm Văn Đồng', 'Cầu Giấy', 'Hai Bà Trưng', 'Điện Biên Phủ', 'Lạch Tray', 'Nguyễn Huệ', 'Hoàng Diệu', 'Trường Chinh', 'Láng Hạ'];
const CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ', 'Huế', 'Nam Định', 'Bắc Ninh'];
const fullName = () => `${pick(LAST)} ${pick(MID)} ${pick(FIRST)}`;
const address = () => `Số ${ri(1, 250)} đường ${pick(STREETS)}, ${pick(CITIES)}`;
const phone = () => `09${ri(10000000, 99999999)}`;

// ================= 1. thuong_hieu =================
{
  const have = new Set((await q('SELECT ten_thuong_hieu t FROM thuong_hieu')).map((x) => x.t));
  const need = TARGET - (await count('thuong_hieu'));
  const rows = BRANDS.filter((b) => !have.has(b[0])).slice(0, Math.max(0, need)).map(([n, qg]) => [n, qg, `Thương hiệu ${n} - thiết bị điện gia dụng chính hãng`]);
  await bulk('INSERT IGNORE INTO thuong_hieu (ten_thuong_hieu,quoc_gia,mo_ta) VALUES ?', rows);
  console.log('thuong_hieu +', rows.length);
}
// ================= 2. danh_muc =================
{
  const have = new Set((await q('SELECT ten_danh_muc t FROM danh_muc')).map((x) => x.t));
  const need = TARGET - (await count('danh_muc'));
  const rows = CATS.filter((n) => !have.has(n)).slice(0, Math.max(0, need)).map((n) => [n, `Danh mục ${n.toLowerCase()} chính hãng, bảo hành đầy đủ`, 1]);
  await bulk('INSERT IGNORE INTO danh_muc (ten_danh_muc,mo_ta,trang_thai) VALUES ?', rows);
  console.log('danh_muc +', rows.length);
}
const catId = Object.fromEntries((await q('SELECT ma_danh_muc id,ten_danh_muc t FROM danh_muc')).map((x) => [x.t, x.id]));
const brandId = Object.fromEntries((await q('SELECT ma_thuong_hieu id,ten_thuong_hieu t FROM thuong_hieu')).map((x) => [x.t, x.id]));

// ================= 3. nhom_thong_so / thong_so =================
{
  const meaningful = ['Thiết kế', 'Bảo hành và hậu mãi', 'Kết nối thông minh', 'Môi trường sử dụng', 'Phụ kiện đi kèm', 'Tiện ích', 'Tiêu chuẩn chất lượng', 'Đóng gói', 'Vật liệu', 'Tiết kiệm năng lượng', 'An toàn điện', 'Vệ sinh và bảo trì', 'Âm thanh', 'Hình ảnh', 'Nguồn điện'];
  const have = new Set((await q('SELECT ten_nhom_thong_so t FROM nhom_thong_so')).map((x) => x.t));
  const need = TARGET - (await count('nhom_thong_so'));
  const names = [...meaningful];
  for (let i = 1; names.length < 80; i++) names.push(`Nhóm thông số mở rộng ${pad(i)}`);
  const rows = names.filter((n) => !have.has(n)).slice(0, Math.max(0, need)).map((n, i) => [n, 10 + i, 1]);
  await bulk('INSERT IGNORE INTO nhom_thong_so (ten_nhom_thong_so,thu_tu_hien_thi,trang_thai) VALUES ?', rows);
  console.log('nhom_thong_so +', rows.length);
}
{
  // [nhom, ten, kieu, don vi, loc]
  const T = [[2, 'Trọng lượng', 'NUMBER', 'kg', 0], [3, 'Điện áp', 'NUMBER', 'V', 0], [3, 'Tần số', 'NUMBER', 'Hz', 0], [5, 'Thời gian bảo hành', 'NUMBER', 'tháng', 1], [1, 'Chất liệu vỏ', 'TEXT', null, 0], [2, 'Chiều dài dây điện', 'NUMBER', 'm', 0], [3, 'Mức ồn', 'NUMBER', 'dB', 1], [3, 'Hiệu suất năng lượng', 'OPTION', null, 1], [2, 'Dung tích bình chứa', 'NUMBER', 'L', 1], [3, 'Nhiệt độ tối đa', 'NUMBER', '°C', 0], [4, 'Số tốc độ', 'NUMBER', 'mức', 1], [4, 'Hẹn giờ', 'BOOLEAN', null, 1], [4, 'Điều khiển từ xa', 'BOOLEAN', null, 1], [4, 'Kết nối Wi-Fi', 'BOOLEAN', null, 1], [4, 'Kết nối Bluetooth', 'BOOLEAN', null, 1], [5, 'Chống nước (IP)', 'TEXT', null, 0], [3, 'Lưu lượng gió', 'NUMBER', 'm³/h', 1], [3, 'Áp suất', 'NUMBER', 'bar', 0], [1, 'Phụ kiện đi kèm', 'TEXT', null, 0], [4, 'Chế độ tự động', 'BOOLEAN', null, 1], [4, 'Tự làm sạch', 'BOOLEAN', null, 1], [5, 'Chống giật', 'BOOLEAN', null, 0], [5, 'Ngắt điện tự động', 'BOOLEAN', null, 0], [4, 'Bảng điều khiển', 'TEXT', null, 0], [3, 'Độ sáng', 'NUMBER', 'lm', 1], [1, 'Tuổi thọ ước tính', 'NUMBER', 'năm', 0]];
  const have = new Set((await q('SELECT ten_thong_so t FROM thong_so')).map((x) => x.t));
  const need = TARGET - (await count('thong_so'));
  const rows = T.filter((t) => !have.has(t[1])).slice(0, Math.max(0, need)).map((t, i) => [t[0], t[1], t[2], t[3], t[4], 20 + i, 1]);
  await bulk('INSERT IGNORE INTO thong_so (ma_nhom_thong_so,ten_thong_so,kieu_du_lieu,don_vi,cho_phep_loc,thu_tu_hien_thi,trang_thai) VALUES ?', rows);
  console.log('thong_so +', rows.length);
}

// ================= 4. san_pham + hinh_anh =================
const spCodes = new Set((await q('SELECT ma_san_pham_code c FROM san_pham')).map((x) => x.c));
const newProducts = [];
for (let i = 0; i < PRODUCTS.length; i++) {
  const [cat, brand, name, price, query] = PRODUCTS[i];
  const code = `SP${100 + i}`;
  if (spCodes.has(code) || !catId[cat] || !brandId[brand]) continue;
  const img = await nextImg(query);
  const gia = price;
  newProducts.push({ code, cat, brand, name, price: gia, query, img });
}
await bulk('INSERT IGNORE INTO san_pham (ma_danh_muc,ma_thuong_hieu,ma_san_pham_code,ten_san_pham,mo_ta,gia_nhap,gia_ban,so_luong,bao_hanh,hinh_anh,trang_thai) VALUES ?',
  newProducts.map((p) => [catId[p.cat], brandId[p.brand], p.code, p.name, `${p.name} chính hãng, vận hành êm ái, tiết kiệm điện, bảo hành toàn quốc.`, Math.round(p.price * 0.8), p.price, ri(10, 60), pick([12, 24, 24, 36]), p.img, 'DangBan']));
console.log('san_pham +', newProducts.length);

// sua hinh_anh san pham cu khong phai URL
{
  const old = await q("SELECT s.ma_san_pham id, d.ten_danh_muc cat FROM san_pham s JOIN danh_muc d ON d.ma_danh_muc=s.ma_danh_muc WHERE s.hinh_anh IS NULL OR s.hinh_anh NOT LIKE 'http%'");
  for (const o of old) {
    const img = await nextImg(OLD_CAT_QUERY[o.cat] || 'home appliance');
    if (img) await q('UPDATE san_pham SET hinh_anh=? WHERE ma_san_pham=?', [img, o.id]);
  }
  console.log('san_pham hinh_anh fixed', old.length);
}
const prodByCode = Object.fromEntries((await q('SELECT ma_san_pham id, ma_san_pham_code c, ten_san_pham n, hinh_anh h FROM san_pham')).map((x) => [x.c, x]));

// hinh_anh_san_pham: anh chinh cho moi sp chua co + anh phu cho 22 sp moi dau
{
  const rows = [];
  let extraCount = 0;
  for (const p of newProducts) {
    const row = prodByCode[p.code]; if (!row) continue;
    const has = (await q('SELECT 1 FROM hinh_anh_san_pham WHERE ma_san_pham=? LIMIT 1', [row.id])).length;
    if (has) continue;
    rows.push([row.id, p.img, p.name, 1, 1]);
    if (extraCount < 22) { const e = await nextImg(p.query, 1); if (e && e !== p.img) { rows.push([row.id, e, `${p.name} - góc nhìn khác`, 0, 2]); extraCount++; } }
  }
  await bulk('INSERT INTO hinh_anh_san_pham (ma_san_pham,duong_dan,mo_ta,la_anh_chinh,thu_tu_hien_thi) VALUES ?', rows);
  console.log('hinh_anh_san_pham +', rows.length);
}

// ================= 5. thong_so_san_pham + danh_muc_thong_so =================
{
  const rows = [];
  for (const p of newProducts) {
    const id = prodByCode[p.code].id;
    const w = ri(3, 30) * 50;
    rows.push([id, 1, pick(COLORS), null, null]);
    rows.push([id, 2, pick(ORIGINS), null, null]);
    rows.push([id, 10, `${w}W`, w, null]);
  }
  await bulk('INSERT IGNORE INTO thong_so_san_pham (ma_san_pham,ma_thong_so,gia_tri,gia_tri_so,gia_tri_bool) VALUES ?', rows);
  const dm = [];
  for (const n of CATS) if (catId[n]) { dm.push([catId[n], 1, 1, 1], [catId[n], 2, 0, 2], [catId[n], 10, 0, 3]); }
  await bulk('INSERT IGNORE INTO danh_muc_thong_so (ma_danh_muc,ma_thong_so,bat_buoc,thu_tu_hien_thi) VALUES ?', dm);
  console.log('thong_so_san_pham +', rows.length, '| danh_muc_thong_so rows tried', dm.length);
}

// ================= 6. tai_khoan + nhan_vien =================
const pwCustomer = (await q('SELECT mat_khau m FROM tai_khoan WHERE ten_dang_nhap="huy2005"'))[0].m;
const pwStaff = (await q('SELECT mat_khau m FROM tai_khoan WHERE ten_dang_nhap="nhanvien01"'))[0].m;
{
  const needTotal = TARGET - (await count('tai_khoan'));
  if (needTotal > 0) {
    const staffN = Math.min(15, needTotal), custN = needTotal - staffN;
    const rows = [];
    for (let i = 0; i < staffN; i++) { const u = `nhanvien${pad(i + 2)}`; const n = fullName(); rows.push([u, pwStaff, n, `${u}@gmail.com`, phone(), address(), 'NhanVien', 'HoatDong']); }
    for (let i = 0; i < custN; i++) { const u = `khachhang${pad(i + 1)}`; const n = fullName(); rows.push([u, pwCustomer, n, `${u}@gmail.com`, phone(), address(), 'KhachHang', 'HoatDong']); }
    await bulk('INSERT IGNORE INTO tai_khoan (ten_dang_nhap,mat_khau,ho_ten,email,so_dien_thoai,dia_chi,vai_tro,trang_thai) VALUES ?', rows);
    console.log('tai_khoan +', rows.length);
  }
}
{
  const need = TARGET - (await count('nhan_vien'));
  if (need > 0) {
    const free = await q("SELECT t.ma_tai_khoan id,t.ho_ten n,t.email e,t.so_dien_thoai p FROM tai_khoan t LEFT JOIN nhan_vien n ON n.ma_tai_khoan=t.ma_tai_khoan WHERE t.vai_tro='NhanVien' AND n.ma_nhan_vien IS NULL");
    const CHUCVU = ['Nhân viên bán hàng', 'Nhân viên kho', 'Kỹ thuật viên', 'Chăm sóc khách hàng', 'Nhân viên giao hàng', 'Thu ngân', 'Quản lý ca', 'Kế toán'];
    const rows = [];
    for (let i = 0; i < need; i++) {
      const f = free[i];
      const n = f ? f.n : fullName();
      rows.push([f ? f.id : null, n, pick(CHUCVU), f?.p || phone(), f?.e || `${strip(n).toLowerCase().replace(/\s+/g, '.')}${i}@electricshop.vn`, daysAgo(ri(30, 900)), ri(7, 18) * 1000000, i % 12 === 11 ? 'NghiLam' : 'DangLam']);
    }
    await bulk('INSERT INTO nhan_vien (ma_tai_khoan,ho_ten,chuc_vu,so_dien_thoai,email,ngay_vao_lam,luong,trang_thai) VALUES ?', rows);
    console.log('nhan_vien +', rows.length);
  }
}
const accounts = await q('SELECT ma_tai_khoan id,ho_ten n,so_dien_thoai p,dia_chi a,vai_tro r FROM tai_khoan');
const customers = accounts.filter((a) => a.r === 'KhachHang');
const staff = accounts.filter((a) => a.r !== 'KhachHang');

// ================= 7. san_pham_bien_the =================
{
  const need = TARGET - (await count('san_pham_bien_the'));
  if (need > 0) {
    const rows = [], touched = new Set();
    for (const p of newProducts) {
      if (rows.length >= need) break;
      const id = prodByCode[p.code].id;
      const [c1, c2] = [pick(COLORS), pick(COLORS.filter((x) => true))];
      const cols = c1 === c2 ? [c1, COLORS[(COLORS.indexOf(c1) + 1) % COLORS.length]] : [c1, c2];
      cols.forEach((col, k) => {
        if (rows.length >= need) return;
        const json = JSON.stringify([{ gia_tri: col, ten_nhom: 'Thông tin cơ bản', ma_thong_so: 1, kieu_du_lieu: 'TEXT', ten_thong_so: 'Màu sắc' }]);
        rows.push([id, `${p.code}-${strip(col).toUpperCase().replace(/\s+/g, '')}`, `Màu ${col.toLowerCase()}`, p.price + k * 100000, ri(5, 40), 'DangBan', json]);
      });
      touched.add(id);
    }
    await bulk('INSERT IGNORE INTO san_pham_bien_the (ma_san_pham,ma_sku,ten_bien_the,gia_ban,so_luong,trang_thai,thong_so_json) VALUES ?', rows);
    await q('UPDATE san_pham s JOIN (SELECT ma_san_pham, SUM(so_luong) t FROM san_pham_bien_the GROUP BY ma_san_pham) v ON v.ma_san_pham=s.ma_san_pham SET s.so_luong=v.t');
    console.log('san_pham_bien_the +', rows.length);
  }
}
const plain = await q("SELECT ma_san_pham id,ten_san_pham n,gia_ban p FROM san_pham WHERE trang_thai='DangBan' AND ma_san_pham NOT IN (SELECT DISTINCT ma_san_pham FROM san_pham_bien_the)");
const allProd = await q('SELECT ma_san_pham id,ten_san_pham n FROM san_pham');

// ================= 8. gio_hang + chi_tiet_gio_hang =================
{
  await q('INSERT IGNORE INTO gio_hang (ma_tai_khoan) SELECT ma_tai_khoan FROM tai_khoan WHERE ma_tai_khoan NOT IN (SELECT ma_tai_khoan FROM gio_hang)');
  const need = TARGET - (await count('chi_tiet_gio_hang'));
  const carts = await q('SELECT ma_gio_hang id FROM gio_hang');
  const rows = [];
  for (let i = 0; i < Math.max(0, need) && i < carts.length * 2; i++) {
    rows.push([carts[i % carts.length].id, pick(plain).id, ri(1, 3)]);
  }
  await bulk('INSERT IGNORE INTO chi_tiet_gio_hang (ma_gio_hang,ma_san_pham,so_luong) VALUES ?', rows);
  console.log('gio_hang total', await count('gio_hang'), '| chi_tiet_gio_hang now', await count('chi_tiet_gio_hang'));
}

// ================= 9. dia_chi_giao_hang =================
{
  const need = TARGET - (await count('dia_chi_giao_hang'));
  const rows = [];
  for (let i = 0; i < Math.max(0, need); i++) {
    const a = customers[i % customers.length];
    rows.push([a.id, i < customers.length ? a.n : fullName(), a.p || phone(), i < customers.length ? (a.a || address()) : address(), i < customers.length ? 1 : 0]);
  }
  await bulk('INSERT INTO dia_chi_giao_hang (ma_tai_khoan,ho_ten,so_dien_thoai,dia_chi,mac_dinh) VALUES ?', rows);
  console.log('dia_chi_giao_hang +', rows.length);
}

// ================= 10. voucher =================
{
  const need = TARGET - (await count('voucher'));
  const rows = [];
  for (let i = 0; i < Math.max(0, need); i++) {
    const g = pick([20000, 30000, 50000, 80000, 100000, 150000, 200000, 300000]);
    const start = daysAgo(ri(0, 40), 0), end = new Date(start.getTime() + ri(30, 120) * 86400000);
    const luot = ri(20, 300);
    rows.push([`SALE${g / 1000}K${pad(i + 1)}`, g, g * ri(8, 20), luot, ri(0, Math.floor(luot / 3)), start, end, i % 10 === 9 ? 0 : 1]);
  }
  await bulk('INSERT IGNORE INTO voucher (ma_code,giam_tien,don_toi_thieu,so_luot,da_dung,bat_dau,ket_thuc,trang_thai) VALUES ?', rows);
  console.log('voucher +', rows.length);
}

// ================= 11. don_hang + chi_tiet_don_hang =================
{
  const need = TARGET - (await count('don_hang'));
  const STATUS = ['ChoXacNhan', 'DaXacNhan', 'DangGiao', 'DaGiao', 'DaGiao', 'DaGiao', 'DaHuy'];
  const PAY = ['TienMat', 'ChuyenKhoan', 'ThanhToanKhiNhanHang'];
  for (let i = 0; i < Math.max(0, need); i++) {
    const cu = pick(customers);
    const n = ri(1, 3), items = [];
    const used = new Set();
    while (items.length < n) { const p = pick(plain); if (used.has(p.id)) continue; used.add(p.id); items.push({ ...p, qty: ri(1, 2) }); }
    const sub = items.reduce((s, x) => s + Number(x.p) * x.qty, 0);
    const phi = sub >= 2000000 ? 0 : 30000;
    const when = daysAgo(ri(1, 120));
    const [res] = await c.query('INSERT INTO don_hang (ma_tai_khoan,ho_ten_nguoi_nhan,so_dien_thoai,dia_chi_giao_hang,tong_tien,phuong_thuc_thanh_toan,trang_thai,ghi_chu,ngay_dat,giam_gia,phi_giao_hang) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [cu.id, cu.n, cu.p || phone(), cu.a || address(), sub + phi, pick(PAY), pick(STATUS), pick([null, null, 'Giao giờ hành chính', 'Gọi trước khi giao', 'Để hàng ở bảo vệ']), when, 0, phi]);
    await bulk('INSERT INTO chi_tiet_don_hang (ma_don_hang,ma_san_pham,ten_san_pham,so_luong,don_gia) VALUES ?', items.map((x) => [res.insertId, x.id, x.n, x.qty, x.p]));
  }
  console.log('don_hang now', await count('don_hang'), '| chi_tiet_don_hang now', await count('chi_tiet_don_hang'));
}

// ================= 12. danh_gia =================
{
  const need = TARGET - (await count('danh_gia'));
  const GOOD = ['Sản phẩm dùng rất tốt, đúng mô tả', 'Giao hàng nhanh, đóng gói cẩn thận', 'Chạy êm, tiết kiệm điện, rất hài lòng', 'Chất lượng vượt mong đợi so với giá tiền', 'Thiết kế đẹp, dễ sử dụng', 'Nhân viên tư vấn nhiệt tình, sẽ ủng hộ tiếp'];
  const MID_ = ['Dùng ổn, tạm được trong tầm giá', 'Sản phẩm ok nhưng giao hơi chậm', 'Hoạt động bình thường, hơi ồn một chút'];
  const rows = [];
  for (let i = 0; i < Math.max(0, need); i++) {
    const s = rnd() < 0.8 ? ri(4, 5) : ri(3, 3);
    rows.push([pick(allProd).id, pick(customers).id, s, s >= 4 ? pick(GOOD) : pick(MID_), daysAgo(ri(1, 90))]);
  }
  await bulk('INSERT INTO danh_gia (ma_san_pham,ma_tai_khoan,so_sao,noi_dung,ngay_danh_gia) VALUES ?', rows);
  console.log('danh_gia +', rows.length);
}

// ================= 13. lien_he =================
{
  const need = TARGET - (await count('lien_he'));
  const SUB = ['Hỏi về bảo hành', 'Tư vấn chọn mua', 'Phản ánh giao hàng', 'Yêu cầu hóa đơn VAT', 'Đổi trả sản phẩm', 'Hỏi tình trạng đơn hàng', 'Hỏi chương trình khuyến mãi', 'Lắp đặt và vận chuyển'];
  const rows = [];
  for (let i = 0; i < Math.max(0, need); i++) {
    const cu = pick(customers), replied = i % 2 === 0, t = daysAgo(ri(1, 60));
    const sub = pick(SUB);
    rows.push([cu.id, cu.n, `${strip(cu.n).toLowerCase().replace(/\s+/g, '')}${i}@gmail.com`, cu.p || phone(), sub, `Xin chào shop, tôi muốn ${sub.toLowerCase()}. Mong shop phản hồi sớm giúp tôi.`,
      replied ? 'Cảm ơn quý khách đã liên hệ. Bộ phận CSKH đã tiếp nhận và hỗ trợ xử lý yêu cầu của quý khách.' : null,
      replied ? new Date(t.getTime() + 86400000) : null, replied ? 'DaPhanHoi' : 'ChoPhanHoi', t]);
  }
  await bulk('INSERT INTO lien_he (ma_tai_khoan,ho_ten,email,so_dien_thoai,tieu_de,noi_dung,phan_hoi,ngay_phan_hoi,trang_thai,ngay_gui) VALUES ?', rows);
  console.log('lien_he +', rows.length);
}

// ================= 14. nhap_kho =================
{
  const need = TARGET - (await count('nhap_kho'));
  const rows = [];
  for (let i = 0; i < Math.max(0, need); i++) {
    rows.push([pick(plain).id, null, pick(staff).id, ri(5, 50), pick(['Nhập hàng định kỳ', 'Bổ sung tồn kho', 'Nhập lô hàng mới từ nhà cung cấp', 'Nhập hàng khuyến mãi']), daysAgo(ri(1, 150))]);
  }
  await bulk('INSERT INTO nhap_kho (ma_san_pham,ma_bien_the,ma_tai_khoan,so_luong,ghi_chu,ngay_nhap) VALUES ?', rows);
  console.log('nhap_kho +', rows.length);
}

// ================= 15. thong_bao (bo sung neu chua du; trigger don_hang da tu them) =================
{
  const need = TARGET - (await count('thong_bao'));
  const T = [['Khuyến mãi', 'Giảm đến 20% cho các sản phẩm gia dụng trong tuần này.'], ['Voucher mới', 'Bạn vừa nhận được voucher giảm giá cho đơn tiếp theo.'], ['Hệ thống', 'Cảm ơn bạn đã sử dụng ứng dụng ElectricShop.'], ['Sản phẩm mới', 'Nhiều sản phẩm mới vừa được cập nhật, xem ngay!']];
  const rows = [];
  for (let i = 0; i < Math.max(0, need); i++) { const t = pick(T); rows.push([pick(customers).id, t[0], t[1], rnd() < 0.5 ? 1 : 0, daysAgo(ri(1, 30))]); }
  await bulk('INSERT INTO thong_bao (ma_tai_khoan,tieu_de,noi_dung,da_doc,ngay_tao) VALUES ?', rows);
  console.log('thong_bao +', rows.length);
}

// ---------- summary ----------
console.log('\n=== SO LUONG SAU KHI SEED ===');
for (const t of ['tai_khoan', 'nhan_vien', 'danh_muc', 'thuong_hieu', 'san_pham', 'san_pham_bien_the', 'hinh_anh_san_pham', 'nhom_thong_so', 'thong_so', 'danh_muc_thong_so', 'thong_so_san_pham', 'gio_hang', 'chi_tiet_gio_hang', 'dia_chi_giao_hang', 'voucher', 'don_hang', 'chi_tiet_don_hang', 'danh_gia', 'lien_he', 'nhap_kho', 'thong_bao']) {
  console.log(t.padEnd(22), await count(t));
}
await c.end();
