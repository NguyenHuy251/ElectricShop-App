import { useEffect, useState } from 'react';
import { api } from '../api/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard');
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to load dashboard', error);
      }
    };
    fetchStats();
  }, []);

  if (!stats) return <div className="page">Loading...</div>;

  return (
    <div className="layout">
      <aside className="sidebar">
        <h3>AppElectricShop</h3>
        <a href="/dashboard">Dashboard</a>
        <a href="/products">Sản phẩm</a>
        <a href="/categories">Danh mục</a>
        <a href="/orders">Đơn hàng</a>
        <a href="/customers">Khách hàng</a>
        <a href="/employees">Nhân viên</a>
        <a href="/reviews">Đánh giá</a>
        <a href="/contacts">Liên hệ</a>
        <a href="/login" onClick={() => localStorage.removeItem('admin_token')}>Đăng xuất</a>
      </aside>
      <main className="main">
        <div className="topbar">
          <strong>Dashboard</strong>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
        <div className="page">
          <div className="grid">
            <div className="stat-box"><div className="label">Sản phẩm</div><h2>{stats.tong_san_pham}</h2></div>
            <div className="stat-box"><div className="label">Khách hàng</div><h2>{stats.tong_khach_hang}</h2></div>
            <div className="stat-box"><div className="label">Nhân viên</div><h2>{stats.tong_nhan_vien}</h2></div>
            <div className="stat-box"><div className="label">Đơn hàng</div><h2>{stats.tong_don_hang}</h2></div>
            <div className="stat-box"><div className="label">Doanh thu</div><h2>{Number(stats.tong_doanh_thu).toLocaleString()}đ</h2></div>
          </div>
          <div className="card mt">
            <h3>Thống kê đơn hàng</h3>
            <div className="grid">
              <div>Chờ xác nhận: {stats.so_don_cho_xac_nhan}</div>
              <div>Đang giao: {stats.so_don_dang_giao}</div>
              <div>Đã giao: {stats.so_don_da_giao}</div>
              <div>Đã hủy: {stats.so_don_da_huy}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
