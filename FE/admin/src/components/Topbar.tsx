import { Button, Space } from 'antd';
import { useAuth } from '../auth/AuthContext';
import { labels } from '../utils/format';
export default function Topbar({ title, toggle }: { title: string; toggle: () => void }) {
  const { user, logout } = useAuth();
  return <header className="topbar"><Space><Button className="menu-toggle" onClick={toggle} aria-label="Mở menu">☰</Button><strong>{title}</strong></Space><Space wrap><span>{user?.ho_ten} · {labels[user?.vai_tro || '']}</span><Button onClick={logout}>Đăng xuất</Button></Space></header>;
}
