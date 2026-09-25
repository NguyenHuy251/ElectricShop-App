import { useCallback } from 'react';
import { Button, Empty, Progress, Spin, Table } from 'antd';
import { Link } from 'react-router-dom';
import { api } from '../api/api';
import { orderApi } from '../api/order.api';
import { useLoad } from '../hooks/useLoad';
import LoadError from '../components/LoadError';
import { dateTime, money, Status } from '../utils/format';
import type { ApiResponse, DashboardStatistics, Order } from '../types';
export default function DashboardPage() {
  const result = useLoad(useCallback(async () => {
    const [statistics, orders] = await Promise.all([api.get<ApiResponse<DashboardStatistics>>('/dashboard'), orderApi.list()]);
    if (!statistics.data.data) throw new Error('Máy chủ chưa trả dữ liệu thống kê');
    return { stats: statistics.data.data, orders: orders.data || [] };
  }, []));
  const stats = result.data?.stats;
  const revenue = stats?.doanh_thu_theo_thang || [];
  const max = Math.max(1, ...revenue.map(row => Number(row.doanh_thu)));
  return <><div className="page-heading"><h1 className="page-title">Tổng quan cửa hàng</h1><Button onClick={result.reload} disabled={result.loading}>Làm mới</Button></div><LoadError error={result.error} retry={result.reload} />
    <Spin spinning={result.loading}><div className="loading-content">{stats && <><div className="grid">{[['Sản phẩm', stats.tong_san_pham], ['Khách hàng', stats.tong_khach_hang], ['Nhân viên', stats.tong_nhan_vien], ['Đơn hàng', stats.tong_don_hang], ['Doanh thu đơn đã giao', money(stats.tong_doanh_thu)]].map(([label, value]) => <div className="stat-box" key={label}><span className="label">{label}</span><h2>{value}</h2></div>)}</div>
      <div className="dashboard-columns mt"><section className="card"><h3>Doanh thu 12 tháng · đơn đã giao</h3>{revenue.length ? <div className="revenue-chart" role="img" aria-label="Biểu đồ doanh thu theo tháng">{revenue.map(row => <div key={row.thang} className="revenue-column"><span className="revenue-value">{money(row.doanh_thu)}</span><div className="revenue-bar-track"><div className="revenue-bar" style={{ height: `${Number(row.doanh_thu) / max * 100}%` }} /></div><small>{row.thang}</small></div>)}</div> : <Empty description="Chưa có doanh thu" />}</section>
      <section className="card"><h3>Đơn hàng theo trạng thái</h3>{([['ChoXacNhan', stats.so_don_cho_xac_nhan], ['DaXacNhan', stats.so_don_da_xac_nhan], ['DangGiao', stats.so_don_dang_giao], ['DaGiao', stats.so_don_da_giao], ['DaHuy', stats.so_don_da_huy]] as [string, number][]).map(([status, count]) => <div key={status}><div className="row"><Status value={status} /><strong>{count}</strong></div><Progress percent={stats.tong_don_hang ? count / stats.tong_don_hang * 100 : 0} showInfo={false} /></div>)}</section></div>
      <section className="card mt"><div className="panel-heading"><h3>Đơn hàng mới nhất</h3><Link to="/orders">Xem tất cả</Link></div><Table<Order> rowKey="ma_don_hang" dataSource={result.data?.orders.slice(0, 5)} pagination={false} scroll={{ x: 650 }} locale={{ emptyText: <Empty description="Chưa có đơn hàng" /> }} columns={[{ title: 'Mã', dataIndex: 'ma_don_hang' }, { title: 'Người nhận', dataIndex: 'ho_ten_nguoi_nhan' }, { title: 'Ngày đặt', dataIndex: 'ngay_dat', render: dateTime }, { title: 'Tổng tiền', dataIndex: 'tong_tien', render: money }, { title: 'Trạng thái', dataIndex: 'trang_thai', render: value => <Status value={value} /> }]} /></section>
    </>}</div></Spin></>;
}
