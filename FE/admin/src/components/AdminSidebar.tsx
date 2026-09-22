import { NavLink, useNavigate } from 'react-router-dom';

const items = [
  { path: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { path: '/products', label: 'Sản phẩm', icon: '▦' },
  { path: '/categories', label: 'Danh mục', icon: '◈' },
  { path: '/brands', label: 'Thương hiệu', icon: '◇' },
  { path: '/orders', label: 'Đơn hàng', icon: '▤' },
  { path: '/customers', label: 'Khách hàng', icon: '◎' },
  { path: '/employees', label: 'Nhân viên', icon: '◉' },
  { path: '/reviews', label: 'Đánh giá', icon: '★' },
  { path: '/contacts', label: 'Liên hệ', icon: '✉' },
];

export default function AdminSidebar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="brand-mark"><span>✦</span><div><strong>Electric</strong><small>SHOP ADMIN</small></div></div>
      <nav className="sidebar-nav" aria-label="Điều hướng quản trị">
        {items.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? 'active' : undefined}>
            <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <button className="logout-link" onClick={logout}><span className="nav-icon">↪</span><span>Đăng xuất</span></button>
    </aside>
  );
}
