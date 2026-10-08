// Synthetic catalog data for demos; values are not manufacturer specifications.
// Existing variants, prices, specification values and historical references are retained.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pool } from '../dist/config/database.js';

const power = (watts, feature, safety = 'Ngắt điện tự động') => ({ axis: 'Công suất', values: [0.8, 0.9, 1, 1.1, 1.2].map(factor => watts < 100 ? Math.round(watts * factor) : Math.round(watts * factor / 5) * 5), feature, safety });
const capacity = (values, feature) => ({ axis: 'Dung tích', values, feature, safety: 'Bảo vệ quá nhiệt' });
const profiles = {
  'Tủ lạnh': capacity([180, 236, 300, 350, 450], 'Làm lạnh, bảo quản thực phẩm'),
  'Tủ đông': capacity([150, 200, 300, 400, 500], 'Cấp đông thực phẩm'),
  'Tủ mát': capacity([200, 300, 350, 450, 550], 'Bảo quản và trưng bày thực phẩm'),
  'Máy giặt': { axis: 'Khối lượng giặt', values: [7, 8, 9, 10, 12], feature: 'Giặt, xả, vắt', safety: 'Khóa trẻ em' },
  'Máy sấy quần áo': { axis: 'Khối lượng sấy', values: [7, 8, 9, 10, 12], feature: 'Sấy quần áo', safety: 'Bảo vệ quá nhiệt' },
  'Điều hòa': { axis: 'Công suất làm lạnh', values: [9000, 12000, 18000, 24000, 28000], feature: 'Làm lạnh, hút ẩm', safety: 'Bảo vệ máy nén' },
  'Bếp gas': { axis: 'Số vùng nấu', values: [1, 2, 3, 4, 5], feature: 'Nấu bằng gas', safety: 'Ngắt gas an toàn', material: 'Inox và kính chịu nhiệt' },
  'Máy nước nóng năng lượng mặt trời': { ...capacity([100, 150, 180, 200, 240], 'Làm nóng nước bằng năng lượng mặt trời'), material: 'Inox', safety: 'Van xả áp' },
  'Tivi': { axis: 'Kích cỡ màn hình', values: [32, 43, 50, 55, 65], feature: 'Xem truyền hình, giải trí', safety: 'Bảo vệ nguồn điện' },
  'Lò vi sóng': power(1000, 'Hâm nóng, rã đông'),
  'Lò vi sóng có nướng': power(1200, 'Hâm nóng, rã đông, nướng'),
  'Bếp điện': power(2000, 'Nấu, hâm nóng'),
  'Bếp hồng ngoại': power(2000, 'Nấu với nhiều loại nồi'),
  'Nồi cơm điện': power(700, 'Nấu cơm, giữ ấm'),
  'Máy hút bụi': power(1600, 'Hút bụi khô'),
  'Ấm siêu tốc': power(1800, 'Đun nước'),
  'Máy lọc nước': power(50, 'Lọc nước'),
  'Quạt điện': power(60, 'Làm mát, đảo gió'),
  'Máy rửa bát': power(1800, 'Rửa, sấy bát đĩa'),
  'Máy hút mùi': power(200, 'Hút mùi, lọc khói'),
  'Lò nướng': power(1600, 'Nướng thực phẩm'),
  'Nồi chiên không dầu': power(1500, 'Chiên, nướng bằng khí nóng'),
  'Nồi áp suất điện': power(1000, 'Nấu áp suất, hầm'),
  'Máy xay sinh tố': power(500, 'Xay sinh tố'),
  'Máy ép trái cây': power(400, 'Ép trái cây'),
  'Máy pha cà phê': power(1200, 'Pha cà phê'),
  'Bình thủy điện': power(800, 'Đun nước, giữ nhiệt'),
  'Máy làm sữa hạt': power(1000, 'Xay, nấu sữa hạt'),
  'Máy đánh trứng': power(300, 'Đánh trứng, trộn'),
  'Bàn ủi': power(1000, 'Ủi khô'),
  'Bàn ủi hơi nước': power(2000, 'Ủi hơi nước'),
  'Robot hút bụi': power(50, 'Hút bụi, lau sàn'),
  'Máy lọc không khí': power(50, 'Lọc không khí'),
  'Máy tạo ẩm': power(25, 'Tạo ẩm'),
  'Máy hút ẩm': power(300, 'Hút ẩm'),
  'Quạt điều hòa': power(150, 'Làm mát bằng hơi nước'),
  'Quạt treo tường': power(50, 'Làm mát, đảo gió'),
  'Quạt trần': power(75, 'Làm mát'),
  'Quạt sưởi': power(1200, 'Sưởi ấm'),
  'Máy sưởi dầu': power(2000, 'Sưởi ấm'),
  'Bình nước nóng': power(2500, 'Làm nóng nước', 'Chống giật, bảo vệ quá nhiệt'),
  'Máy sấy tóc': power(1600, 'Sấy tóc'),
  'Máy cạo râu': power(10, 'Cạo râu'),
  'Nồi lẩu điện': power(1500, 'Nấu lẩu, giữ ấm'),
  'Nồi nấu chậm': power(200, 'Hầm, nấu chậm'),
  'Máy nướng bánh mì': power(800, 'Nướng bánh mì'),
  'Máy làm bánh mì': power(600, 'Nhào bột, nướng bánh'),
  'Máy xay thịt': power(500, 'Xay thịt'),
  'Máy hút chân không': power(100, 'Hút chân không, hàn miệng túi'),
};

