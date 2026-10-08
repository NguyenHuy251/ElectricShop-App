import { useCallback, useState } from 'react';
import { flushSync } from 'react-dom';
import { App, Button, Empty, Input, Progress, Space, Spin, Table, Tag, Tooltip } from 'antd';
import { BarChartOutlined, DollarOutlined, DownloadOutlined, PrinterOutlined, ReloadOutlined, ShoppingOutlined, WarningOutlined } from '@ant-design/icons';
import { api } from '../api/api';
import { useLoad } from '../hooks/useLoad';
import LoadError from '../components/LoadError';
import { money } from '../utils/format';
import { exportExcel } from '../utils/export';
import { errorMessage } from '../utils/errors';

interface Monthly { thang: string; so_don: number | string; doanh_thu: number | string }
interface Bestseller { ma_san_pham: number; ten_san_pham: string; da_ban: number | string; tien_hang: number | string }
interface Stock { ma_san_pham: number; ten_san_pham: string; ten_bien_the?: string | null; so_luong: number }
interface Report { monthly: Monthly[]; bestsellers: Bestseller[]; low_stock: Stock[] }
const monthLabel = (value: string) => { const [year, month] = value.split('-'); return `${month}/${year}`; };
const dateLabel = (value: string) => value.split('-').reverse().join('/');

