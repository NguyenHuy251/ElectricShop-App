import { Button, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SettingOutlined } from '@ant-design/icons';
import ResourcePage from '../components/ResourcePage';
import { categoryApi } from '../api/category.api';
import type { Category } from '../types';

export default function CategoriesPage() {
  const navigate = useNavigate();

  return (
    <ResourcePage<Category>
      title="Danh mục"
      idKey="ma_danh_muc"
      api={categoryApi}
      searchKeys={['ten_danh_muc', 'mo_ta']}
      defaults={{ trang_thai: true }}
      prepare={row => ({ ...row, trang_thai: Boolean(row.trang_thai) })}
      columns={[
        { title: 'Mã', dataIndex: 'ma_danh_muc', width: 70 },
        { title: 'Tên danh mục', dataIndex: 'ten_danh_muc', render: text => <strong>{text}</strong> },
        { title: 'Mô tả', dataIndex: 'mo_ta' },
        {
          title: 'Thông số kỹ thuật',
          key: 'specs',
          width: 170,
          render: (_, row) => (
            <Tooltip title="Cấu hình thông số"><Button
              type="link"
              aria-label="Cấu hình thông số"
              icon={<SettingOutlined />}
              onClick={() => navigate(`/category-specifications?category=${row.ma_danh_muc}`)}
            /></Tooltip>
          ),
        },
        {
          title: 'Trạng thái',
          dataIndex: 'trang_thai',
          width: 110,
          render: value => (value ? 'Hoạt động' : 'Tắt'),
        },
      ]}
      fields={[
        {
          name: 'ten_danh_muc',
          label: 'Tên danh mục',
          required: true,
          rules: [{ whitespace: true, message: 'Tên không được để trống' }],
        },
        { name: 'mo_ta', label: 'Mô tả', kind: 'textarea' },
        { name: 'trang_thai', label: 'Hoạt động', kind: 'switch' },
      ]}
    />
  );
}
