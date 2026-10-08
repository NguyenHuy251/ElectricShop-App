import type { User } from '../types';

export type Permission = 'dashboard' | 'catalog' | 'orders' | 'inventory' | 'reviews' | 'contacts' | 'reports' | 'vouchers';
export const routePermissions: Record<string, Permission | 'admin'> = {
  '/dashboard': 'dashboard', '/products': 'catalog', '/categories': 'catalog', '/category-specifications': 'catalog',
  '/specifications': 'catalog', '/brands': 'catalog', '/orders': 'orders', '/inventory': 'inventory',
  '/reviews': 'reviews', '/contacts': 'contacts', '/reports': 'reports', '/vouchers': 'vouchers',
  '/customers': 'admin', '/employees': 'admin', '/permissions': 'admin',
};
export function canAccess(user: User | null, path: string) {
  if (!user) return false;
  if (user.vai_tro === 'Admin') return true;
  if (user.vai_tro !== 'NhanVien') return false;
  if (path === '/account') return true;
  const permission = routePermissions[path];
  return permission !== undefined && permission !== 'admin' && user.permissions?.includes(permission) === true;
}
export function startPage(user: User | null) {
  return Object.keys(routePermissions).find(path => canAccess(user, path)) || '/account';
}
