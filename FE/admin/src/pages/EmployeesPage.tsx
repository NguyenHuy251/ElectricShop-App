import { useCallback } from 'react';
import ResourcePage from '../components/ResourcePage';
import LoadError from '../components/LoadError';
import { employeeApi } from '../api/employee.api';
import { customerApi } from '../api/customer.api';
import { useLoad } from '../hooks/useLoad';
import { dateTime, money, options, Status } from '../utils/format';
import type { Employee } from '../types';
export default function EmployeesPage() {
  const loader = useCallback(() => customerApi.list(), []);
  const accounts = useLoad(loader);
  return <ResourcePage<Employee> title="Nhân viên" idKey="ma_nhan_vien" api={employeeApi} searchKeys={['ho_ten', 'email', 'so_dien_thoai', 'chuc_vu']} defaults={{ trang_thai: 'DangLam', luong: 0 }}
    extra={<LoadError error={accounts.error} retry={accounts.reload} />} filter={{ key: 'trang_thai', options: options(['DangLam', 'NghiLam']) }} prepare={row => ({ ...row, ngay_vao_lam: row.ngay_vao_lam?.slice(0, 10) })}
    columns={[{ title: 'Họ tên', dataIndex: 'ho_ten' }, { title: 'Tài khoản', dataIndex: 'ma_tai_khoan', render: value => accounts.data?.data?.find(a => a.ma_tai_khoan === value)?.ten_dang_nhap || value || 'Chưa liên kết' }, { title: 'Chức vụ', dataIndex: 'chuc_vu' }, { title: 'Ngày vào làm', dataIndex: 'ngay_vao_lam', render: dateTime }, { title: 'Lương', dataIndex: 'luong', render: money }, { title: 'Trạng thái', dataIndex: 'trang_thai', render: value => <Status value={value} /> }]}
    fields={[{ name: 'ho_ten', label: 'Họ tên', required: true, rules: [{ whitespace: true, message: 'Nhập họ tên' }] }, { name: 'ma_tai_khoan', label: 'Tài khoản liên kết', kind: 'select', options: (accounts.data?.data || []).filter(a => a.vai_tro !== 'KhachHang').map(a => ({ value: a.ma_tai_khoan, label: a.ten_dang_nhap })) }, { name: 'chuc_vu', label: 'Chức vụ' }, { name: 'email', label: 'Email', rules: [{ type: 'email', message: 'Email không hợp lệ' }] }, { name: 'so_dien_thoai', label: 'Số điện thoại' }, { name: 'ngay_vao_lam', label: 'Ngày vào làm', kind: 'date' }, { name: 'luong', label: 'Lương', kind: 'number' }, { name: 'trang_thai', label: 'Trạng thái', kind: 'select', required: true, options: options(['DangLam', 'NghiLam']) }]} />;
}