let connection;
try {
  connection = await pool.getConnection();
  await connection.beginTransaction();
  const [products] = await connection.query('SELECT p.*,d.ten_danh_muc FROM san_pham p JOIN danh_muc d USING(ma_danh_muc) ORDER BY p.ma_san_pham FOR UPDATE');
  const [definitions] = await connection.query('SELECT t.*,n.ten_nhom_thong_so FROM thong_so t JOIN nhom_thong_so n USING(ma_nhom_thong_so)');
  const [existingSpecs] = await connection.query('SELECT * FROM thong_so_san_pham');
  const [existingVariants] = await connection.query('SELECT * FROM san_pham_bien_the');
  const [categorySpecs] = await connection.query('SELECT * FROM danh_muc_thong_so');
  assert.ok(products.length, 'No products found');
  for (const product of products) assert.ok(profiles[product.ten_danh_muc], `Missing demo profile: ${product.ten_danh_muc}`);
  const backupDir = new URL('../logs/', import.meta.url);
  await mkdir(backupDir, { recursive: true });
  const backupFile = new URL(`catalog-options-before-${Date.now()}.json`, backupDir);
  await writeFile(backupFile, JSON.stringify({ products, definitions, existingSpecs, existingVariants, categorySpecs }, null, 2), 'utf8');
  if (!process.argv.includes('--apply')) {
    console.log(JSON.stringify({ products: products.length, plannedNewVariants: products.length * 5, note: 'Use --apply to save synthetic demo options.' }));
    await connection.rollback();
  } else {
    let dryerWeight = definitions.find(definition => definition.ten_thong_so === 'Khối lượng sấy');
    if (!dryerWeight) {
      const group = definitions.find(definition => definition.ten_thong_so === 'Khối lượng giặt');
      const [result] = await connection.execute("INSERT INTO thong_so (ma_nhom_thong_so,ten_thong_so,kieu_du_lieu,don_vi,cho_phep_loc,thu_tu_hien_thi,trang_thai) VALUES (?,'Khối lượng sấy','NUMBER','kg',TRUE,30,TRUE)", [group.ma_nhom_thong_so]);
      dryerWeight = { ...group, ma_thong_so: result.insertId, ten_thong_so: 'Khối lượng sấy', don_vi: 'kg' };
      definitions.push(dryerWeight);
    }
    const byName = new Map(definitions.map(definition => [definition.ten_thong_so, definition]));
    let addedVariants = 0, addedSpecs = 0;
    const detailSpec = (definition, value) => ({
      ma_thong_so: definition.ma_thong_so, ten_thong_so: definition.ten_thong_so,
      ten_nhom: definition.ten_nhom_thong_so, kieu_du_lieu: definition.kieu_du_lieu, don_vi: definition.don_vi,
      gia_tri: definition.kieu_du_lieu === 'BOOLEAN' ? null : String(value),
      gia_tri_so: definition.kieu_du_lieu === 'NUMBER' ? Number(value) : null,
      gia_tri_bool: definition.kieu_du_lieu === 'BOOLEAN' ? Boolean(value) : null,
    });
    for (const product of products) {
      const id = product.ma_san_pham, profile = profiles[product.ten_danh_muc];
      const current = existingSpecs.filter(spec => spec.ma_san_pham === id);
      const color = current.find(spec => spec.ma_thong_so === byName.get('Màu sắc').ma_thong_so)?.gia_tri || 'Đen';
      const values = new Map([
        ['Màu sắc', color], ['Xuất xứ', 'Việt Nam'], [profile.axis, profile.values[2]],
        ['Chất liệu vỏ', profile.material || 'Nhựa ABS và kim loại'], ['Chức năng', profile.feature],
        ['Tính năng an toàn', profile.safety], ['Thời gian bảo hành', Number(product.bao_hanh) || 12],
        ['Điện áp', 220], ['Tần số', 50], ['Công suất', profiles[product.ten_danh_muc].axis === 'Công suất' ? profile.values[2] : 150],
        ['Kích thước', 'Theo phiên bản'], ['Số cánh quạt', 3], ['Số lõi lọc', 10],
        ['Công nghệ tiết kiệm điện', 'Inverter'], ['Công nghệ làm lạnh', 'Làm lạnh tuần hoàn'],
        ['Tốc độ vắt', 1200], ['Công nghệ lọc nước', 'RO'], ['Loại nồi / bề mặt', 'Chống dính'],
        ['Số cửa', 2], ['Loại sản phẩm', product.ten_danh_muc],
        ['Dung tích', Number(product.ten_san_pham.match(/([\d.]+)\s*lít/i)?.[1]) || 2],
        ['Khối lượng giặt', Number(product.ten_san_pham.match(/([\d.]+)\s*kg/i)?.[1]) || 9],
        ['Số vùng nấu', 2], ['Kiểu máy / kiểu cửa', product.ten_danh_muc === 'Máy giặt' ? 'Cửa trước' : 'Độc lập'],
        ['Hiển thị', 'LED'], ['Bộ lọc', 'HEPA'], ['Loại gas', product.ten_danh_muc === 'Bếp gas' ? 'LPG' : 'R32'],
      ]);
      values.set(profile.axis, profile.values[2]);
      // Preserve all populated values, fill required category fields and reach at least six.
      const requested = ['Màu sắc', profile.axis, 'Chất liệu vỏ', 'Chức năng', 'Tính năng an toàn', 'Thời gian bảo hành'];
      const required = categorySpecs.filter(link => link.ma_danh_muc === product.ma_danh_muc && link.bat_buoc).map(link => definitions.find(definition => definition.ma_thong_so === link.ma_thong_so)?.ten_thong_so).filter(Boolean);
      const occupied = new Set(current.map(spec => spec.ma_thong_so));
      const existingNames = current.map(spec => definitions.find(definition => definition.ma_thong_so === spec.ma_thong_so)?.ten_thong_so).filter(Boolean);
      for (const name of [...new Set([...required, ...requested, ...existingNames])]) {
        const definition = byName.get(name);
        assert.ok(definition, `Missing specification: ${name}`);
        await connection.execute('INSERT INTO danh_muc_thong_so (ma_danh_muc,ma_thong_so,bat_buoc,thu_tu_hien_thi) VALUES (?,?,FALSE,?) ON DUPLICATE KEY UPDATE ma_thong_so=VALUES(ma_thong_so)', [product.ma_danh_muc, definition.ma_thong_so, definition.thu_tu_hien_thi || 0]);
        if (occupied.has(definition.ma_thong_so)) continue;
        if (occupied.size >= 6 && !required.includes(name)) continue;
        const value = values.get(name);
        assert.notEqual(value, undefined, `No demo value for required field: ${name}`);
        const spec = detailSpec(definition, value);
        await connection.execute('INSERT INTO thong_so_san_pham (ma_san_pham,ma_thong_so,gia_tri,gia_tri_so,gia_tri_bool) VALUES (?,?,?,?,?)', [id, spec.ma_thong_so, spec.gia_tri, spec.gia_tri_so, spec.gia_tri_bool]);
        current.push({ ma_san_pham: id, ...spec }); occupied.add(spec.ma_thong_so); addedSpecs++;
      }
      const axis = byName.get(profile.axis), colorDefinition = byName.get('Màu sắc');
      await connection.execute('INSERT INTO danh_muc_thong_so (ma_danh_muc,ma_thong_so,bat_buoc,thu_tu_hien_thi) VALUES (?,?,FALSE,?) ON DUPLICATE KEY UPDATE ma_thong_so=VALUES(ma_thong_so)', [product.ma_danh_muc, axis.ma_thong_so, axis.thu_tu_hien_thi || 0]);
      const fullSpecs = current.map(spec => ({ ...definitions.find(definition => definition.ma_thong_so === spec.ma_thong_so), ...spec })).map(spec => ({ ma_thong_so: spec.ma_thong_so, ten_thong_so: spec.ten_thong_so, ten_nhom: spec.ten_nhom_thong_so || spec.ten_nhom, kieu_du_lieu: spec.kieu_du_lieu, don_vi: spec.don_vi, gia_tri: spec.gia_tri, gia_tri_so: spec.gia_tri_so == null ? null : Number(spec.gia_tri_so), gia_tri_bool: spec.gia_tri_bool == null ? null : Boolean(spec.gia_tri_bool) }));
      for (let index = 0; index < 5; index++) {
        const sku = `DEMO-EXTRA-${id}-${index + 1}`;
        if (existingVariants.some(variant => variant.ma_sku === sku)) continue;
        const value = profile.values[index];
        assert.ok(Number.isFinite(value) && value > 0);
        const variantSpecs = fullSpecs.filter(spec => ![axis.ma_thong_so, colorDefinition.ma_thong_so].includes(spec.ma_thong_so));
        variantSpecs.unshift(detailSpec(colorDefinition, color), detailSpec(axis, value));
        const price = Math.max(1000, Math.round(Number(product.gia_ban) * [0.9, 0.95, 1, 1.08, 1.15][index] / 1000) * 1000);
        const name = `${color} · ${value} ${axis.don_vi || ''}`.trim();
        await connection.execute('INSERT INTO san_pham_bien_the (ma_san_pham,ma_sku,ten_bien_the,gia_ban,so_luong,trang_thai,thong_so_json) VALUES (?,?,?,?,?,?,?)', [id, sku, name, price, 5, product.trang_thai === 'NgungBan' ? 'NgungBan' : 'DangBan', JSON.stringify(variantSpecs)]);
        addedVariants++;
      }
      // Aggregate stock for display; checkout still locks each selected variant separately.
      await connection.execute("UPDATE san_pham SET so_luong=(SELECT COALESCE(SUM(so_luong),0) FROM san_pham_bien_the WHERE ma_san_pham=? AND trang_thai<>'NgungBan') WHERE ma_san_pham=?", [id, id]);
    }
    const [counts] = await connection.query(`SELECT p.ma_san_pham,p.so_luong,
      (SELECT COUNT(*) FROM thong_so_san_pham s WHERE s.ma_san_pham=p.ma_san_pham) AS specs,
      (SELECT COUNT(*) FROM san_pham_bien_the b WHERE b.ma_san_pham=p.ma_san_pham AND b.ma_sku LIKE CONCAT('DEMO-EXTRA-',p.ma_san_pham,'-%')) AS added_options,
      (SELECT COALESCE(SUM(b.so_luong),0) FROM san_pham_bien_the b WHERE b.ma_san_pham=p.ma_san_pham AND b.trang_thai<>'NgungBan') AS stock FROM san_pham p`);
    for (const row of counts) { assert.ok(row.specs >= 6); assert.equal(row.added_options, 5); assert.equal(Number(row.so_luong), Number(row.stock)); }
    const [invalid] = await connection.query(`SELECT s.ma_san_pham,s.ma_thong_so FROM thong_so_san_pham s
      LEFT JOIN danh_muc_thong_so d ON d.ma_thong_so=s.ma_thong_so AND d.ma_danh_muc=(SELECT p.ma_danh_muc FROM san_pham p WHERE p.ma_san_pham=s.ma_san_pham)
      WHERE d.ma_thong_so IS NULL`);
    assert.equal(invalid.length, 0, 'Product specifications must match their category');
    await connection.commit();
    console.log(JSON.stringify({ products: products.length, addedVariants, addedSpecs, minSpecifications: Math.min(...counts.map(row => row.specs)), maxSpecifications: Math.max(...counts.map(row => row.specs)), backup: backupFile.pathname, verified: true }));
  }
} catch (error) { await connection?.rollback(); throw error; }
finally { connection?.release(); await pool.end(); }
