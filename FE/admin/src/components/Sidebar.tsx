import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
export const navigation = [
  ['/dashboard', 'Tổng quan'], ['/products', 'Sản phẩm'], ['/categories', 'Danh mục'], ['/brands', 'Thương hiệu'],
  ['/orders', 'Đơn hàng'], ['/customers', 'Khách hàng / Tài khoản'], ['/employees', 'Nhân viên'], ['/reviews', 'Đánh giá'], ['/contacts', 'Liên hệ'],
];
export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  return <aside className="sidebar"><div className="brand-mark"><strong>ElectricShop<small>QUẢN TRỊ CỬA HÀNG</small></strong></div><nav className="sidebar-nav" aria-label="Menu quản trị">{navigation.filter(([path]) => user?.vai_tro === 'Admin' || !['/customers', '/employees'].includes(path)).map(([path, label]) => <NavLink key={path} to={path} onClick={onNavigate}>{label}</NavLink>)}</nav></aside>;
}
