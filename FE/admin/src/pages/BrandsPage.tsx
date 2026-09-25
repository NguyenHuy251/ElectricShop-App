import ResourcePage from '../components/ResourcePage';
import { brandApi } from '../api/brand.api';
import type { Brand } from '../types';
export default function BrandsPage() {
  return <ResourcePage<Brand> title="Thương hiệu" idKey="ma_thuong_hieu" api={brandApi} searchKeys={['ten_thuong_hieu', 'quoc_gia']}
    columns={[{ title: 'Mã', dataIndex: 'ma_thuong_hieu' }, { title: 'Tên thương hiệu', dataIndex: 'ten_thuong_hieu' }, { title: 'Quốc gia', dataIndex: 'quoc_gia' }, { title: 'Mô tả', dataIndex: 'mo_ta' }]}
    fields={[{ name: 'ten_thuong_hieu', label: 'Tên thương hiệu', required: true, rules: [{ whitespace: true, message: 'Tên không được để trống' }] }, { name: 'quoc_gia', label: 'Quốc gia' }, { name: 'mo_ta', label: 'Mô tả', kind: 'textarea' }]} />;
}
