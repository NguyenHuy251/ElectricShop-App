import { useEffect, useState } from 'react';
import { api } from '../api/api';
import AdminSidebar from '../components/AdminSidebar';
import type { DashboardStatistics, Order, Product } from '../types';

const statusLabels: Record<string, string> = {
  ChoXacNhan: 'Chờ xác nhận',
  DaXacNhan: 'Đã xác nhận',
  DangGiao: 'Đang giao',
  DaGiao: 'Đã giao',
  DaHuy: 'Đã hủy',
};

const formatCurrency = (value: number | string) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : '-';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [statsResponse, ordersResponse, productsResponse] = await Promise.all([
        api.get('/dashboard'),
        api.get('/don-hang'),
        api.get('/san-pham', { params: { limit: 100 } }),
      ]);
      setStats(statsResponse.data.data);
      setOrders(ordersResponse.data.data || []);
      setProducts(productsResponse.data.data || []);
      setError('');
    } catch {
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !stats) return <div className="layout"><AdminSidebar /><main className="main"><div className="page dashboard-loading">Đang tải tổng quan...</div></main></div>;
  if (!stats) return <div className="layout"><AdminSidebar /><main className="main"><div className="page"><div className="error-box">{error || 'Không có dữ liệu dashboard'} <button className="secondary-btn" onClick={fetchDashboard}>Thử lại</button></div></div></main></div>;

  const recentOrders = orders.slice(0, 5);
  const lowStockProducts = products.filter((product) => Number(product.so_luong) <= 5).slice(0, 5);
  const totalTrackedOrders = stats.tong_don_hang || 1;
  const progressItems = [
    { label: 'Chờ xác nhận', value: stats.so_don_cho_xac_nhan, className: 'progress-warning' },
    { label: 'Đang giao', value: stats.so_don_dang_giao, className: 'progress-info' },
    { label: 'Đã giao', value: stats.so_don_da_giao, className: 'progress-success' },
    { label: 'Đã hủy', value: stats.so_don_da_huy, className: 'progress-danger' },
  ];

  return (
    <div className="layout">
      <AdminSidebar />
      <main className="main">
        <div className="topbar"><div><strong>Tổng quan vận hành</strong><span className="topbar-subtitle">Theo dõi tình hình cửa hàng hôm nay</span></div><div className="topbar-actions"><span>{new Date().toLocaleDateString('vi-VN')}</span><button className="secondary-btn" onClick={fetchDashboard}>↻ Làm mới</button></div></div>
        <div className="page">
          {error ? <div className="error-box">{error}</div> : null}
          <div className="dashboard-intro"><div><span className="eyebrow">ELECTRIC SHOP ADMIN</span><h1 className="page-title">Xin chào, quản trị viên</h1><p className="dashboard-caption">Đây là tình hình hoạt động mới nhất của cửa hàng.</p></div><div className="live-pill"><span /> Dữ liệu trực tiếp</div></div>
          <div className="grid dashboard-stats">
            <div className="stat-box"><div className="label">Sản phẩm</div><h2>{stats.tong_san_pham}</h2><span className="stat-hint">Đang quản lý</span></div>
            <div className="stat-box"><div className="label">Khách hàng</div><h2>{stats.tong_khach_hang}</h2><span className="stat-hint">Tài khoản khách</span></div>
            <div className="stat-box"><div className="label">Nhân viên</div><h2>{stats.tong_nhan_vien}</h2><span className="stat-hint">Đang làm việc</span></div>
            <div className="stat-box"><div className="label">Đơn hàng</div><h2>{stats.tong_don_hang}</h2><span className="stat-hint">Tất cả trạng thái</span></div>
            <div className="stat-box revenue-box"><div className="label">Doanh thu</div><h2>{formatCurrency(stats.tong_doanh_thu)}</h2><span className="stat-hint">Đơn đang xử lý và đã giao</span></div>
          </div>
          <div className="dashboard-columns mt">
            <section className="card dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">THEO DÕI</span><h3>Tiến độ đơn hàng</h3></div><a href="/orders">Xem tất cả →</a></div><div className="progress-list">{progressItems.map((item) => <div className="progress-item" key={item.label}><div className="progress-label"><span>{item.label}</span><strong>{item.value}</strong></div><div className="progress-track"><div className={`progress-fill ${item.className}`} style={{ width: `${Math.min(100, (item.value / totalTrackedOrders) * 100)}%` }} /></div></div>)}</div></section>
            <section className="card dashboard-panel alert-panel"><div className="panel-heading"><div><span className="eyebrow">CẦN XỬ LÝ</span><h3>Đơn chờ xác nhận</h3></div><span className="count-badge">{stats.so_don_cho_xac_nhan}</span></div>{stats.so_don_cho_xac_nhan > 0 ? <p>Có đơn hàng đang chờ nhân viên kiểm tra và xác nhận.</p> : <p className="success-copy">Tuyệt vời, hiện không có đơn nào cần xử lý.</p>}<a className="panel-link" href="/orders">Mở quản lý đơn hàng →</a></section>
          </div>
          <div className="dashboard-columns mt">
            <section className="card dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">MỚI NHẤT</span><h3>Đơn hàng gần đây</h3></div><a href="/orders">Xem tất cả →</a></div>{recentOrders.length ? <div className="recent-orders">{recentOrders.map((order) => <div className="recent-order" key={order.ma_don_hang}><div className="order-avatar">#{order.ma_don_hang}</div><div className="recent-order-info"><strong>{order.ho_ten_nguoi_nhan}</strong><span>{formatDate(order.ngay_dat)} · {order.items?.length || 0} sản phẩm</span></div><div className="recent-order-total"><strong>{formatCurrency(order.tong_tien)}</strong><span className={`status-dot ${order.trang_thai}`}>{statusLabels[order.trang_thai] || order.trang_thai}</span></div></div>)}</div> : <p className="empty-copy">Chưa có đơn hàng.</p>}</section>
            <section className="card dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">KHO HÀNG</span><h3>Sản phẩm sắp hết</h3></div><a href="/products">Quản lý kho →</a></div>{lowStockProducts.length ? <div className="stock-list">{lowStockProducts.map((product) => <div className="stock-item" key={product.ma_san_pham}><div className="stock-image">{product.hinh_anh ? <img src={product.hinh_anh} alt="" /> : '—'}</div><div><strong>{product.ten_san_pham}</strong><span>{product.ma_san_pham_code}</span></div><b className={Number(product.so_luong) === 0 ? 'out-stock' : ''}>{product.so_luong} sp</b></div>)}</div> : <p className="success-copy">Tồn kho đang ổn định.</p>}</section>
          </div>
        </div>
      </main>
    </div>
  );
}
