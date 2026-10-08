import { Router } from 'express';
import type { PoolConnection } from 'mysql2/promise';
import { pool } from '../config/database.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { normalizePermissions, permissionGroups, permissionPresets } from '../services/permission.service.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = Router();
router.use(authenticate, authorize('Admin'));
router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(`SELECT t.ma_tai_khoan,t.ten_dang_nhap,t.ho_ten,t.email,t.trang_thai,
      p.permissions, n.ma_nhan_vien,n.chuc_vu FROM tai_khoan t
      LEFT JOIN staff_permissions p USING(ma_tai_khoan)
      LEFT JOIN nhan_vien n USING(ma_tai_khoan) WHERE t.vai_tro='NhanVien' ORDER BY t.ho_ten,t.ma_tai_khoan`);
    return sendSuccess(res, 'Phân quyền nhân viên', { groups: permissionGroups, presets: permissionPresets,
      accounts: (rows as { permissions: unknown }[]).map(row => ({ ...row, permissions: normalizePermissions(row.permissions) })) });
  } catch { return sendError(res, 503, 'Không thể tải phân quyền nhân viên.'); }
});
router.put('/:id', async (req, res) => {
  const accountId = Number(req.params.id), permissions = req.body.permissions;
  if (!Number.isSafeInteger(accountId) || accountId < 1 || !Array.isArray(permissions) ||
      permissions.length > permissionGroups.length || permissions.some(code => !permissionGroups.some(group => group.code === code)) ||
      new Set(permissions).size !== permissions.length) return sendError(res, 400, 'Danh sách quyền không hợp lệ.');
  let connection: PoolConnection | undefined;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT vai_tro FROM tai_khoan WHERE ma_tai_khoan=? FOR UPDATE', [accountId]);
    const account = (rows as { vai_tro: string }[])[0];
    if (!account) { await connection.rollback(); return sendError(res, 404, 'Không tìm thấy tài khoản.'); }
    if (account.vai_tro !== 'NhanVien') { await connection.rollback(); return sendError(res, 400, 'Chỉ phân quyền cho tài khoản nhân viên.'); }
    const normalized = normalizePermissions(permissions);
    await connection.execute('INSERT INTO staff_permissions (ma_tai_khoan,permissions) VALUES (?,?) ON DUPLICATE KEY UPDATE permissions=VALUES(permissions)', [accountId, JSON.stringify(normalized)]);
    await connection.commit();
    return sendSuccess(res, 'Đã cập nhật quyền nhân viên', { ma_tai_khoan: accountId, permissions: normalized });
  } catch { await connection?.rollback(); return sendError(res, 503, 'Không thể lưu phân quyền nhân viên.'); }
  finally { connection?.release(); }
});
export default router;
