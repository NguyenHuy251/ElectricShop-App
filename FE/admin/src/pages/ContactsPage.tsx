import { Descriptions } from 'antd';
import ResourcePage from '../components/ResourcePage';
import { contactApi } from '../api/contact.api';
import { dateTime, labels, options, Status } from '../utils/format';
import type { Contact } from '../types';
const contactManagementApi = { list: contactApi.list, get: contactApi.get, update: contactApi.update, remove: contactApi.remove };
export default function ContactsPage() {
  return <ResourcePage<Contact> title="Liên hệ" idKey="ma_lien_he" api={contactManagementApi} searchKeys={['ho_ten', 'email', 'tieu_de']} filter={{ key: 'trang_thai', options: options(['ChuaXuLy', 'DangXuLy', 'DaXuLy']) }}
    columns={[{ title: 'Họ tên', dataIndex: 'ho_ten' }, { title: 'Email', dataIndex: 'email' }, { title: 'Điện thoại', dataIndex: 'so_dien_thoai' }, { title: 'Tiêu đề', dataIndex: 'tieu_de' }, { title: 'Ngày gửi', dataIndex: 'ngay_gui', render: dateTime }, { title: 'Trạng thái', dataIndex: 'trang_thai', render: value => <Status value={value} /> }]}
    fields={[{ name: 'trang_thai', label: 'Trạng thái xử lý', kind: 'select', required: true, options: options(['ChuaXuLy', 'DangXuLy', 'DaXuLy']) }]}
    details={row => <Descriptions column={1} bordered items={[['Họ tên', row.ho_ten], ['Email', row.email], ['Điện thoại', row.so_dien_thoai], ['Tiêu đề', row.tieu_de], ['Nội dung', row.noi_dung], ['Ngày gửi', dateTime(row.ngay_gui)], ['Trạng thái', labels[row.trang_thai]]].map(([label, children]) => ({ key: label, label, children: <span style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{children || '—'}</span> }))} />} />;
}
