import { useCallback, useState } from 'react';
import { flushSync } from 'react-dom';
import { App, Button, Dropdown, Empty, Input, Progress, Select, Space, Spin, Table, Tabs, Tag, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  DownloadOutlined,
  FilterOutlined,
  InboxOutlined,
  PrinterOutlined,
  ReloadOutlined,
  RiseOutlined,
  SearchOutlined,
  ShoppingOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { api } from '../api/api';
import { useLoad } from '../hooks/useLoad';
import LoadError from '../components/LoadError';
import { money } from '../utils/format';
import { exportExcel, exportMultiSheetExcel } from '../utils/export';
import { errorMessage } from '../utils/errors';

interface Monthly {
  thang: string;
  so_don: number;
  doanh_thu: number;
  gia_von: number;
  loi_nhuan: number;
  chi_nhap_kho: number;
  so_luot_nhap: number;
}

interface SalesDetail {
  ma_don_hang: number;
  ngay_dat: string;
  trang_thai: string;
  phuong_thuc_thanh_toan: string;
  tong_tien_don: number | string;
  giam_gia_don: number | string;
  phi_giao_hang_don: number | string;
  voucher_code: string | null;
  ho_ten_nguoi_nhan: string;
  so_dien_thoai: string;
  dia_chi_giao_hang: string;
  ma_nhan_vien: number | null;
  ten_nhan_vien: string | null;
  chuc_vu_nhan_vien: string | null;
  ma_san_pham: number;
  ten_san_pham: string;
  ma_bien_the: number | null;
  ten_bien_the: string | null;
  so_luong: number;
  so_luong_ton: number;
  don_gia: number | string;
  thanh_tien: number | string;
  gia_nhap: number | string;
  tien_von: number | string;
  loi_nhuan: number | string;
}

interface PurchaseDetail {
  ma_nhap: number;
  ngay_nhap: string;
  ma_tai_khoan: number;
  ten_nguoi_nhap: string;
  ma_nhan_vien: number | null;
  ten_nhan_vien: string;
  chuc_vu_nhan_vien: string;
  nha_cung_cap: string;
  ma_san_pham: number;
  ten_san_pham: string;
  ma_bien_the: number | null;
  ten_bien_the: string | null;
  so_luong: number;
  gia_nhap: number | string;
  thanh_tien: number | string;
  ghi_chu: string | null;
}

interface StaffSalesReport {
  ma_nhan_vien: number;
  ten_nhan_vien: string;
  chuc_vu: string;
  email?: string;
  so_dien_thoai?: string;
  so_don: number;
  so_san_pham: number;
  doanh_thu: number | string;
  gia_von: number | string;
  loi_nhuan: number | string;
}

interface StaffPurchaseReport {
  ma_tai_khoan: number;
  ma_nhan_vien: number | null;
  ten_nhan_vien: string;
  chuc_vu: string;
  so_lan_nhap: number;
  tong_so_luong: number;
  tong_tien_nhap: number | string;
}

interface CategorySales {
  ma_danh_muc: number;
  ten_danh_muc: string;
  so_don: number;
  so_luong_ban: number;
  doanh_thu: number | string;
  loi_nhuan: number | string;
}

interface Bestseller {
  ma_san_pham: number;
  ten_san_pham: string;
  da_ban: number | string;
  tien_hang: number | string;
  tien_von?: number | string;
  loi_nhuan?: number | string;
}

interface Stock {
  ma_san_pham: number;
  ten_san_pham: string;
  ten_bien_the?: string | null;
  so_luong: number;
}

interface StaffOption {
  ma_nhan_vien: number;
  ho_ten: string;
  chuc_vu: string;
}

interface ReportSummary {
  tong_doanh_thu: number;
  tong_gia_von: number;
  loi_nhuan_gop: number;
  ty_suat_loi_nhuan: number;
  tong_don_hang: number;
  tong_san_pham_ban: number;
  tong_chi_nhap_kho: number;
  tong_luot_nhap: number;
  tong_san_pham_nhap: number;
}

interface ReportData {
  summary: ReportSummary;
  monthly: Monthly[];
  sales_details: SalesDetail[];
  purchase_details: PurchaseDetail[];
  staff_sales_report: StaffSalesReport[];
  staff_purchase_report: StaffPurchaseReport[];
  category_sales: CategorySales[];
  bestsellers: Bestseller[];
  low_stock: Stock[];
  staff_list: StaffOption[];
}

const statusMap: Record<string, { label: string; color: string }> = {
  ChoXacNhan: { label: 'Chờ xác nhận', color: 'blue' },
  DaXacNhan: { label: 'Đã xác nhận', color: 'cyan' },
  DangGiao: { label: 'Đang giao', color: 'orange' },
  DaGiao: { label: 'Đã giao', color: 'green' },
  DaHuy: { label: 'Đã hủy', color: 'red' },
};

const paymentMap: Record<string, string> = {
  TienMat: 'Tiền mặt',
  ChuyenKhoan: 'Chuyển khoản',
  ThanhToanKhiNhanHang: 'COD (Khi nhận hàng)',
};

const monthLabel = (value: string) => {
  if (!value) return '';
  const [year, month] = value.split('-');
  return `${month}/${year}`;
};

const dateLabel = (value: string) => (value ? value.split('-').reverse().join('/') : '');

const formatDateTime = (value: string) => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN')}`;
  } catch {
    return value;
  }
};

