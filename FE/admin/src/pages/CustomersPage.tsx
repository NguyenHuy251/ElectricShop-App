import { Descriptions } from 'antd';
import ResourcePage from '../components/ResourcePage';
import { customerApi } from '../api/customer.api';
import { useAuth } from '../auth/AuthContext';
import { dateTime, labels, options, Status } from '../utils/format';
import type { User } from '../types';
export default function CustomersPage() {
  const { user } = useAuth();
  return <ResourcePage<User> title="Khách hàng / Tài khoản" idKey="ma_tai_khoan" api={customerApi} searchKeys={['ho_ten', 'ten_dang_nhap', 'email', 'so_dien_thoai']}
    filter={{ key: 'vai_tro', options: options(['KhachHang', 'NhanVien', 'Admin']), initial: 'KhachHang' }} canModify={row => row.ma_tai_khoan !== user?.ma_tai_khoan}
    columns={[{ title: 'Họ tên', dataIndex: 'ho_ten' }, { title: 'Tên đăng nhập', dataIndex: 'ten_dang_nhap' }, { title: 'Email', dataIndex: 'email' }, { title: 'Điện thoại', dataIndex: 'so_dien_thoai' }, { title: 'Vai trò', dataIndex: 'vai_tro', render: value => labels[value] }, { title: 'Trạng thái', dataIndex: 'trang_thai', render: value => <Status value={value} /> }]}
    fields={[{ name: 'ho_ten', label: 'Họ tên', required: true, rules: [{ whitespace: true, message: 'Nhập họ tên' }] }, { name: 'email', label: 'Email', required: true, rules: [{ type: 'email', message: 'Email không hợp lệ' }] }, { name: 'so_dien_thoai', label: 'Số điện thoại' }, { name: 'dia_chi', label: 'Địa chỉ', kind: 'textarea' }, { name: 'trang_thai', label: 'Trạng thái tài khoản', kind: 'select', required: true, options: options(['HoatDong', 'Khoa']) }]}
    details={row => <Descriptions column={1} bordered items={[['Họ tên', row.ho_ten], ['Tên đăng nhập', row.ten_dang_nhap], ['Email', row.email], ['Điện thoại', row.so_dien_thoai], ['Địa chỉ', row.dia_chi], ['Vai trò', labels[row.vai_tro]], ['Trạng thái', labels[row.trang_thai]], ['Ngày tạo', dateTime(row.ngay_tao)]].map(([label, children]) => ({ key: String(label), label, children: children || '—' }))} />} />;
}
