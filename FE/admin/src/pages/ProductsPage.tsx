import { useCallback, useRef, useState } from 'react';
import { App, Button, Empty, Form, Image, Input, InputNumber, Modal, Select, Space, Table } from 'antd';
import { productApi } from '../api/product.api';
import { categoryApi } from '../api/category.api';
import { brandApi } from '../api/brand.api';
import { useLoad } from '../hooks/useLoad';
import LoadError from '../components/LoadError';
import { errorMessage, fieldErrors } from '../utils/errors';
import { money, options, Status } from '../utils/format';
import type { Product, ProductDetails, ProductInput } from '../types';

const detailFields = [['cong_suat', 'Công suất'], ['dung_tich', 'Dung tích'], ['kich_thuoc', 'Kích thước'], ['mau_sac', 'Màu sắc'], ['xuat_xu', 'Xuất xứ'], ['thong_so_khac', 'Thông số khác']];
export default function ProductsPage() {
  const { message, modal } = App.useApp();
  const [query, setQuery] = useState({ search: '', page: 1, limit: 10, ma_danh_muc: undefined as number | undefined, ma_thuong_hieu: undefined as number | undefined });
  const loader = useCallback(() => productApi.list(query), [query]);
  const products = useLoad(loader);
  const references = useLoad(useCallback(async () => { const [categories, brands] = await Promise.all([categoryApi.list(), brandApi.list()]); return { categories: categories.data || [], brands: brands.data || [] }; }, []));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [form] = Form.useForm<ProductInput>();
  const imageUrl = Form.useWatch('hinh_anh', form);
  const edit = async (row: Product) => {
    if (lock.current) return; lock.current = true; setBusy(true);
    try {
      const product = await productApi.get(row.ma_san_pham);
      const details: ProductDetails = typeof product.chi_tiet_san_pham === 'string' ? JSON.parse(product.chi_tiet_san_pham) : product.chi_tiet_san_pham || {};
      form.resetFields(); form.setFieldsValue({ ...product, ...details, gia_ban: Number(product.gia_ban), gia_nhap: Number(product.gia_nhap || 0) }); setEditing(row.ma_san_pham); setOpen(true);
    } catch (e) { message.error(errorMessage(e)); } finally { lock.current = false; setBusy(false); }
  };
  const remove = (row: Product) => modal.confirm({ title: `Xóa ${row.ten_san_pham}?`, content: 'Sản phẩm đã có trong đơn hàng sẽ không thể xóa.', okText: 'Xóa', cancelText: 'Hủy', okButtonProps: { danger: true }, onOk: async () => {
    if (lock.current) throw new Error('Đang xử lý'); lock.current = true; setBusy(true);
    try { await productApi.remove(row.ma_san_pham); message.success('Đã xóa sản phẩm'); if (products.data?.data.length === 1 && query.page > 1) setQuery(q => ({ ...q, page: q.page - 1 })); else await products.reload(); }
    catch (e) { message.error(errorMessage(e)); throw e; } finally { lock.current = false; setBusy(false); }
  } });
  return <><div className="page-heading"><h1 className="page-title">Sản phẩm</h1><Button type="primary" disabled={busy || references.loading || !!references.error} onClick={() => { form.resetFields(); form.setFieldsValue({ trang_thai: 'DangBan', gia_nhap: 0, so_luong: 0, bao_hanh: 12 }); setEditing(null); setOpen(true); }}>Thêm sản phẩm</Button></div>
    <LoadError error={products.error} retry={products.reload} /><LoadError error={references.error} retry={references.reload} />
    <div className="card"><Space wrap className="toolbar"><Input.Search placeholder="Tên hoặc mã sản phẩm" aria-label="Tìm sản phẩm" allowClear onSearch={search => setQuery(q => ({ ...q, search, page: 1 }))} />
      <Select aria-label="Lọc danh mục" placeholder="Danh mục" allowClear style={{ minWidth: 170 }} options={references.data?.categories.map(c => ({ value: c.ma_danh_muc, label: c.ten_danh_muc }))} onChange={ma_danh_muc => setQuery(q => ({ ...q, ma_danh_muc, page: 1 }))} />
      <Select aria-label="Lọc thương hiệu" placeholder="Thương hiệu" allowClear style={{ minWidth: 170 }} options={references.data?.brands.map(b => ({ value: b.ma_thuong_hieu, label: b.ten_thuong_hieu }))} onChange={ma_thuong_hieu => setQuery(q => ({ ...q, ma_thuong_hieu, page: 1 }))} /><Button onClick={products.reload}>Làm mới</Button>
    </Space><Table<Product> rowKey="ma_san_pham" loading={products.loading} dataSource={products.data?.data || []} scroll={{ x: 1000 }} locale={{ emptyText: <Empty description="Chưa có sản phẩm" /> }} pagination={{ current: query.page, pageSize: query.limit, total: products.data?.pagination?.total || 0, showSizeChanger: true, onChange: (page, limit) => setQuery(q => ({ ...q, page: limit !== q.limit ? 1 : page, limit })) }} columns={[
      { title: 'Ảnh', dataIndex: 'hinh_anh', render: value => value ? <Image width={52} height={52} style={{ objectFit: 'cover' }} src={value} alt="Ảnh sản phẩm" /> : 'Chưa có' }, { title: 'Mã', dataIndex: 'ma_san_pham_code' }, { title: 'Tên', dataIndex: 'ten_san_pham' }, { title: 'Danh mục', dataIndex: 'ten_danh_muc' }, { title: 'Thương hiệu', dataIndex: 'ten_thuong_hieu' }, { title: 'Giá bán', dataIndex: 'gia_ban', render: money }, { title: 'Tồn kho', dataIndex: 'so_luong' }, { title: 'Trạng thái', dataIndex: 'trang_thai', render: value => <Status value={value} /> }, { title: 'Thao tác', render: (_, row) => <Space><Button disabled={busy} onClick={() => edit(row)}>Sửa</Button><Button danger disabled={busy} onClick={() => remove(row)}>Xóa</Button></Space> },
    ]} /></div>
    <Modal title={editing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'} open={open} width={800} onCancel={() => { if (!busy) setOpen(false); }} onOk={() => form.submit()} confirmLoading={busy} okText="Lưu" cancelText="Hủy" cancelButtonProps={{ disabled: busy }}>
      <Form form={form} layout="vertical" disabled={busy} onFinish={async values => {
        if (lock.current) return; lock.current = true; setBusy(true);
        try { if (editing) await productApi.update(editing, values); else await productApi.create(values); message.success('Đã lưu sản phẩm'); setOpen(false); await products.reload(); }
        catch (e) { fieldErrors(e, form); message.error(errorMessage(e)); } finally { lock.current = false; setBusy(false); }
      }}><div className="form-grid">
        <Form.Item name="ma_san_pham_code" label="Mã sản phẩm" rules={[{ required: true, whitespace: true, message: 'Nhập mã sản phẩm' }]}><Input /></Form.Item>
        <Form.Item name="ten_san_pham" label="Tên sản phẩm" rules={[{ required: true, whitespace: true, message: 'Nhập tên sản phẩm' }]}><Input /></Form.Item>
        <Form.Item name="ma_danh_muc" label="Danh mục" rules={[{ required: true, message: 'Chọn danh mục' }]}><Select showSearch optionFilterProp="label" options={references.data?.categories.map(c => ({ value: c.ma_danh_muc, label: c.ten_danh_muc }))} /></Form.Item>
        <Form.Item name="ma_thuong_hieu" label="Thương hiệu" rules={[{ required: true, message: 'Chọn thương hiệu' }]}><Select showSearch optionFilterProp="label" options={references.data?.brands.map(b => ({ value: b.ma_thuong_hieu, label: b.ten_thuong_hieu }))} /></Form.Item>
        {([['gia_nhap', 'Giá nhập'], ['gia_ban', 'Giá bán'], ['so_luong', 'Số lượng'], ['bao_hanh', 'Bảo hành (tháng)']] as const).map(([name, label]) => <Form.Item key={name} name={name} label={label} rules={[{ required: true, type: 'number', min: name === 'gia_ban' ? 1 : 0, message: 'Nhập số hợp lệ' }]}><InputNumber min={name === 'gia_ban' ? 1 : 0} precision={0} style={{ width: '100%' }} /></Form.Item>)}
        <Form.Item name="trang_thai" label="Trạng thái" rules={[{ required: true }]}><Select options={options(['DangBan', 'HetHang', 'NgungBan'])} /></Form.Item>
        <Form.Item name="hinh_anh" label="URL hình ảnh" rules={[{ type: 'url', message: 'URL hình ảnh không hợp lệ' }]}><Input placeholder="https://..." /></Form.Item>
        {detailFields.map(([name, label]) => <Form.Item key={name} name={name} label={label}><Input /></Form.Item>)}
      </div><Form.Item name="mo_ta" label="Mô tả"><Input.TextArea rows={3} /></Form.Item>{imageUrl && <Image src={imageUrl} width={120} alt="Xem trước sản phẩm" />}</Form>
    </Modal></>;
}