export default function ReportsPage() {
  const [from, setFrom] = useState(''), [to, setTo] = useState('');
  const [range, setRange] = useState({ from: '', to: '' });
  const [printing, setPrinting] = useState(false);
  const { message } = App.useApp();
  const result = useLoad(useCallback(async () => {
    const response = await api.get('/shop/reports', { params: { from: range.from || undefined, to: range.to || undefined } });
    return response.data.data as Report;
  }, [range]));
  const data = result.error ? undefined : result.data;
  const monthly = data?.monthly || [], bestsellers = data?.bestsellers || [], stock = data?.low_stock || [];
  const revenue = monthly.reduce((sum, row) => sum + Number(row.doanh_thu), 0);
  const orders = monthly.reduce((sum, row) => sum + Number(row.so_don), 0);
  const chart = monthly.slice(-12);
  const maxRevenue = Math.max(1, ...chart.map(row => Number(row.doanh_thu)));
  const maxSold = Math.max(1, ...bestsellers.map(row => Number(row.da_ban)));
  const rangeLabel = !range.from && !range.to ? 'Toàn bộ thời gian' : `${range.from ? dateLabel(range.from) : 'Từ đầu'} — ${range.to ? dateLabel(range.to) : 'Đến nay'}`;
  const ready = Boolean(data) && !result.loading;
  const printReport = () => {
    window.addEventListener('afterprint', () => setPrinting(false), { once: true });
    flushSync(() => setPrinting(true));
    window.print();
  };
  const applyRange = () => {
    if (from && to && from > to) { void message.warning('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'); return; }
    setRange({ from, to });
  };
  const exportRevenue = () => void exportExcel('doanh-thu', [
    { header: 'Tháng', key: 'thang' }, { header: 'Số đơn', key: 'so_don' }, { header: 'Doanh thu', key: 'doanh_thu' },
  ], monthly.map(row => ({ ...row }))).catch(error => message.error(errorMessage(error)));

  return <div className="reports-page">
    <div className="page-heading reports-heading">
      <div><span className="eyebrow">HIỆU QUẢ KINH DOANH</span><h1 className="page-title">Báo cáo bán hàng</h1><p className="reports-subtitle">Theo dõi doanh thu, sản phẩm bán chạy và tình hình tồn kho.</p></div>
      <Space wrap className="reports-actions"><Button icon={<ReloadOutlined />} onClick={result.reload} disabled={result.loading}>Làm mới</Button><Button icon={<PrinterOutlined />} disabled={!ready} onClick={printReport}>In / PDF</Button><Button type="primary" icon={<DownloadOutlined />} disabled={!ready || !monthly.length} onClick={exportRevenue}>Xuất Excel</Button></Space>
    </div>
    <section className="reports-filters" aria-label="Lọc báo cáo theo ngày">
      <div className="reports-filter-caption"><BarChartOutlined /><div><strong>Khoảng thời gian</strong><span>Thống kê theo ngày đặt hàng</span></div></div>
      <div className="reports-date-fields"><label>Từ ngày<Input type="date" aria-label="Từ ngày" value={from} onChange={event => setFrom(event.target.value)} /></label><span className="reports-date-arrow">→</span><label>Đến ngày<Input type="date" aria-label="Đến ngày" value={to} onChange={event => setTo(event.target.value)} /></label><Button type="primary" onClick={applyRange} disabled={result.loading}>Áp dụng</Button><Button onClick={() => { setFrom(''); setTo(''); setRange({ from: '', to: '' }); }} disabled={result.loading}>Đặt lại</Button></div>
    </section>
    <div className="reports-period"><Tag color="green">{rangeLabel}</Tag><span>Doanh thu và sản phẩm bán chạy chỉ tính đơn đã giao.</span></div>
    <LoadError error={result.error} retry={result.reload} />
    <Spin spinning={result.loading}>
      <div className="reports-stats">
        <div className="reports-stat reports-stat-primary"><span className="reports-stat-icon"><DollarOutlined /></span><span className="reports-stat-label">Tổng doanh thu</span><strong>{data ? money(revenue) : '—'}</strong><small>Giá trị thanh toán của đơn đã giao</small></div>
        <div className="reports-stat"><span className="reports-stat-icon"><ShoppingOutlined /></span><span className="reports-stat-label">Đơn hàng đã giao</span><strong>{data ? orders.toLocaleString('vi-VN') : '—'}</strong><small>Trong khoảng thời gian đã chọn</small></div>
        <div className="reports-stat"><span className="reports-stat-icon"><BarChartOutlined /></span><span className="reports-stat-label">Giá trị đơn trung bình</span><strong>{data ? money(orders ? revenue / orders : 0) : '—'}</strong><small>Doanh thu / số đơn đã giao</small></div>
        <div className="reports-stat reports-stat-warning"><span className="reports-stat-icon"><WarningOutlined /></span><span className="reports-stat-label">Mặt hàng tồn kho thấp</span><strong>{data ? stock.length : '—'}</strong><small>Tồn kho hiện tại từ 5 sản phẩm trở xuống</small></div>
      </div>
      <section className="reports-panel reports-chart-panel">
        <div className="reports-panel-heading"><div><h2>Xu hướng doanh thu</h2><p>{monthly.length > 12 ? '12 tháng có doanh thu gần nhất trong khoảng đã chọn' : 'Doanh thu theo tháng trong khoảng đã chọn'}</p></div><span className="reports-legend"><i />Đơn đã giao</span></div>
        {chart.length ? <div className="reports-chart" aria-label="Biểu đồ doanh thu theo tháng">
          {chart.map(row => <Tooltip key={row.thang} title={<>{monthLabel(row.thang)} · {money(row.doanh_thu)} · {row.so_don} đơn</>}>
            <div className="reports-chart-column" tabIndex={0} aria-label={`${monthLabel(row.thang)}: ${money(row.doanh_thu)}, ${row.so_don} đơn`}><span className="reports-chart-value">{new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(row.doanh_thu))}đ</span><div className="reports-chart-track"><div className="reports-chart-bar" style={{ height: `${Number(row.doanh_thu) / maxRevenue * 100}%` }} /></div><span className="reports-chart-label">{monthLabel(row.thang)}</span></div>
          </Tooltip>)}
        </div> : <Empty description="Chưa có doanh thu trong khoảng thời gian này" />}
      </section>
      <div className="reports-detail-grid">
        <section className="reports-panel">
          <div className="reports-panel-heading"><div><h2>Doanh thu theo tháng</h2><p>Chi tiết số đơn và giá trị thanh toán</p></div><Tag>{monthly.length} tháng</Tag></div>
          <Table<Monthly> size="middle" rowKey="thang" dataSource={monthly} pagination={printing ? false : { pageSize: 6, hideOnSinglePage: true, showSizeChanger: false }} scroll={{ x: 400 }} locale={{ emptyText: 'Chưa có doanh thu' }} columns={[
            { title: 'Tháng', dataIndex: 'thang', render: monthLabel },
            { title: 'Số đơn', dataIndex: 'so_don', align: 'right' },
            { title: 'Doanh thu', dataIndex: 'doanh_thu', align: 'right', render: value => <strong className="reports-money">{money(value)}</strong> },
          ]} />
        </section>
        <section className="reports-panel">
          <div className="reports-panel-heading"><div><h2>Sản phẩm bán chạy</h2><p>Xếp hạng theo số lượng bán · tiền hàng trước giảm giá</p></div><Tag color="green">Top {bestsellers.length}</Tag></div>
          <Table<Bestseller> size="middle" rowKey="ma_san_pham" dataSource={bestsellers} pagination={printing ? false : { pageSize: 5, hideOnSinglePage: true, showSizeChanger: false }} scroll={{ x: 440 }} locale={{ emptyText: 'Chưa có sản phẩm bán ra' }} columns={[
            { title: 'Sản phẩm', dataIndex: 'ten_san_pham', render: (name, row) => <div className="reports-product"><span className="reports-rank">{bestsellers.indexOf(row) + 1}</span><div><strong>{name}</strong><Progress percent={Number(row.da_ban) / maxSold * 100} showInfo={false} size="small" strokeColor="#258467" /></div></div> },
            { title: 'Đã bán', dataIndex: 'da_ban', align: 'right', width: 75 },
            { title: 'Tiền hàng', dataIndex: 'tien_hang', align: 'right', render: money },
          ]} />
        </section>
      </div>
      <section className="reports-panel reports-stock-panel">
        <div className="reports-panel-heading"><div><h2><WarningOutlined /> Cần bổ sung tồn kho</h2><p>Tồn kho hiện tại, không phụ thuộc khoảng thời gian báo cáo</p></div><Tag color={stock.length ? 'orange' : 'green'}>{stock.length ? `${stock.length} mặt hàng cần chú ý` : 'Không có cảnh báo'}</Tag></div>
        <Table<Stock> size="middle" rowKey={row => `${row.ma_san_pham}:${row.ten_bien_the || ''}`} dataSource={stock} pagination={printing ? false : { pageSize: 8, hideOnSinglePage: true, showSizeChanger: false }} scroll={{ x: 550 }} locale={{ emptyText: 'Không có mặt hàng tồn kho thấp' }} columns={[
          { title: 'Sản phẩm', dataIndex: 'ten_san_pham', render: name => <strong>{name}</strong> },
          { title: 'Biến thể', dataIndex: 'ten_bien_the', render: value => value || 'Sản phẩm tiêu chuẩn' },
          { title: 'Tồn kho', dataIndex: 'so_luong', align: 'right', render: value => <Tag color={Number(value) === 0 ? 'red' : 'orange'}>{value} sản phẩm</Tag> },
          { title: 'Tình trạng', dataIndex: 'so_luong', render: value => Number(value) === 0 ? <span className="reports-out-of-stock">Hết hàng</span> : 'Sắp hết hàng' },
        ]} />
      </section>
    </Spin>
  </div>;
}
