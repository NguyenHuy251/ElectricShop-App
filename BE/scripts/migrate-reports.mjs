import { pool } from '../dist/config/database.js';

export async function migrateReports() {
  const connection = await pool.getConnection();
  try {
    // 1. Add ma_nhan_vien to don_hang if not exists
    const [dhColumns] = await connection.query('SHOW COLUMNS FROM don_hang');
    const dhFields = new Set(dhColumns.map(row => row.Field));
    if (!dhFields.has('ma_nhan_vien')) {
      await connection.query('ALTER TABLE don_hang ADD COLUMN ma_nhan_vien INT NULL');
      try {
        await connection.query('ALTER TABLE don_hang ADD CONSTRAINT fk_don_hang_nhan_vien FOREIGN KEY (ma_nhan_vien) REFERENCES nhan_vien(ma_nhan_vien) ON DELETE SET NULL');
      } catch {
        // foreign key might already exist or name conflicts
      }
    }

    // Assign sales staff to existing orders that don't have ma_nhan_vien
    const [staffRows] = await connection.query(
      "SELECT ma_nhan_vien FROM nhan_vien WHERE trang_thai = 'DangLam' AND (chuc_vu LIKE '%bán hàng%' OR chuc_vu LIKE '%Thu ngân%' OR chuc_vu LIKE '%Kinh doanh%' OR chuc_vu IS NOT NULL) ORDER BY ma_nhan_vien"
    );
    const staffList = staffRows.map(r => r.ma_nhan_vien);
    if (staffList.length > 0) {
      const [ordersWithoutStaff] = await connection.query('SELECT ma_don_hang FROM don_hang WHERE ma_nhan_vien IS NULL ORDER BY ma_don_hang');
      for (const order of ordersWithoutStaff) {
        const assignedStaff = staffList[order.ma_don_hang % staffList.length];
        await connection.execute('UPDATE don_hang SET ma_nhan_vien = ? WHERE ma_don_hang = ?', [assignedStaff, order.ma_don_hang]);
      }
    }

    // 2. Add gia_nhap and nha_cung_cap to nhap_kho
    const [nkColumns] = await connection.query('SHOW COLUMNS FROM nhap_kho');
    const nkFields = new Set(nkColumns.map(row => row.Field));
    if (!nkFields.has('gia_nhap')) {
      await connection.query('ALTER TABLE nhap_kho ADD COLUMN gia_nhap DECIMAL(15,2) NULL');
    }
    if (!nkFields.has('nha_cung_cap')) {
      await connection.query('ALTER TABLE nhap_kho ADD COLUMN nha_cung_cap VARCHAR(150) NULL');
    }

    // Backfill gia_nhap in nhap_kho from san_pham.gia_nhap or fallback
    await connection.query(`
      UPDATE nhap_kho nk
      JOIN san_pham sp ON sp.ma_san_pham = nk.ma_san_pham
      SET nk.gia_nhap = COALESCE(sp.gia_nhap, sp.gia_ban * 0.75, 500000)
      WHERE nk.gia_nhap IS NULL OR nk.gia_nhap = 0
    `);

    // Backfill nha_cung_cap in nhap_kho from brand name or standard vendor
    await connection.query(`
      UPDATE nhap_kho nk
      JOIN san_pham sp ON sp.ma_san_pham = nk.ma_san_pham
      LEFT JOIN thuong_hieu th ON th.ma_thuong_hieu = sp.ma_thuong_hieu
      SET nk.nha_cung_cap = CASE 
        WHEN th.ten_thuong_hieu IS NOT NULL THEN CONCAT('Công ty TNHH ', th.ten_thuong_hieu, ' Việt Nam')
        ELSE 'Công ty TNHH Thiết bị Điện máy & Gia dụng Quốc Tế'
      END
      WHERE nk.nha_cung_cap IS NULL OR nk.nha_cung_cap = ''
    `);

    // Assign existing product variants to some nhap_kho rows if ma_bien_the is null
    const [variants] = await connection.query('SELECT ma_bien_the, ma_san_pham FROM san_pham_bien_the ORDER BY ma_bien_the');
    const variantMap = new Map();
    for (const v of variants) {
      if (!variantMap.has(v.ma_san_pham)) variantMap.set(v.ma_san_pham, []);
      variantMap.get(v.ma_san_pham).push(v.ma_bien_the);
    }

    const [nkNullVariants] = await connection.query('SELECT ma_nhap, ma_san_pham FROM nhap_kho WHERE ma_bien_the IS NULL ORDER BY ma_nhap');
    for (const row of nkNullVariants) {
      const availableVariants = variantMap.get(row.ma_san_pham);
      if (availableVariants && availableVariants.length > 0) {
        const pickedVariant = availableVariants[row.ma_nhap % availableVariants.length];
        await connection.execute('UPDATE nhap_kho SET ma_bien_the = ? WHERE ma_nhap = ?', [pickedVariant, row.ma_nhap]);
      }
    }

    console.log('010_reports_enhancement migration applied successfully.');
  } finally {
    connection.release();
  }
}

if (process.argv[1]?.endsWith('migrate-reports.mjs')) {
  try {
    await migrateReports();
  } finally {
    await pool.end();
  }
}
