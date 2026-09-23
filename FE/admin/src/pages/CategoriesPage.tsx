import ResourcePage from '../components/ResourcePage';
import { categoryApi } from '../api/category.api';
import type { Category } from '../types';
export default function CategoriesPage() {
  return <ResourcePage<Category> title="Danh mục" idKey="ma_danh_muc" api={categoryApi} searchKeys={['ten_danh_muc', 'mo_ta']} defaults={{ trang_thai: true }} prepare={row => ({ ...row, trang_thai: Boolean(row.trang_thai) })}
    columns={[{ title: 'Mã', dataIndex: 'ma_danh_muc' }, { title: 'Tên danh mục', dataIndex: 'ten_danh_muc' }, { title: 'Mô tả', dataIndex: 'mo_ta' }, { title: 'Trạng thái', dataIndex: 'trang_thai', render: value => value ? 'Hoạt động' : 'Tắt' }]}
    fields={[{ name: 'ten_danh_muc', label: 'Tên danh mục', required: true, rules: [{ whitespace: true, message: 'Tên không được để trống' }] }, { name: 'mo_ta', label: 'Mô tả', kind: 'textarea' }, { name: 'trang_thai', label: 'Hoạt động', kind: 'switch' }]} />;
}
