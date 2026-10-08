import { pool } from '../config/database.js';

export const permissionGroups = [
  { code: 'dashboard', name: 'Tổng quan', description: 'Xem thống kê tổng quan cửa hàng.' },
  { code: 'catalog', name: 'Danh mục sản phẩm', description: 'Xem, thêm, sửa, xóa sản phẩm, biến thể, danh mục, thương hiệu và thông số.' },
  { code: 'orders', name: 'Đơn hàng', description: 'Xem đơn hàng của cửa hàng, cập nhật trạng thái và xóa đơn đã giao hoặc đã hủy.' },
  { code: 'inventory', name: 'Nhập kho', description: 'Xem lịch sử nhập kho và tạo phiếu nhập.' },
  { code: 'reviews', name: 'Đánh giá', description: 'Xem và xóa đánh giá của khách hàng.' },
  { code: 'contacts', name: 'Liên hệ', description: 'Xem, trả lời và xóa liên hệ của khách hàng.' },
  { code: 'vouchers', name: 'Mã giảm giá', description: 'Xem, tạo và bật/tắt mã giảm giá.' },
  { code: 'reports', name: 'Báo cáo', description: 'Xem, xuất và in báo cáo doanh thu, sản phẩm bán chạy, tồn kho.' },
] as const;
export type Permission = typeof permissionGroups[number]['code'];
export const permissionPresets = [
  { name: 'Bán hàng', permissions: ['orders', 'contacts'] },
  { name: 'Kho', permissions: ['catalog', 'inventory'] },
  { name: 'Chăm sóc khách hàng', permissions: ['contacts', 'reviews'] },
  { name: 'Quản lý nghiệp vụ', permissions: permissionGroups.map(group => group.code) },
] as const;

export async function ensurePermissionSchema(db: Pick<typeof pool, 'query'> = pool) {
  await db.query(`CREATE TABLE IF NOT EXISTS staff_permissions (
    ma_tai_khoan INT NOT NULL PRIMARY KEY,
    permissions JSON NOT NULL,
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE
  )`);
}
export function normalizePermissions(value: unknown): Permission[] {
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch { return []; } }
  if (!Array.isArray(value)) return [];
  return permissionGroups.filter(group => value.includes(group.code)).map(group => group.code);
}
export async function loadPermissions(accountId: number, role: string): Promise<Permission[]> {
  if (role === 'Admin') return permissionGroups.map(group => group.code);
  if (role !== 'NhanVien') return [];
  const [rows] = await pool.query('SELECT permissions FROM staff_permissions WHERE ma_tai_khoan = ?', [accountId]);
  return normalizePermissions((rows as { permissions: unknown }[])[0]?.permissions);
}
export function hasPermission(user: { vai_tro: string; permissions?: readonly string[] } | undefined, permission: Permission) {
  return user?.vai_tro === 'Admin' || (user?.vai_tro === 'NhanVien' && user.permissions?.includes(permission) === true);
}
