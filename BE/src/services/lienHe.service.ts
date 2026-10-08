import { callProcedure, firstResult } from './procedure.service.js';
import { pool } from '../config/database.js';

export const lienHeProcedures = {
  create: 'sp_lien_he_create',
  list: 'sp_lien_he_list',
  getById: 'sp_lien_he_get_by_id',
  updateStatus: 'sp_lien_he_update_status',
  remove: 'sp_lien_he_delete',
} as const;

export const lienHeService = {
  create: async (params: unknown[]) => {
    const [result] = await pool.execute(
      'INSERT INTO lien_he (ma_tai_khoan, ho_ten, email, so_dien_thoai, tieu_de, noi_dung, trang_thai) VALUES (?, ?, ?, ?, ?, ?, \'ChoPhanHoi\')',
      params as any[],
    );
    return result;
  },
  listMine: (accountId: number) => pool.query('SELECT * FROM lien_he WHERE ma_tai_khoan = ? ORDER BY ma_lien_he DESC', [accountId]).then(([rows]) => rows),
  list: () => callProcedure(lienHeProcedures.list).then(firstResult),
  getById: (id: number) => callProcedure(lienHeProcedures.getById, [id]).then(firstResult),
  updateStatus: (params: unknown[]) => callProcedure(lienHeProcedures.updateStatus, params).then(firstResult),
  reply: async (id: number, phanHoi: string | null) => {
    const [result] = await pool.execute(
      'UPDATE lien_he SET phan_hoi = ?, ngay_phan_hoi = CASE WHEN ? IS NULL THEN NULL ELSE NOW() END, trang_thai = ? WHERE ma_lien_he = ?',
      [phanHoi, phanHoi, phanHoi ? 'DaPhanHoi' : 'ChoPhanHoi', id],
    );
    return result;
  },
  remove: (id: number) => callProcedure(lienHeProcedures.remove, [id]).then(firstResult),
};
