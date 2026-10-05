import { useRef, useState } from 'react';
import { Alert, App, Button, Form, Input, Modal, Select, Space, Spin, Typography } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { api } from '../api/api';
import { productApi } from '../api/product.api';
import { errorMessage } from '../utils/errors';
import type { Product } from '../types';

type Variant = { ma_san_pham: number; gia_tri: string; ten_thuoc_tinh: string; ten_san_pham: string };
export default function ProductVariants({ product }: { product: Product }) {
  const { message, modal } = App.useApp();
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [options, setOptions] = useState<{ value: number; label: string }[]>([]);
  const [form] = Form.useForm();
  const lock = useRef(false), searchVersion = useRef(0);

  async function search(text = '') {
    const version = ++searchVersion.current;
    try {
      const result = await productApi.list({ search: text, limit: 100, ma_danh_muc: product.ma_danh_muc, ma_thuong_hieu: product.ma_thuong_hieu });
      if (version === searchVersion.current) setOptions(previous => [...new Map([...previous, ...(result.data || []).map(p => ({ value: p.ma_san_pham, label: `${p.ten_san_pham} (${p.ma_san_pham_code})` }))].map(p => [p.value, p])).values()]);
    } catch (e) { if (version === searchVersion.current) setError(errorMessage(e)); }
  }
  async function show() {
    setOpen(true); setLoading(true); setReady(false); setError('');
    try {
      const response = await api.get<{ data: Variant[] }>(`/san-pham/${product.ma_san_pham}/bien-the`);
      const variants = response.data.data;
      setOptions([{ value: product.ma_san_pham, label: product.ten_san_pham }, ...variants.map(v => ({ value: v.ma_san_pham, label: v.ten_san_pham }))]);
      form.setFieldsValue({ ten_thuoc_tinh: variants[0]?.ten_thuoc_tinh || 'Kích thước', variants: variants.length ? variants : [{ ma_san_pham: product.ma_san_pham, gia_tri: '' }] });
      setReady(true);
      await search();
    } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }
  async function save(clear = false) {
    if (lock.current || !ready) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const data = clear ? { variants: [] } : await form.validateFields();
      await api.put(`/san-pham/${product.ma_san_pham}/bien-the`, data);
      message.success(clear ? 'Đã gỡ nhóm biến thể' : 'Đã lưu nhóm biến thể'); setOpen(false);
    } catch (e) { if (!(e as { errorFields?: unknown }).errorFields) setError(errorMessage(e)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <>
    <Button onClick={show}>Biến thể</Button>
    <Modal title={`Biến thể · ${product.ten_san_pham}`} open={open} onCancel={() => { if (!busy) setOpen(false); }} destroyOnClose footer={[
      <Button key="remove" danger disabled={!ready || loading || busy} onClick={() => modal.confirm({ title: 'Gỡ nhóm biến thể?', content: 'Các sản phẩm và đơn hàng vẫn được giữ lại.', onOk: () => save(true) })}>Gỡ nhóm</Button>,
      <Button key="cancel" disabled={busy} onClick={() => setOpen(false)}>Đóng</Button>,
      <Button key="save" type="primary" disabled={!ready || loading} loading={busy} onClick={() => save()}>Lưu nhóm</Button>,
    ]}>
      <Typography.Paragraph>Tạo từng sản phẩm với giá, tồn kho, ảnh riêng trước. Sau đó chọn các sản phẩm cùng dòng và đặt nhãn như 55 inch, 65 inch, 75 inch. Nhóm phải bao gồm sản phẩm đang chỉnh sửa.</Typography.Paragraph>
      {error ? <Alert type="error" message={error} showIcon style={{ marginBottom: 12 }} /> : null}
      <Spin spinning={loading}><Form form={form} layout="vertical" disabled={busy || loading}>
        <Form.Item name="ten_thuoc_tinh" label="Tên thuộc tính" rules={[{ required: true, whitespace: true, max: 80 }]}><Input placeholder="Kích thước / Màu sắc / Dung tích" maxLength={80} /></Form.Item>
        <Form.List name="variants">{(fields, { add, remove }) => <>
          {fields.map(field => <Space key={field.key} align="start" style={{ display: 'flex', marginBottom: 8 }}>
            <Form.Item name={[field.name, 'ma_san_pham']} label="Sản phẩm" rules={[{ required: true, message: 'Chọn sản phẩm' }]}><Select showSearch filterOption={false} onSearch={search} placeholder="Tìm tên hoặc mã" options={options} style={{ width: 250 }} /></Form.Item>
            <Form.Item name={[field.name, 'gia_tri']} label="Nhãn biến thể" rules={[{ required: true, whitespace: true, max: 80, message: 'Nhập nhãn tối đa 80 ký tự' }]}><Input placeholder="55 inch" maxLength={80} /></Form.Item>
            <Button aria-label="Gỡ biến thể" style={{ marginTop: 30 }} icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />
          </Space>)}
          <Button disabled={fields.length >= 20 || busy} onClick={() => add({ gia_tri: '' })} icon={<PlusOutlined />}>Thêm biến thể</Button>
        </>}</Form.List>
      </Form></Spin>
    </Modal>
  </>;
}