export default function ReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [employeeId, setEmployeeId] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [range, setRange] = useState<{
    from: string;
    to: string;
    employeeId?: number;
    status?: string;
    search?: string;
  }>({
    from: '',
    to: '',
  });

  const [printing, setPrinting] = useState(false);
  const { message } = App.useApp();

  const result = useLoad(
    useCallback(async () => {
      const response = await api.get('/shop/reports', {
        params: {
          from: range.from || undefined,
          to: range.to || undefined,
          employee_id: range.employeeId || undefined,
          status: range.status !== 'all' ? range.status : undefined,
          search: range.search || undefined,
        },
      });
      return response.data.data as ReportData;
    }, [range])
  );

  const data = result.error ? undefined : result.data;
  const summary = data?.summary || {
    tong_doanh_thu: 0,
    tong_gia_von: 0,
    loi_nhuan_gop: 0,
    ty_suat_loi_nhuan: 0,
    tong_don_hang: 0,
    tong_san_pham_ban: 0,
    tong_chi_nhap_kho: 0,
    tong_luot_nhap: 0,
    tong_san_pham_nhap: 0,
  };

  const monthly = data?.monthly || [];
  const salesDetails = data?.sales_details || [];
  const purchaseDetails = data?.purchase_details || [];
  const staffSalesReport = data?.staff_sales_report || [];
  const staffPurchaseReport = data?.staff_purchase_report || [];
  const categorySales = data?.category_sales || [];
  const bestsellers = data?.bestsellers || [];
  const stock = data?.low_stock || [];
  const staffList = data?.staff_list || [];

  const ready = Boolean(data) && !result.loading;

  // Chart metrics
  const chart = monthly.slice(-12);
  const maxRevenue = Math.max(1, ...chart.map(row => Number(row.doanh_thu || 0)));
  const maxSold = Math.max(1, ...bestsellers.map(row => Number(row.da_ban || 0)));
  const maxCatRevenue = Math.max(1, ...categorySales.map(c => Number(c.doanh_thu || 0)));

  const printReport = () => {
    window.addEventListener('afterprint', () => setPrinting(false), { once: true });
    flushSync(() => setPrinting(true));
    window.print();
  };

  const applyRange = () => {
    if (from && to && from > to) {
      void message.warning('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
      return;
    }
    setRange({
      from,
      to,
      employeeId,
      status,
      search: search.trim() || undefined,
    });
  };

  const resetFilters = () => {
    setFrom('');
    setTo('');
    setEmployeeId(undefined);
    setStatus('all');
    setSearch('');
    setRange({ from: '', to: '' });
  };

  const setQuickRange = (type: 'today' | '7days' | '30days' | 'this_month' | 'last_month' | 'all') => {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    if (type === 'all') {
      setFrom('');
      setTo('');
      setRange(prev => ({ ...prev, from: '', to: '' }));
      return;
    }
    if (type === 'today') {
      const d = fmt(today);
      setFrom(d);
      setTo(d);
      setRange(prev => ({ ...prev, from: d, to: d }));
      return;
    }
    if (type === '7days') {
      const start = new Date();
      start.setDate(today.getDate() - 7);
      const s = fmt(start),
        e = fmt(today);
      setFrom(s);
      setTo(e);
      setRange(prev => ({ ...prev, from: s, to: e }));
      return;
    }
    if (type === '30days') {
      const start = new Date();
      start.setDate(today.getDate() - 30);
      const s = fmt(start),
        e = fmt(today);
      setFrom(s);
      setTo(e);
      setRange(prev => ({ ...prev, from: s, to: e }));
      return;
    }
    if (type === 'this_month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const s = fmt(start),
        e = fmt(today);
      setFrom(s);
      setTo(e);
      setRange(prev => ({ ...prev, from: s, to: e }));
      return;
    }
    if (type === 'last_month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      const s = fmt(start),
        e = fmt(end);
      setFrom(s);
      setTo(e);
      setRange(prev => ({ ...prev, from: s, to: e }));
      return;
    }
  };

  // Export handlers
  const handleExportAll = async () => {
    try {
      await exportMultiSheetExcel('bao-cao-toan-dien-kinh-doanh', [
        {
          sheetName: 'Tong_Quan_Tai_Chinh',
          columns: [
            { header: 'Tháng', key: 'thang', width: 14 },
            { header: 'Số đơn bán', key: 'so_don', width: 14 },
            { header: 'Doanh thu (VNĐ)', key: 'doanh_thu', width: 22 },
            { header: 'Giá vốn bán (VNĐ)', key: 'gia_von', width: 22 },
            { header: 'Lợi nhuận gộp (VNĐ)', key: 'loi_nhuan', width: 22 },
            { header: 'Chi phí nhập hàng (VNĐ)', key: 'chi_nhap_kho', width: 24 },
            { header: 'Số phiếu nhập', key: 'so_luot_nhap', width: 15 },
          ],
          rows: monthly.map(m => ({ ...m })),
        },
        {
          sheetName: 'Chi_Tiet_Ban_Hang',
          columns: [
            { header: 'Mã đơn', key: 'ma_don_hang', width: 12 },
            { header: 'Thời gian đặt', key: 'ngay_dat', width: 20 },
            { header: 'Nhân viên bán', key: 'ten_nhan_vien', width: 22 },
            { header: 'Chức vụ NV', key: 'chuc_vu_nhan_vien', width: 18 },
            { header: 'Khách hàng', key: 'ho_ten_nguoi_nhan', width: 22 },
            { header: 'SĐT khách', key: 'so_dien_thoai', width: 15 },
            { header: 'Tên sản phẩm', key: 'ten_san_pham', width: 30 },
            { header: 'Biến thể / Thuộc tính', key: 'ten_bien_the', width: 24 },
            { header: 'Số lượng bán', key: 'so_luong', width: 12 },
            { header: 'Tồn trong kho', key: 'so_luong_ton', width: 14 },
            { header: 'Đơn giá bán', key: 'don_gia', width: 16 },
            { header: 'Thành tiền', key: 'thanh_tien', width: 18 },
            { header: 'Giá vốn', key: 'gia_nhap', width: 16 },
            { header: 'Lợi nhuận gộp', key: 'loi_nhuan', width: 18 },
            { header: 'Trạng thái', key: 'trang_thai', width: 14 },
            { header: 'Thanh toán', key: 'phuong_thuc_thanh_toan', width: 22 },
            { header: 'Voucher', key: 'voucher_code', width: 16 },
            { header: 'Địa chỉ giao', key: 'dia_chi_giao_hang', width: 35 },
          ],
          rows: salesDetails.map(s => ({
            ...s,
            trang_thai: statusMap[s.trang_thai]?.label || s.trang_thai,
            phuong_thuc_thanh_toan: paymentMap[s.phuong_thuc_thanh_toan] || s.phuong_thuc_thanh_toan,
            ngay_dat: formatDateTime(s.ngay_dat),
          })),
        },
        {
          sheetName: 'Chi_Tiet_Nhap_Hang',
          columns: [
            { header: 'Mã phiếu', key: 'ma_nhap', width: 12 },
            { header: 'Thời gian nhập', key: 'ngay_nhap', width: 20 },
            { header: 'Nhân viên nhập', key: 'ten_nhan_vien', width: 22 },
            { header: 'Chức vụ', key: 'chuc_vu_nhan_vien', width: 18 },
            { header: 'Nhà cung cấp', key: 'nha_cung_cap', width: 32 },
            { header: 'Sản phẩm nhập', key: 'ten_san_pham', width: 30 },
            { header: 'Biến thể nhập', key: 'ten_bien_the', width: 25 },
            { header: 'Số lượng nhập', key: 'so_luong', width: 14 },
            { header: 'Đơn giá nhập', key: 'gia_nhap', width: 16 },
            { header: 'Tổng tiền nhập', key: 'thanh_tien', width: 20 },
            { header: 'Ghi chú', key: 'ghi_chu', width: 28 },
          ],
          rows: purchaseDetails.map(p => ({
            ...p,
            ngay_nhap: formatDateTime(p.ngay_nhap),
            ten_bien_the: p.ten_bien_the || 'Tiêu chuẩn',
          })),
        },
        {
          sheetName: 'Hieu_Suat_Nhan_Vien_Ban',
          columns: [
            { header: 'Mã NV', key: 'ma_nhan_vien', width: 10 },
            { header: 'Nhân viên', key: 'ten_nhan_vien', width: 22 },
            { header: 'Chức vụ', key: 'chuc_vu', width: 20 },
            { header: 'Số đơn hoàn tất', key: 'so_don', width: 16 },
            { header: 'Số lượng SP bán', key: 'so_san_pham', width: 16 },
            { header: 'Tổng doanh thu', key: 'doanh_thu', width: 20 },
            { header: 'Tổng giá vốn', key: 'gia_von', width: 20 },
            { header: 'Lợi nhuận gộp', key: 'loi_nhuan', width: 20 },
          ],
          rows: staffSalesReport.map(r => ({ ...r })),
        },
        {
          sheetName: 'Nhan_Vien_Nhap_Kho',
          columns: [
            { header: 'Mã TK / NV', key: 'ma_tai_khoan', width: 12 },
            { header: 'Nhân viên', key: 'ten_nhan_vien', width: 22 },
            { header: 'Chức vụ', key: 'chuc_vu', width: 20 },
            { header: 'Số phiếu nhập', key: 'so_lan_nhap', width: 15 },
            { header: 'Tổng số lượng nhập', key: 'tong_so_luong', width: 18 },
            { header: 'Tổng giá trị nhập', key: 'tong_tien_nhap', width: 22 },
          ],
          rows: staffPurchaseReport.map(r => ({ ...r })),
        },
      ]);
      void message.success('Đã xuất toàn bộ sổ cái báo cáo Excel thành công!');
    } catch (err) {
      void message.error(errorMessage(err));
    }
  };

  const handleExportSales = () => {
    void exportExcel(
      'chi-tiet-ban-hang',
      [
        { header: 'Mã đơn', key: 'ma_don_hang', width: 12 },
        { header: 'Thời gian đặt', key: 'ngay_dat', width: 20 },
        { header: 'Nhân viên bán', key: 'ten_nhan_vien', width: 22 },
        { header: 'Chức vụ NV', key: 'chuc_vu_nhan_vien', width: 18 },
        { header: 'Khách hàng', key: 'ho_ten_nguoi_nhan', width: 22 },
        { header: 'SĐT khách', key: 'so_dien_thoai', width: 15 },
        { header: 'Sản phẩm', key: 'ten_san_pham', width: 30 },
        { header: 'Biến thể', key: 'ten_bien_the', width: 22 },
        { header: 'Số lượng bán', key: 'so_luong', width: 12 },
        { header: 'Tồn trong kho', key: 'so_luong_ton', width: 14 },
        { header: 'Đơn giá', key: 'don_gia', width: 16 },
        { header: 'Thành tiền', key: 'thanh_tien', width: 18 },
        { header: 'Giá vốn', key: 'gia_nhap', width: 16 },
        { header: 'Lợi nhuận', key: 'loi_nhuan', width: 18 },
        { header: 'Trạng thái', key: 'trang_thai', width: 14 },
        { header: 'Thanh toán', key: 'phuong_thuc_thanh_toan', width: 20 },
        { header: 'Voucher', key: 'voucher_code', width: 14 },
        { header: 'Địa chỉ nhận', key: 'dia_chi_giao_hang', width: 35 },
      ],
      salesDetails.map(s => ({
        ...s,
        trang_thai: statusMap[s.trang_thai]?.label || s.trang_thai,
        phuong_thuc_thanh_toan: paymentMap[s.phuong_thuc_thanh_toan] || s.phuong_thuc_thanh_toan,
        ngay_dat: formatDateTime(s.ngay_dat),
      }))
    ).catch(err => message.error(errorMessage(err)));
  };

  const handleExportPurchase = () => {
    void exportExcel(
      'chi-tiet-nhap-hang',
      [
        { header: 'Mã phiếu', key: 'ma_nhap', width: 12 },
        { header: 'Thời gian nhập', key: 'ngay_nhap', width: 20 },
        { header: 'Nhân viên nhập', key: 'ten_nhan_vien', width: 22 },
        { header: 'Chức vụ', key: 'chuc_vu_nhan_vien', width: 18 },
        { header: 'Nhà cung cấp', key: 'nha_cung_cap', width: 32 },
        { header: 'Sản phẩm nhập', key: 'ten_san_pham', width: 30 },
        { header: 'Biến thể nhập', key: 'ten_bien_the', width: 25 },
        { header: 'Số lượng nhập', key: 'so_luong', width: 14 },
        { header: 'Đơn giá nhập', key: 'gia_nhap', width: 16 },
        { header: 'Tổng tiền nhập', key: 'thanh_tien', width: 20 },
        { header: 'Ghi chú', key: 'ghi_chu', width: 28 },
      ],
      purchaseDetails.map(p => ({
        ...p,
        ngay_nhap: formatDateTime(p.ngay_nhap),
        ten_bien_the: p.ten_bien_the || 'Tiêu chuẩn',
      }))
    ).catch(err => message.error(errorMessage(err)));
  };

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'all',
      label: '📥 Xuất toàn bộ sổ cái (Đa Sheets)',
      onClick: handleExportAll,
    },
    {
      type: 'divider',
    },
    {
      key: 'sales',
      label: '🛒 Xuất chi tiết Đơn hàng Bán',
      onClick: handleExportSales,
    },
    {
      key: 'purchase',
      label: '📦 Xuất chi tiết Nhập hàng',
      onClick: handleExportPurchase,
    },
    {
      key: 'monthly',
      label: '📊 Xuất Doanh thu & Lợi nhuận theo tháng',
      onClick: () =>
        void exportExcel(
          'doanh-thu-loi-nhuan-thang',
          [
            { header: 'Tháng', key: 'thang', width: 14 },
            { header: 'Số đơn bán', key: 'so_don', width: 14 },
            { header: 'Doanh thu', key: 'doanh_thu', width: 20 },
            { header: 'Giá vốn hàng bán', key: 'gia_von', width: 20 },
            { header: 'Lợi nhuận gộp', key: 'loi_nhuan', width: 20 },
            { header: 'Tiền nhập kho', key: 'chi_nhap_kho', width: 22 },
            { header: 'Số phiếu nhập', key: 'so_luot_nhap', width: 16 },
          ],
          monthly.map(m => ({ ...m }))
        ).catch(err => message.error(errorMessage(err))),
    },
  ];

  const rangeText = !range.from && !range.to ? 'Toàn bộ thời gian' : `${range.from ? dateLabel(range.from) : 'Từ đầu'} — ${range.to ? dateLabel(range.to) : 'Đến nay'}`;

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="page-heading reports-heading">
        <div>
          <span className="eyebrow">HỆ THỐNG QUẢN TRỊ BÁN HÀNG & TÀI CHÍNH</span>
          <h1 className="page-title">Báo cáo kinh doanh toàn diện</h1>
          <p className="reports-subtitle">
            Theo dõi chi tiết đơn bán hàng (nhân viên bán, mặt hàng, giá, lợi nhuận), nhật ký nhập kho (nhân viên nhập, biến thể, nhà cung cấp) và hiệu suất nhân viên.
          </p>
        </div>
        <Space wrap className="reports-actions">
          <Button icon={<ReloadOutlined />} onClick={result.reload} disabled={result.loading}>
            Làm mới
          </Button>
          <Button icon={<PrinterOutlined />} disabled={!ready} onClick={printReport}>
            In / PDF
          </Button>
          <Dropdown menu={{ items: exportMenuItems }} disabled={!ready}>
            <Button type="primary" icon={<DownloadOutlined />}>
              Xuất Excel <span style={{ fontSize: 11 }}>▼</span>
            </Button>
          </Dropdown>
        </Space>
      </div>

      {/* Filter Toolbar */}
      <section className="reports-filters" aria-label="Bộ lọc báo cáo toàn diện">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div className="reports-filter-caption">
              <FilterOutlined />
              <div>
                <strong>Bộ lọc đa chiều</strong>
                <span>Lọc theo thời gian, nhân viên phụ trách, trạng thái đơn và từ khóa</span>
              </div>
            </div>

            {/* Quick Presets */}
            <Space wrap size="small">
              <Button size="small" type={!from && !to ? 'primary' : 'default'} onClick={() => setQuickRange('all')}>
                Tất cả
              </Button>
              <Button size="small" onClick={() => setQuickRange('today')}>
                Hôm nay
              </Button>
              <Button size="small" onClick={() => setQuickRange('7days')}>
                7 ngày qua
              </Button>
              <Button size="small" onClick={() => setQuickRange('30days')}>
                30 ngày qua
              </Button>
              <Button size="small" onClick={() => setQuickRange('this_month')}>
                Tháng này
              </Button>
              <Button size="small" onClick={() => setQuickRange('last_month')}>
                Tháng trước
              </Button>
            </Space>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div className="reports-date-fields" style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <label>
                Từ ngày
                <Input type="date" aria-label="Từ ngày" value={from} onChange={e => setFrom(e.target.value)} />
              </label>
              <span className="reports-date-arrow">→</span>
              <label>
                Đến ngày
                <Input type="date" aria-label="Đến ngày" value={to} onChange={e => setTo(e.target.value)} />
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 12, color: '#718379' }}>Nhân viên phụ trách</span>
              <Select
                placeholder="Tất cả nhân viên"
                style={{ width: 210, height: 36 }}
                allowClear
                value={employeeId}
                onChange={val => setEmployeeId(val)}
                options={[
                  { label: '👥 Tất cả nhân viên', value: undefined },
                  ...staffList.map(s => ({
                    label: `${s.ho_ten} (${s.chuc_vu})`,
                    value: s.ma_nhan_vien,
                  })),
                ]}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 12, color: '#718379' }}>Trạng thái đơn bán</span>
              <Select
                style={{ width: 170, height: 36 }}
                value={status}
                onChange={val => setStatus(val)}
                options={[
                  { label: 'Tất cả trạng thái', value: 'all' },
                  { label: '🟢 Đã giao (Thành công)', value: 'DaGiao' },
                  { label: '🟠 Đang giao', value: 'DangGiao' },
                  { label: '🔵 Chờ xác nhận', value: 'ChoXacNhan' },
                  { label: '🔴 Đã hủy', value: 'DaHuy' },
                ]}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 200 }}>
              <span style={{ fontSize: 12, color: '#718379' }}>Tìm kiếm nhanh</span>
              <Input
                prefix={<SearchOutlined style={{ color: '#8aa093' }} />}
                placeholder="Mã đơn / Mã phiếu / Tên SP / Nhân viên / Khách..."
                allowClear
                style={{ height: 36, borderRadius: 8 }}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onPressEnter={applyRange}
              />
            </div>

            <Space>
              <Button type="primary" onClick={applyRange} disabled={result.loading} style={{ height: 36, borderRadius: 8 }}>
                Áp dụng
              </Button>
              <Button onClick={resetFilters} disabled={result.loading} style={{ height: 36, borderRadius: 8 }}>
                Đặt lại
              </Button>
            </Space>
          </div>
        </div>
      </section>

      {/* Period badge info */}
      <div className="reports-period">
        <Tag color="green" icon={<CalendarOutlined />}>
          {rangeText}
        </Tag>
        {range.employeeId ? (
          <Tag color="blue" icon={<UserOutlined />}>
            Nhân viên: {staffList.find(s => s.ma_nhan_vien === range.employeeId)?.ho_ten || `#${range.employeeId}`}
          </Tag>
        ) : null}
        {range.status && range.status !== 'all' ? (
          <Tag color="orange">Trạng thái: {statusMap[range.status]?.label || range.status}</Tag>
        ) : null}
        {range.search ? <Tag color="purple">Từ khóa: &quot;{range.search}&quot;</Tag> : null}
        <span>Doanh thu và lợi nhuận bán hàng mặc định tính trên các đơn đã giao thành công.</span>
      </div>

      <LoadError error={result.error} retry={result.reload} />

      <Spin spinning={result.loading}>
        {/* 5 KPI Metric Cards */}
        <div className="reports-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="reports-stat reports-stat-primary">
            <span className="reports-stat-icon">
              <DollarOutlined />
            </span>
            <span className="reports-stat-label">Tổng doanh thu bán</span>
            <strong>{data ? money(summary.tong_doanh_thu) : '—'}</strong>
            <small>{summary.tong_don_hang} đơn bán · TB {money(summary.tong_don_hang ? summary.tong_doanh_thu / summary.tong_don_hang : 0)}/đơn</small>
          </div>

          <div className="reports-stat">
            <span className="reports-stat-icon" style={{ background: '#eaf6ee', color: '#1a824e' }}>
              <RiseOutlined />
            </span>
            <span className="reports-stat-label">Lợi nhuận gộp (Lãi)</span>
            <strong style={{ color: '#1a824e' }}>{data ? money(summary.loi_nhuan_gop) : '—'}</strong>
            <small>
              Tỷ suất lợi nhuận: <b>{summary.ty_suat_loi_nhuan}%</b> · Vốn: {money(summary.tong_gia_von)}
            </small>
          </div>

          <div className="reports-stat">
            <span className="reports-stat-icon" style={{ background: '#eef3fb', color: '#2563eb' }}>
              <InboxOutlined />
            </span>
            <span className="reports-stat-label">Tổng chi phí nhập hàng</span>
            <strong style={{ color: '#2563eb' }}>{data ? money(summary.tong_chi_nhap_kho) : '—'}</strong>
            <small>
              {summary.tong_luot_nhap} phiếu nhập kho · {summary.tong_san_pham_nhap.toLocaleString('vi-VN')} SP
            </small>
          </div>

          <div className="reports-stat">
            <span className="reports-stat-icon">
              <ShoppingOutlined />
            </span>
            <span className="reports-stat-label">Sản phẩm đã bán</span>
            <strong>{data ? summary.tong_san_pham_ban.toLocaleString('vi-VN') : '—'}</strong>
            <small>Tổng số lượng mặt hàng giao thành công</small>
          </div>

          <div className="reports-stat reports-stat-warning">
            <span className="reports-stat-icon">
              <WarningOutlined />
            </span>
            <span className="reports-stat-label">Cần nhập thêm hàng</span>
            <strong>{data ? stock.length : '—'}</strong>
            <small>Mặt hàng tồn kho ≤ 5 sản phẩm</small>
          </div>
        </div>

        {/* Detailed Tabs System */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="large"
          items={[
            {
              key: 'overview',
              label: (
                <span>
                  <BarChartOutlined /> Tổng quan & Tài chính
                </span>
              ),
              children: (
                <div>
                  {/* Chart panel */}
                  <section className="reports-panel reports-chart-panel">
                    <div className="reports-panel-heading">
                      <div>
                        <h2>Xu hướng Doanh thu & Chi phí nhập kho</h2>
                        <p>So sánh doanh thu bán hàng và chi phí nhập kho theo tháng</p>
                      </div>
                      <Space>
                        <span className="reports-legend">
                          <i style={{ background: '#176b52' }} /> Doanh thu bán
                        </span>
                        <span className="reports-legend">
                          <i style={{ background: '#3b82f6' }} /> Chi nhập kho
                        </span>
                      </Space>
                    </div>

                    {chart.length ? (
                      <div className="reports-chart" aria-label="Biểu đồ so sánh doanh thu">
                        {chart.map(row => {
                          const revH = (Number(row.doanh_thu || 0) / maxRevenue) * 100;
                          const purchH = (Number(row.chi_nhap_kho || 0) / maxRevenue) * 100;
                          return (
                            <Tooltip
                              key={row.thang}
                              title={
                                <div style={{ lineHeight: 1.6 }}>
                                  <strong>Tháng {monthLabel(row.thang)}</strong>
                                  <br />
                                  💰 Doanh thu: {money(row.doanh_thu)} ({row.so_don} đơn)
                                  <br />
                                  💵 Giá vốn: {money(row.gia_von)}
                                  <br />
                                  📈 Lợi nhuận: {money(row.loi_nhuan)}
                                  <br />
                                  📦 Nhập kho: {money(row.chi_nhap_kho)} ({row.so_luot_nhap} phiếu)
                                </div>
                              }
                            >
                              <div className="reports-chart-column" tabIndex={0}>
                                <span className="reports-chart-value">{new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(row.doanh_thu))}đ</span>
                                <div className="reports-chart-track" style={{ gap: 4 }}>
                                  <div className="reports-chart-bar" style={{ height: `${Math.max(2, revH)}%`, background: '#176b52' }} />
                                  <div className="reports-chart-bar" style={{ height: `${Math.max(2, Math.min(100, purchH))}%`, background: '#3b82f6' }} />
                                </div>
                                <span className="reports-chart-label">{monthLabel(row.thang)}</span>
                              </div>
                            </Tooltip>
                          );
                        })}
                      </div>
                    ) : (
                      <Empty description="Chưa có dữ liệu kinh doanh trong khoảng thời gian này" />
                    )}
                  </section>

                  {/* Grid 2 tables: Monthly & Category breakdown */}
                  <div className="reports-detail-grid">
                    <section className="reports-panel">
                      <div className="reports-panel-heading">
                        <div>
                          <h2>Bảng kết quả tài chính theo tháng</h2>
                          <p>Chi tiết doanh thu, giá vốn, lợi nhuận và chi phí nhập kho</p>
                        </div>
                        <Tag color="cyan">{monthly.length} tháng</Tag>
                      </div>
                      <Table<Monthly>
                        size="middle"
                        rowKey="thang"
                        dataSource={monthly}
                        pagination={printing ? false : { pageSize: 6, hideOnSinglePage: true, showSizeChanger: false }}
                        scroll={{ x: 600 }}
                        locale={{ emptyText: 'Chưa có dữ liệu' }}
                        columns={[
                          { title: 'Tháng', dataIndex: 'thang', render: monthLabel },
                          { title: 'Số đơn', dataIndex: 'so_don', align: 'right' },
                          { title: 'Doanh thu', dataIndex: 'doanh_thu', align: 'right', render: v => <strong className="reports-money">{money(v)}</strong> },
                          { title: 'Giá vốn', dataIndex: 'gia_von', align: 'right', render: money },
                          { title: 'Lợi nhuận gộp', dataIndex: 'loi_nhuan', align: 'right', render: v => <span style={{ color: '#1a824e', fontWeight: 700 }}>{money(v)}</span> },
                          { title: 'Chi nhập kho', dataIndex: 'chi_nhap_kho', align: 'right', render: v => <span style={{ color: '#2563eb' }}>{money(v)}</span> },
                        ]}
                      />
                    </section>

                    <section className="reports-panel">
                      <div className="reports-panel-heading">
                        <div>
                          <h2>Doanh số theo danh mục sản phẩm</h2>
                          <p>Tỷ trọng doanh số và lợi nhuận phân bổ theo nhóm ngành</p>
                        </div>
                        <Tag color="green">{categorySales.length} danh mục</Tag>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {categorySales.map(cat => (
                          <div key={cat.ma_danh_muc} style={{ padding: '8px 12px', background: '#f8faf7', borderRadius: 10, border: '1px solid #edf2e9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <strong style={{ fontSize: 13, color: '#173c35' }}>{cat.ten_danh_muc}</strong>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#176b52' }}>{money(cat.doanh_thu)}</span>
                            </div>
                            <Progress percent={Math.round((Number(cat.doanh_thu) / maxCatRevenue) * 100)} showInfo={false} strokeColor="#258467" size="small" />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11, color: '#73857b' }}>
                              <span>
                                Đã bán: <b>{cat.so_luong_ban} SP</b> ({cat.so_don} đơn)
                              </span>
                              <span>
                                Lợi nhuận: <b style={{ color: '#1a824e' }}>{money(cat.loi_nhuan)}</b>
                              </span>
                            </div>
                          </div>
                        ))}
                        {!categorySales.length && <Empty description="Chưa có dữ liệu danh mục" />}
                      </div>
                    </section>
                  </div>

                  {/* Top Bestsellers & Low Stock */}
                  <div className="reports-detail-grid" style={{ marginTop: 22 }}>
                    <section className="reports-panel">
                      <div className="reports-panel-heading">
                        <div>
                          <h2>Top sản phẩm bán chạy nhất</h2>
                          <p>Xếp hạng theo số lượng bán và lợi nhuận gộp</p>
                        </div>
                        <Tag color="green">Top {bestsellers.length}</Tag>
                      </div>
                      <Table<Bestseller>
                        size="middle"
                        rowKey="ma_san_pham"
                        dataSource={bestsellers}
                        pagination={printing ? false : { pageSize: 5, hideOnSinglePage: true, showSizeChanger: false }}
                        scroll={{ x: 500 }}
                        locale={{ emptyText: 'Chưa có sản phẩm bán ra' }}
                        columns={[
                          {
                            title: 'Sản phẩm',
                            dataIndex: 'ten_san_pham',
                            render: (name, row) => (
                              <div className="reports-product">
                                <span className="reports-rank">{bestsellers.indexOf(row) + 1}</span>
                                <div>
                                  <strong>{name}</strong>
                                  <Progress percent={(Number(row.da_ban) / maxSold) * 100} showInfo={false} size="small" strokeColor="#258467" />
                                </div>
                              </div>
                            ),
                          },
                          { title: 'Đã bán', dataIndex: 'da_ban', align: 'right', width: 85, render: v => `${v} SP` },
                          { title: 'Doanh thu', dataIndex: 'tien_hang', align: 'right', render: money },
                          { title: 'Lợi nhuận', dataIndex: 'loi_nhuan', align: 'right', render: v => <span style={{ color: '#1a824e', fontWeight: 600 }}>{money(v)}</span> },
                        ]}
                      />
                    </section>

                    <section className="reports-panel reports-stock-panel">
                      <div className="reports-panel-heading">
                        <div>
                          <h2>
                            <WarningOutlined /> Cần nhập thêm tồn kho
                          </h2>
                          <p>Mặt hàng có tồn kho ≤ 5 sản phẩm cần nhập gấp</p>
                        </div>
                        <Tag color={stock.length ? 'orange' : 'green'}>{stock.length ? `${stock.length} mặt hàng` : 'An toàn'}</Tag>
                      </div>
                      <Table<Stock>
                        size="middle"
                        rowKey={row => `${row.ma_san_pham}:${row.ten_bien_the || ''}`}
                        dataSource={stock}
                        pagination={printing ? false : { pageSize: 5, hideOnSinglePage: true, showSizeChanger: false }}
                        scroll={{ x: 500 }}
                        locale={{ emptyText: 'Không có mặt hàng tồn kho thấp' }}
                        columns={[
                          { title: 'Sản phẩm', dataIndex: 'ten_san_pham', render: name => <strong>{name}</strong> },
                          { title: 'Biến thể', dataIndex: 'ten_bien_the', render: v => v ? <Tag color="blue">{v}</Tag> : <Tag>Tiêu chuẩn</Tag> },
                          { title: 'Tồn kho', dataIndex: 'so_luong', align: 'right', render: v => <Tag color={Number(v) === 0 ? 'red' : 'orange'}>{v} SP</Tag> },
                          { title: 'Tình trạng', dataIndex: 'so_luong', render: v => Number(v) === 0 ? <span className="reports-out-of-stock">Hết hàng</span> : 'Sắp hết hàng' },
                        ]}
                      />
                    </section>
                  </div>
                </div>
              ),
            },
            {
              key: 'sales',
              label: (
                <span>
                  <ShoppingOutlined /> Chi tiết Đơn hàng Bán ({salesDetails.length})
                </span>
              ),
              children: (
                <section className="reports-panel">
                  <div className="reports-panel-heading" style={{ flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h2>Chi tiết từng sản phẩm trong các đơn hàng bán</h2>
                      <p>Hiển thị chi tiết nhân viên bán/phụ trách, khách hàng, sản phẩm & biến thể bán, giá bán, giá vốn và lợi nhuận gộp</p>
                    </div>
                    <Space wrap>
                      <Tag color="cyan">Tổng: {salesDetails.length} dòng sản phẩm</Tag>
                      <Button icon={<DownloadOutlined />} onClick={handleExportSales}>
                        Xuất Excel Bán hàng
                      </Button>
                    </Space>
                  </div>

                  <Table<SalesDetail>
                    size="middle"
                    rowKey={(row, idx) => `${row.ma_don_hang}:${row.ma_san_pham}:${row.ma_bien_the || 0}:${idx}`}
                    dataSource={salesDetails}
                    pagination={printing ? false : { pageSize: 12, showSizeChanger: true, pageSizeOptions: ['12', '25', '50', '100'] }}
                    scroll={{ x: 1350 }}
                    locale={{ emptyText: 'Không tìm thấy dòng đơn hàng nào phù hợp bộ lọc' }}
                    summary={pageData => {
                      const totalQty = pageData.reduce((acc, row) => acc + Number(row.so_luong || 0), 0);
                      const totalRev = pageData.reduce((acc, row) => acc + Number(row.thanh_tien || 0), 0);
                      const totalProfit = pageData.reduce((acc, row) => acc + Number(row.loi_nhuan || 0), 0);
                      return (
                        <Table.Summary fixed>
                          <Table.Summary.Row style={{ background: '#f8faf8', fontWeight: 'bold' }}>
                            <Table.Summary.Cell index={0} colSpan={4}>
                              Tổng trên trang hiện tại ({pageData.length} dòng hàng)
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={4}>
                              <div style={{ textAlign: 'right' }}>{totalQty} SP</div>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={5} />
                            <Table.Summary.Cell index={6}>
                              <div style={{ textAlign: 'right', color: '#176b52' }}>{money(totalRev)}</div>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={7} />
                            <Table.Summary.Cell index={8}>
                              <div style={{ textAlign: 'right', color: '#1a824e' }}>{money(totalProfit)}</div>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={9} colSpan={3} />
                          </Table.Summary.Row>
                        </Table.Summary>
                      );
                    }}
                    columns={[
                      {
                        title: 'Đơn hàng',
                        dataIndex: 'ma_don_hang',
                        width: 140,
                        fixed: 'left',
                        render: (id, row) => (
                          <div>
                            <Tag color="geekblue" style={{ fontWeight: 700 }}>
                              #DH-{id}
                            </Tag>
                            <div style={{ fontSize: 11, color: '#82938a', marginTop: 3 }}>{formatDateTime(row.ngay_dat)}</div>
                          </div>
                        ),
                      },
                      {
                        title: 'Nhân viên bán',
                        dataIndex: 'ten_nhan_vien',
                        width: 180,
                        render: (name, row) =>
                          name ? (
                            <div>
                              <Tag color="purple" icon={<UserOutlined />}>
                                {name}
                              </Tag>
                              <div style={{ fontSize: 11, color: '#76877f', marginTop: 2 }}>{row.chuc_vu_nhan_vien || 'Nhân viên bán hàng'}</div>
                            </div>
                          ) : (
                            <Tag color="default">Đặt trực tuyến</Tag>
                          ),
                      },
                      {
                        title: 'Khách hàng',
                        dataIndex: 'ho_ten_nguoi_nhan',
                        width: 200,
                        render: (name, row) => (
                          <div>
                            <strong>{name}</strong>
                            <div style={{ fontSize: 11, color: '#687870' }}>{row.so_dien_thoai}</div>
                            <div style={{ fontSize: 11, color: '#889890', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.dia_chi_giao_hang}>
                              {row.dia_chi_giao_hang}
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: 'Sản phẩm & Biến thể',
                        dataIndex: 'ten_san_pham',
                        width: 260,
                        render: (name, row) => (
                          <div>
                            <div style={{ fontWeight: 600, color: '#183c35' }}>{name}</div>
                            {row.ten_bien_the ? (
                              <Tag color="blue" style={{ marginTop: 4, borderRadius: 6 }}>
                                🏷️ {row.ten_bien_the}
                              </Tag>
                            ) : (
                              <Tag style={{ marginTop: 4, color: '#7d8f86' }}>Tiêu chuẩn</Tag>
                            )}
                          </div>
                        ),
                      },
                      {
                        title: 'SL Bán',
                        dataIndex: 'so_luong',
                        width: 75,
                        align: 'right',
                        render: v => <strong>{v}</strong>,
                      },
                      {
                        title: 'Tồn trong kho',
                        dataIndex: 'so_luong_ton',
                        width: 105,
                        align: 'right',
                        render: v => (
                          <Tag
                            color={Number(v) <= 0 ? 'red' : Number(v) <= 5 ? 'volcano' : 'green'}
                            style={{ fontWeight: 700 }}
                          >
                            {v != null ? Number(v).toLocaleString('vi-VN') : '0'}
                          </Tag>
                        ),
                      },
                      {
                        title: 'Đơn giá',
                        dataIndex: 'don_gia',
                        width: 110,
                        align: 'right',
                        render: money,
                      },
                      {
                        title: 'Thành tiền',
                        dataIndex: 'thanh_tien',
                        width: 125,
                        align: 'right',
                        render: v => <strong style={{ color: '#176b52' }}>{money(v)}</strong>,
                      },
                      {
                        title: 'Giá vốn',
                        dataIndex: 'gia_nhap',
                        width: 110,
                        align: 'right',
                        render: money,
                      },
                      {
                        title: 'Lợi nhuận gộp',
                        dataIndex: 'loi_nhuan',
                        width: 125,
                        align: 'right',
                        render: v => <strong style={{ color: '#1a824e' }}>{money(v)}</strong>,
                      },
                      {
                        title: 'Trạng thái',
                        dataIndex: 'trang_thai',
                        width: 120,
                        render: v => <Tag color={statusMap[v]?.color || 'default'}>{statusMap[v]?.label || v}</Tag>,
                      },
                      {
                        title: 'Thanh toán & Voucher',
                        dataIndex: 'phuong_thuc_thanh_toan',
                        width: 180,
                        render: (pm, row) => (
                          <div style={{ fontSize: 12 }}>
                            <div>{paymentMap[pm] || pm}</div>
                            {row.voucher_code ? (
                              <Tag color="magenta" style={{ marginTop: 3 }}>
                                🎟️ {row.voucher_code} (-{money(row.giam_gia_don)})
                              </Tag>
                            ) : null}
                          </div>
                        ),
                      },
                    ]}
                  />
                </section>
              ),
            },
            {
              key: 'purchase',
              label: (
                <span>
                  <InboxOutlined /> Chi tiết Nhập hàng ({purchaseDetails.length})
                </span>
              ),
              children: (
                <section className="reports-panel">
                  <div className="reports-panel-heading" style={{ flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h2>Nhật ký & Chi tiết các lần nhập hàng</h2>
                      <p>Hiển thị chi tiết nhân viên nào nhập, nhập biến thể gì, sản phẩm gì, số lượng, đơn giá nhập, tổng chi phí và nhà cung cấp</p>
                    </div>
                    <Space wrap>
                      <Tag color="blue">Tổng: {purchaseDetails.length} phiếu nhập</Tag>
                      <Button icon={<DownloadOutlined />} onClick={handleExportPurchase}>
                        Xuất Excel Nhập hàng
                      </Button>
                    </Space>
                  </div>

                  <Table<PurchaseDetail>
                    size="middle"
                    rowKey="ma_nhap"
                    dataSource={purchaseDetails}
                    pagination={printing ? false : { pageSize: 12, showSizeChanger: true, pageSizeOptions: ['12', '25', '50', '100'] }}
                    scroll={{ x: 1250 }}
                    locale={{ emptyText: 'Không tìm thấy phiếu nhập hàng nào phù hợp bộ lọc' }}
                    summary={pageData => {
                      const totalQty = pageData.reduce((acc, row) => acc + Number(row.so_luong || 0), 0);
                      const totalCost = pageData.reduce((acc, row) => acc + Number(row.thanh_tien || 0), 0);
                      return (
                        <Table.Summary fixed>
                          <Table.Summary.Row style={{ background: '#f8faf8', fontWeight: 'bold' }}>
                            <Table.Summary.Cell index={0} colSpan={4}>
                              Tổng trên trang hiện tại ({pageData.length} phiếu nhập)
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={4}>
                              <div style={{ textAlign: 'right' }}>{totalQty.toLocaleString('vi-VN')} SP</div>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={5} />
                            <Table.Summary.Cell index={6}>
                              <div style={{ textAlign: 'right', color: '#2563eb' }}>{money(totalCost)}</div>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={7} />
                          </Table.Summary.Row>
                        </Table.Summary>
                      );
                    }}
                    columns={[
                      {
                        title: 'Mã phiếu',
                        dataIndex: 'ma_nhap',
                        width: 120,
                        fixed: 'left',
                        render: (id, row) => (
                          <div>
                            <Tag color="cyan" style={{ fontWeight: 700 }}>
                              #NK-{id}
                            </Tag>
                            <div style={{ fontSize: 11, color: '#82938a', marginTop: 3 }}>{formatDateTime(row.ngay_nhap)}</div>
                          </div>
                        ),
                      },
                      {
                        title: 'Nhân viên nhập hàng',
                        dataIndex: 'ten_nhan_vien',
                        width: 200,
                        render: (name, row) => (
                          <div>
                            <Tag color="blue" icon={<UserOutlined />}>
                              {name}
                            </Tag>
                            <div style={{ fontSize: 11, color: '#76877f', marginTop: 2 }}>{row.chuc_vu_nhan_vien || 'Nhân viên kho'}</div>
                          </div>
                        ),
                      },
                      {
                        title: 'Nhà cung cấp / Đối tác',
                        dataIndex: 'nha_cung_cap',
                        width: 240,
                        render: name => (
                          <div>
                            <ShopOutlined style={{ color: '#2563eb', marginRight: 6 }} />
                            <strong style={{ color: '#1c3d36' }}>{name || 'Nhà phân phối chính hãng'}</strong>
                          </div>
                        ),
                      },
                      {
                        title: 'Sản phẩm & Biến thể nhập',
                        dataIndex: 'ten_san_pham',
                        width: 280,
                        render: (name, row) => (
                          <div>
                            <div style={{ fontWeight: 600, color: '#183c35' }}>{name}</div>
                            {row.ten_bien_the ? (
                              <Tag color="cyan" style={{ marginTop: 4, borderRadius: 6 }}>
                                📦 Biến thể: {row.ten_bien_the}
                              </Tag>
                            ) : (
                              <Tag style={{ marginTop: 4, color: '#7d8f86' }}>Sản phẩm tiêu chuẩn</Tag>
                            )}
                          </div>
                        ),
                      },
                      {
                        title: 'Số lượng nhập',
                        dataIndex: 'so_luong',
                        width: 120,
                        align: 'right',
                        render: v => <Tag color="green" style={{ fontWeight: 700, fontSize: 12 }}>+{Number(v).toLocaleString('vi-VN')} SP</Tag>,
                      },
                      {
                        title: 'Đơn giá nhập',
                        dataIndex: 'gia_nhap',
                        width: 130,
                        align: 'right',
                        render: money,
                      },
                      {
                        title: 'Tổng tiền nhập',
                        dataIndex: 'thanh_tien',
                        width: 150,
                        align: 'right',
                        render: v => <strong style={{ color: '#2563eb' }}>{money(v)}</strong>,
                      },
                      {
                        title: 'Ghi chú',
                        dataIndex: 'ghi_chu',
                        width: 200,
                        render: v => v ? <span style={{ color: '#687971', fontSize: 12 }}>{v}</span> : <span style={{ color: '#a2b3aa' }}>—</span>,
                      },
                    ]}
                  />
                </section>
              ),
            },
            {
              key: 'staff',
              label: (
                <span>
                  <TeamOutlined /> Hiệu suất Nhân viên ({staffSalesReport.length + staffPurchaseReport.length})
                </span>
              ),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  {/* Staff Sales Table */}
                  <section className="reports-panel">
                    <div className="reports-panel-heading">
                      <div>
                        <h2>Hiệu suất Bán hàng của Nhân viên</h2>
                        <p>Thống kê số đơn hàng đã hoàn tất, doanh số đem lại và lợi nhuận gộp tạo ra cho cửa hàng</p>
                      </div>
                      <Tag color="green">{staffSalesReport.length} nhân viên bán hàng</Tag>
                    </div>

                    <Table<StaffSalesReport>
                      size="middle"
                      rowKey="ma_nhan_vien"
                      dataSource={staffSalesReport}
                      pagination={printing ? false : { pageSize: 8, hideOnSinglePage: true, showSizeChanger: false }}
                      scroll={{ x: 800 }}
                      locale={{ emptyText: 'Chưa có dữ liệu bán hàng theo nhân viên' }}
                      columns={[
                        {
                          title: 'Hạng',
                          width: 60,
                          align: 'center',
                          render: (_v, _row, idx) => <span className="reports-rank">{idx + 1}</span>,
                        },
                        {
                          title: 'Nhân viên',
                          dataIndex: 'ten_nhan_vien',
                          render: (name, row) => (
                            <div>
                              <strong>{name}</strong>
                              <div style={{ fontSize: 11, color: '#7b8c83' }}>
                                {row.chuc_vu} {row.so_dien_thoai ? `· ${row.so_dien_thoai}` : ''}
                              </div>
                            </div>
                          ),
                        },
                        {
                          title: 'Số đơn bán',
                          dataIndex: 'so_don',
                          align: 'right',
                          width: 110,
                          render: v => <Tag color="blue">{v} đơn</Tag>,
                        },
                        {
                          title: 'Số SP bán',
                          dataIndex: 'so_san_pham',
                          align: 'right',
                          width: 100,
                          render: v => `${v} SP`,
                        },
                        {
                          title: 'Tổng doanh thu',
                          dataIndex: 'doanh_thu',
                          align: 'right',
                          render: v => <strong className="reports-money">{money(v)}</strong>,
                        },
                        {
                          title: 'Lợi nhuận tạo ra',
                          dataIndex: 'loi_nhuan',
                          align: 'right',
                          render: v => <strong style={{ color: '#1a824e' }}>{money(v)}</strong>,
                        },
                      ]}
                    />
                  </section>

                  {/* Staff Purchase Table */}
                  <section className="reports-panel">
                    <div className="reports-panel-heading">
                      <div>
                        <h2>Hoạt động Nhập kho theo Nhân viên</h2>
                        <p>Thống kê số lần tiếp nhận hàng, số lượng và tổng giá trị hàng hóa nhập kho</p>
                      </div>
                      <Tag color="blue">{staffPurchaseReport.length} nhân viên nhập hàng</Tag>
                    </div>

                    <Table<StaffPurchaseReport>
                      size="middle"
                      rowKey="ma_tai_khoan"
                      dataSource={staffPurchaseReport}
                      pagination={printing ? false : { pageSize: 8, hideOnSinglePage: true, showSizeChanger: false }}
                      scroll={{ x: 750 }}
                      locale={{ emptyText: 'Chưa có dữ liệu nhập kho theo nhân viên' }}
                      columns={[
                        {
                          title: 'Nhân viên phụ trách',
                          dataIndex: 'ten_nhan_vien',
                          render: (name, row) => (
                            <div>
                              <strong>{name}</strong>
                              <div style={{ fontSize: 11, color: '#7b8c83' }}>{row.chuc_vu}</div>
                            </div>
                          ),
                        },
                        {
                          title: 'Số phiếu nhập',
                          dataIndex: 'so_lan_nhap',
                          align: 'right',
                          render: v => <Tag color="cyan">{v} lần nhập</Tag>,
                        },
                        {
                          title: 'Tổng số lượng SP nhập',
                          dataIndex: 'tong_so_luong',
                          align: 'right',
                          render: v => <strong>{Number(v).toLocaleString('vi-VN')} SP</strong>,
                        },
                        {
                          title: 'Tổng giá trị hàng nhập',
                          dataIndex: 'tong_tien_nhap',
                          align: 'right',
                          render: v => <strong style={{ color: '#2563eb' }}>{money(v)}</strong>,
                        },
                      ]}
                    />
                  </section>
                </div>
              ),
            },
          ]}
        />
      </Spin>
    </div>
  );
}
