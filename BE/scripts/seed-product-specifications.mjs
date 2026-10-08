// Fill synthetic demo specifications without changing prices, stock or variant IDs.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pool } from '../dist/config/database.js';

const features = {
  'Tủ lạnh': 'Làm lạnh, bảo quản thực phẩm', 'Tủ đông': 'Cấp đông thực phẩm', 'Tủ mát': 'Bảo quản thực phẩm',
  'Máy giặt': 'Giặt, xả, vắt', 'Máy sấy quần áo': 'Sấy quần áo', 'Máy rửa bát': 'Rửa, sấy bát đĩa',
  'Điều hòa': 'Làm lạnh, hút ẩm', 'Lò vi sóng': 'Hâm nóng, rã đông', 'Lò vi sóng có nướng': 'Hâm nóng, rã đông, nướng',
  'Bếp gas': 'Nấu bằng gas', 'Máy nước nóng năng lượng mặt trời': 'Làm nóng nước bằng năng lượng mặt trời',
  'Máy hút chân không': 'Hút chân không, hàn miệng túi', 'Máy cạo râu': 'Cạo râu', 'Máy sấy tóc': 'Sấy tóc',
};
let connection;
try {
  connection = await pool.getConnection();
  await connection.beginTransaction();
  const [products] = await connection.query('SELECT p.*,d.ten_danh_muc FROM san_pham p JOIN danh_muc d USING(ma_danh_muc) ORDER BY p.ma_san_pham FOR UPDATE');
  const [definitions] = await connection.query('SELECT t.*,n.ten_nhom_thong_so FROM thong_so t JOIN nhom_thong_so n USING(ma_nhom_thong_so)');
  const [specs] = await connection.query('SELECT * FROM thong_so_san_pham');
  const [variants] = await connection.query('SELECT * FROM san_pham_bien_the FOR UPDATE');
  const [links] = await connection.query('SELECT * FROM danh_muc_thong_so');
  const backupDir = new URL('../logs/', import.meta.url);
  await mkdir(backupDir, { recursive: true });
  await writeFile(new URL(`catalog-specifications-before-${Date.now()}.json`, backupDir), JSON.stringify({ products, definitions, specs, variants, links }, null, 2), 'utf8');
  const byName = new Map(definitions.map(item => [item.ten_thong_so, item]));
  const byId = new Map(definitions.map(item => [item.ma_thong_so, item]));
  let addedSpecifications = 0, updatedVariants = 0;
  const targetCount = 10;
  for (const product of products) {
    const category = product.ten_danh_muc;
    const nonElectric = ['Bếp gas', 'Máy nước nóng năng lượng mặt trời'].includes(category);
    const battery = ['Máy cạo râu', 'Robot hút bụi'].includes(category);
    const current = specs.filter(item => item.ma_san_pham === product.ma_san_pham);
    const occupied = new Set(current.map(item => item.ma_thong_so));
    const options = [
      ['Thời gian bảo hành', Number(product.bao_hanh) || 12],
      ['Loại sản phẩm', category],
      ['Chất liệu vỏ', nonElectric ? 'Inox và kính chịu nhiệt' : 'Nhựa ABS và kim loại'],
      ['Chức năng', features[category] || category],
      ['Tính năng an toàn', category === 'Bếp gas' ? 'Ngắt gas an toàn' : category === 'Máy nước nóng năng lượng mặt trời' ? 'Van xả áp' : battery ? 'Bảo vệ pin, chống quá tải' : 'Bảo vệ quá nhiệt'],
      ...(nonElectric ? [['Phụ kiện đi kèm', 'Bộ phụ kiện lắp đặt, hướng dẫn sử dụng'], ['Kiểu máy / kiểu cửa', 'Lắp đặt cố định']] : battery ? [['Phụ kiện đi kèm', 'Bộ sạc, hướng dẫn sử dụng'], ['Kiểu máy / kiểu cửa', 'Dùng pin sạc']] : [['Điện áp', 220], ['Tần số', 50], ['Phụ kiện đi kèm', 'Hướng dẫn sử dụng, phiếu bảo hành']]),
      ['Màu sắc', 'Đen'], ['Xuất xứ', 'Việt Nam'],
    ];
    for (const [name, value] of options) {
      if (occupied.size >= targetCount) break;
      const definition = byName.get(name);
      assert.ok(definition, `Missing definition: ${name}`);
      await connection.execute('INSERT INTO danh_muc_thong_so (ma_danh_muc,ma_thong_so,bat_buoc,thu_tu_hien_thi) VALUES (?,?,FALSE,?) ON DUPLICATE KEY UPDATE ma_thong_so=VALUES(ma_thong_so)', [product.ma_danh_muc, definition.ma_thong_so, definition.thu_tu_hien_thi]);
      if (occupied.has(definition.ma_thong_so)) continue;
      const item = { ma_san_pham: product.ma_san_pham, ma_thong_so: definition.ma_thong_so, gia_tri: String(value), gia_tri_so: definition.kieu_du_lieu === 'NUMBER' ? Number(value) : null, gia_tri_bool: null };
      await connection.execute('INSERT INTO thong_so_san_pham (ma_san_pham,ma_thong_so,gia_tri,gia_tri_so,gia_tri_bool) VALUES (?,?,?,?,?)', [item.ma_san_pham,item.ma_thong_so,item.gia_tri,item.gia_tri_so,item.gia_tri_bool]);
      current.push(item); occupied.add(item.ma_thong_so); addedSpecifications++;
    }
    assert.ok(current.length >= 7 && current.length <= 10, `Specification count outside range: ${product.ma_san_pham}`);
    for (const variant of variants.filter(item => item.ma_san_pham === product.ma_san_pham)) {
      const previous = typeof variant.thong_so_json === 'string' ? JSON.parse(variant.thong_so_json) : variant.thong_so_json || [];
      for (const item of previous) {
        const definition = byId.get(item.ma_thong_so);
        assert.ok(definition, `Unknown variant specification: ${item.ma_thong_so}`);
        await connection.execute('INSERT INTO danh_muc_thong_so (ma_danh_muc,ma_thong_so,bat_buoc,thu_tu_hien_thi) VALUES (?,?,FALSE,?) ON DUPLICATE KEY UPDATE ma_thong_so=VALUES(ma_thong_so)', [product.ma_danh_muc,item.ma_thong_so,definition.thu_tu_hien_thi]);
      }
      const merged = [...previous];
      const existing = new Set(previous.map(item => item.ma_thong_so));
      for (const item of current) {
        if (existing.has(item.ma_thong_so)) continue;
        const definition = byId.get(item.ma_thong_so);
        merged.push({ ma_thong_so: item.ma_thong_so, ten_thong_so: definition.ten_thong_so, ten_nhom: definition.ten_nhom_thong_so, kieu_du_lieu: definition.kieu_du_lieu, don_vi: definition.don_vi, gia_tri: item.gia_tri, gia_tri_so: item.gia_tri_so == null ? null : Number(item.gia_tri_so), gia_tri_bool: item.gia_tri_bool == null ? null : Boolean(item.gia_tri_bool) });
      }
      if (merged.length > previous.length) {
        await connection.execute('UPDATE san_pham_bien_the SET thong_so_json=? WHERE ma_bien_the=?', [JSON.stringify(merged),variant.ma_bien_the]);
        updatedVariants++;
      }
    }
  }
  const [counts] = await connection.query('SELECT p.ma_san_pham,COUNT(s.ma_thong_so) AS total FROM san_pham p LEFT JOIN thong_so_san_pham s USING(ma_san_pham) GROUP BY p.ma_san_pham');
  for (const row of counts) assert.ok(row.total >= 7 && row.total <= 10);
  const [invalid] = await connection.query(`SELECT s.ma_san_pham FROM thong_so_san_pham s JOIN san_pham p USING(ma_san_pham)
    JOIN thong_so t USING(ma_thong_so) LEFT JOIN danh_muc_thong_so d ON d.ma_danh_muc=p.ma_danh_muc AND d.ma_thong_so=s.ma_thong_so
    WHERE d.ma_thong_so IS NULL OR (t.kieu_du_lieu='NUMBER' AND s.gia_tri_so IS NULL) OR (t.kieu_du_lieu IN ('TEXT','OPTION') AND COALESCE(TRIM(s.gia_tri),'')='')`);
  assert.equal(invalid.length, 0, 'Invalid specification values/category links');
  await connection.commit();
  console.log(JSON.stringify({ products: products.length, addedSpecifications, updatedVariants, min: Math.min(...counts.map(item => item.total)), max: Math.max(...counts.map(item => item.total)), verified: true }));
} catch (error) { await connection?.rollback(); throw error; }
finally { connection?.release(); await pool.end(); }
