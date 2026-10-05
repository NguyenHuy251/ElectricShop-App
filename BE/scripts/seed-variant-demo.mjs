// Repeatable demo data. Prices and stock are illustrative, not a live offer.
import { pool } from '../dist/config/database.js';
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  await connection.execute("INSERT INTO danh_muc (ten_danh_muc, mo_ta, trang_thai) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE ma_danh_muc = LAST_INSERT_ID(ma_danh_muc)", ['Tivi', 'Tivi và thiết bị giải trí gia đình']);
  const [categories] = await connection.query('SELECT ma_danh_muc FROM danh_muc WHERE ten_danh_muc = ?', ['Tivi']);
  const [brands] = await connection.query('SELECT ma_thuong_hieu FROM thuong_hieu WHERE ten_thuong_hieu = ?', ['Samsung']);
  if (!brands.length) throw new Error('Không tìm thấy thương hiệu Samsung');
  const ids = [];
  const sizes = [{ size: 55, price: 12990000, stock: 12 }, { size: 65, price: 16990000, stock: 8 }, { size: 75, price: 22990000, stock: 5 }];
  const image = 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=1000&auto=format&fit=crop';
  for (const { size, price, stock } of sizes) {
    const code = `DEMO-TV-SAMSUNG-${size}`;
    const [existing] = await connection.query('SELECT ma_san_pham FROM san_pham WHERE ma_san_pham_code = ?', [code]);
    if (existing.length) { ids.push(existing[0].ma_san_pham); continue; }
    const [result] = await connection.execute(`INSERT INTO san_pham
      (ma_danh_muc, ma_thuong_hieu, ma_san_pham_code, ten_san_pham, mo_ta, gia_nhap, gia_ban, so_luong, bao_hanh, hinh_anh, trang_thai)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?, 24, ?, 'DangBan')`,
      [categories[0].ma_danh_muc, brands[0].ma_thuong_hieu, code, `Smart Tivi Samsung 4K ${size} inch (mẫu)`, `Dữ liệu mẫu để xem chức năng biến thể. Kích thước ${size} inch, độ phân giải 4K. Giá và tồn kho chỉ dùng minh họa.`, price, stock, image]);
    ids.push(result.insertId);
  }
  const [existingGroups] = await connection.query('SELECT nhom_bien_the FROM bien_the_san_pham WHERE ma_san_pham = ?', [ids[0]]);
  const group = existingGroups[0]?.nhom_bien_the || 'demo-samsung-tv-sizes';
  for (const [i, id] of ids.entries()) {
    await connection.execute(`INSERT INTO bien_the_san_pham (ma_san_pham, nhom_bien_the, ten_thuoc_tinh, gia_tri, thu_tu)
      VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE ma_san_pham = ma_san_pham`, [id, group, 'Kích thước màn hình', `${sizes[i].size} inch`, i]);
  }
  await connection.commit();
  console.log(JSON.stringify(ids.map((id, i) => ({ id, size: `${sizes[i].size} inch`, price: sizes[i].price, stock: sizes[i].stock }))));
} catch (error) { await connection.rollback(); throw error; }
finally { connection.release(); await pool.end(); }
