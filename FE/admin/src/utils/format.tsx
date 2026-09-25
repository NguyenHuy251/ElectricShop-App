import { Tag } from 'antd';

export const money = (value: number | string | null | undefined) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));
export const dateTime = (value?: string | null) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleString('vi-VN') : '—';
export const labels: Record<string, string> = {
  Admin: 'Quản trị viên', NhanVien: 'Nhân viên', KhachHang: 'Khách hàng',
  DangBan: 'Đang bán', HetHang: 'Hết hàng', NgungBan: 'Ngừng bán',
  ChoXacNhan: 'Chờ xác nhận', DaXacNhan: 'Đã xác nhận', DangGiao: 'Đang giao', DaGiao: 'Đã giao', DaHuy: 'Đã hủy',
  HoatDong: 'Hoạt động', Khoa: 'Đã khóa', DangLam: 'Đang làm', NghiLam: 'Nghỉ làm',
  ChuaXuLy: 'Chưa xử lý', DangXuLy: 'Đang xử lý', DaXuLy: 'Đã xử lý',
  TienMat: 'Tiền mặt', ChuyenKhoan: 'Chuyển khoản', ThanhToanKhiNhanHang: 'Thanh toán khi nhận hàng',
};
export const options = (values: string[]) => values.map(value => ({ value, label: labels[value] || value }));
export function Status({ value }: { value: string }) {
  const color = ['DaGiao', 'DaXuLy', 'HoatDong', 'DangLam', 'DangBan'].includes(value) ? 'green' : ['DaHuy', 'Khoa', 'NghiLam', 'NgungBan'].includes(value) ? 'red' : ['ChoXacNhan', 'ChuaXuLy', 'HetHang'].includes(value) ? 'gold' : 'blue';
  return <Tag color={color}>{labels[value] || value}</Tag>;
}
