import { useCallback, useRef, useState } from 'react';
import { App, Button, Descriptions, Drawer, Empty, Input, Select, Space, Table } from 'antd';
import { orderApi } from '../api/order.api';
import { useLoad } from '../hooks/useLoad';
import LoadError from '../components/LoadError';
import { errorMessage } from '../utils/errors';
import { dateTime, labels, money, options, Status } from '../utils/format';
import type { Order } from '../types';
export const transitions: Record<Order['trang_thai'], Order['trang_thai'][]> = { ChoXacNhan: ['DaXacNhan', 'DaHuy'], DaXacNhan: ['DangGiao', 'DaHuy'], DangGiao: ['DaGiao', 'DaHuy'], DaGiao: [], DaHuy: [] };
export default function OrdersPage() {
  const { message, modal } = App.useApp();
  const result = useLoad(useCallback(() => orderApi.list(), []));
  const [search, setSearch] = useState(''); const [status, setStatus] = useState<string>(); const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Order | null>(null); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const run = async (action: () => Promise<unknown>, success?: string) => {
    if (lock.current) throw new Error('Đang xử lý'); lock.current = true; setBusy(true);
    try { await action(); if (success) { message.success(success); await result.reload(); } }
    catch (e) { message.error(errorMessage(e)); throw e; } finally { lock.current = false; setBusy(false); }
  };
  const rows = (result.data?.data || []).filter(row => (!status || row.trang_thai === status) && `${row.ma_don_hang} ${row.ho_ten_nguoi_nhan}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));
  return <><h1 className="page-title">Đơn hàng</h1><LoadError error={result.error} retry={result.reload} /><div className="card mt"><Space wrap className="toolbar"><Input.Search placeholder="Mã đơn hoặc người nhận" allowClear onChange={e => { setSearch(e.target.value); setPage(1); }} /><Select placeholder="Trạng thái" allowClear style={{ minWidth: 180 }} options={options(Object.keys(transitions))} onChange={value => { setStatus(value); setPage(1); }} /><Button onClick={result.reload}>Làm mới</Button></Space>
    <Table<Order> rowKey="ma_don_hang" loading={result.loading} dataSource={rows} scroll={{ x: 1200 }} locale={{ emptyText: <Empty description="Chưa có đơn hàng" /> }} pagination={{ current: Math.min(page, Math.max(1, Math.ceil(rows.length / 10))), pageSize: 10, onChange: setPage, showSizeChanger: false }} columns={[
      { title: 'Mã', dataIndex: 'ma_don_hang' }, { title: 'Tài khoản đặt', render: (_, row) => row.ten_dang_nhap || row.ma_tai_khoan }, { title: 'Người nhận', dataIndex: 'ho_ten_nguoi_nhan' }, { title: 'Điện thoại', dataIndex: 'so_dien_thoai' }, { title: 'Địa chỉ', dataIndex: 'dia_chi_giao_hang' }, { title: 'Tổng tiền', dataIndex: 'tong_tien', render: money }, { title: 'Ngày đặt', dataIndex: 'ngay_dat', render: dateTime }, { title: 'Trạng thái', dataIndex: 'trang_thai', render: value => <Status value={value} /> },
      { title: 'Thao tác', render: (_, row) => <Space wrap><Button disabled={busy} onClick={() => { void run(async () => setDetail(await orderApi.get(row.ma_don_hang))).catch(() => {}); }}>Chi tiết</Button><Select aria-label={`Đổi trạng thái đơn ${row.ma_don_hang}`} placeholder="Đổi trạng thái" value={undefined} style={{ width: 155 }} disabled={busy || !transitions[row.trang_thai]?.length} options={options(transitions[row.trang_thai] || [])} onChange={(value: Order['trang_thai']) => modal.confirm({ title: `Chuyển đơn #${row.ma_don_hang} sang ${labels[value]}?`, content: value === 'DaHuy' ? 'Hàng trong đơn sẽ được hoàn lại tồn kho.' : undefined, okText: 'Xác nhận', cancelText: 'Hủy', onOk: () => run(() => orderApi.status(row.ma_don_hang, value), 'Đã cập nhật trạng thái') })} /><Button danger disabled={busy || !['DaGiao', 'DaHuy'].includes(row.trang_thai)} onClick={() => modal.confirm({ title: `Xóa đơn #${row.ma_don_hang}?`, content: 'Chỉ xóa đơn đã giao hoặc đã hủy. Không thể khôi phục dữ liệu.', okText: 'Xóa', cancelText: 'Hủy', okButtonProps: { danger: true }, onOk: () => run(() => orderApi.remove(row.ma_don_hang), 'Đã xóa đơn hàng') })}>Xóa</Button></Space> },
    ]} /></div><Drawer title={`Đơn hàng #${detail?.ma_don_hang || ''}`} open={!!detail} onClose={() => setDetail(null)} width={Math.min(800, window.innerWidth)}>{detail && <><Descriptions column={1} bordered items={[
      ['Tài khoản đặt', detail.ten_dang_nhap || String(detail.ma_tai_khoan)], ['Người nhận', detail.ho_ten_nguoi_nhan], ['Điện thoại', detail.so_dien_thoai], ['Địa chỉ', detail.dia_chi_giao_hang], ['Ngày đặt', dateTime(detail.ngay_dat)], ['Thanh toán', labels[detail.phuong_thuc_thanh_toan]], ['Trạng thái', labels[detail.trang_thai]], ['Ghi chú', detail.ghi_chu], ['Tổng tiền', money(detail.tong_tien)],
    ].map(([label, children]) => ({ key: String(label), label, children: children || '—' }))} /><Table className="mt" rowKey="ma_san_pham" dataSource={detail.items || []} pagination={false} scroll={{ x: 500 }} columns={[{ title: 'Sản phẩm', dataIndex: 'ten_san_pham' }, { title: 'Số lượng', dataIndex: 'so_luong' }, { title: 'Đơn giá', dataIndex: 'don_gia', render: money }, { title: 'Thành tiền', dataIndex: 'thanh_tien', render: money }]} /></>}</Drawer></>;
}
