import { useCallback, useRef, useState, type ReactNode } from 'react';
import { App, Button, Descriptions, Drawer, Empty, Form, Input, InputNumber, Modal, Select, Space, Switch, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Rule } from 'antd/es/form';
import type { ApiResponse } from '../types';
import { useLoad } from '../hooks/useLoad';
import { errorMessage, fieldErrors } from '../utils/errors';
import LoadError from './LoadError';
import { dateTime, money } from '../utils/format';

export interface Field { name: string; label: string; kind?: 'number' | 'text' | 'textarea' | 'select' | 'switch' | 'date'; required?: boolean; rules?: Rule[]; options?: { value: string | number; label: string; disabled?: boolean }[]; disabledOnEdit?: boolean }
interface Props<T extends object> {
  title: string; idKey: keyof T & string; api: { list: () => Promise<ApiResponse<T[]>>; get: (id: number) => Promise<T>; create?: (data: Partial<T>) => Promise<unknown>; update: (id: number, data: Partial<T>) => Promise<unknown>; remove: (id: number) => Promise<unknown> };
  columns: ColumnsType<T>; fields: Field[]; defaults?: Partial<T>; searchKeys: (keyof T)[];
  filter?: { key: keyof T; options: { value: string; label: string }[]; initial?: string };
  canModify?: (row: T) => boolean; prepare?: (row: T) => Partial<T>; details?: (row: T) => ReactNode; extra?: ReactNode;
}
export default function ResourcePage<T extends object>({ title, idKey, api, columns, fields, defaults, searchKeys, filter, canModify = () => true, prepare, details, extra }: Props<T>) {
  const { message, modal } = App.useApp();
  const loader = useCallback(() => api.list(), [api]);
  const { data, loading, error, reload } = useLoad(loader);
  const [search, setSearch] = useState('');
  const [filterValue, setFilterValue] = useState<string | undefined>(filter?.initial);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<T | null>(null);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [form] = Form.useForm();
  const id = (row: T) => Number(row[idKey]);
  const view = async (row: T, edit: boolean) => {
    if (lock.current) return; lock.current = true; setBusy(true);
    try { const fresh = await api.get(id(row)); if (edit) { setEditing(fresh); form.resetFields(); form.setFieldsValue(prepare ? prepare(fresh) : fresh); setOpen(true); } else setDetail(fresh); }
    catch (e) { message.error(errorMessage(e)); } finally { lock.current = false; setBusy(false); }
  };
  const remove = (row: T) => modal.confirm({ title: 'Xác nhận xóa?', content: 'Dữ liệu bị xóa không thể khôi phục.', okText: 'Xóa', cancelText: 'Hủy', okButtonProps: { danger: true }, onOk: async () => {
    if (lock.current) throw new Error('Đang xử lý'); lock.current = true; setBusy(true);
    try { await api.remove(id(row)); message.success('Đã xóa thành công'); await reload(); }
    catch (e) { message.error(errorMessage(e)); throw e; } finally { lock.current = false; setBusy(false); }
  } });
  const rows = (data?.data || []).filter(row => (!filterValue || !filter || String(row[filter.key]) === filterValue) && searchKeys.some(key => String(row[key] ?? '').toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'))));
  const tableColumns: ColumnsType<T> = [...columns, { title: 'Thao tác', key: 'actions', render: (_, row) => <Space wrap><Button disabled={busy} onClick={() => view(row, false)}>Chi tiết</Button><Button disabled={busy || !canModify(row)} onClick={() => view(row, true)}>Sửa</Button><Button danger disabled={busy || !canModify(row)} onClick={() => remove(row)}>Xóa</Button></Space> }];
  return <><div className="page-heading"><h1 className="page-title">{title}</h1>{api.create && <Button type="primary" disabled={busy} onClick={() => { setEditing(null); form.resetFields(); form.setFieldsValue(defaults || {}); setOpen(true); }}>Thêm mới</Button>}</div>
    {extra}<LoadError error={error} retry={reload} /><div className="card"><Space className="toolbar" wrap><Input.Search aria-label="Tìm kiếm" placeholder="Tìm kiếm..." allowClear value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />{filter && <Select aria-label="Lọc danh sách" placeholder="Tất cả" allowClear value={filterValue} options={filter.options} onChange={value => { setFilterValue(value); setPage(1); }} style={{ minWidth: 180 }} />}<Button onClick={reload} disabled={loading}>Làm mới</Button></Space>
      <Table<T> rowKey={idKey} columns={tableColumns} dataSource={rows} loading={loading} scroll={{ x: 900 }} locale={{ emptyText: <Empty description="Chưa có dữ liệu" /> }} pagination={{ current: Math.min(page, Math.max(1, Math.ceil(rows.length / 10))), pageSize: 10, onChange: setPage, showSizeChanger: false }} />
    </div><Modal open={open} title={editing ? 'Chỉnh sửa' : 'Thêm mới'} onCancel={() => { if (!busy) setOpen(false); }} onOk={() => form.submit()} confirmLoading={busy} cancelButtonProps={{ disabled: busy }} okText="Lưu" cancelText="Hủy" width={720}>
      <Form form={form} layout="vertical" disabled={busy} onFinish={async (values: Partial<T>) => {
        if (lock.current) return; lock.current = true; setBusy(true);
        try { if (editing) await api.update(id(editing), values); else await api.create?.(values); message.success('Đã lưu thành công'); setOpen(false); await reload(); }
        catch (e) { fieldErrors(e, form); message.error(errorMessage(e)); } finally { lock.current = false; setBusy(false); }
      }}><div className="form-grid">{fields.map(field => <Form.Item key={field.name} name={field.name} label={field.label} valuePropName={field.kind === 'switch' ? 'checked' : 'value'} rules={[...(field.required ? [{ required: true, message: `Vui lòng nhập ${field.label.toLowerCase()}` }] : []), ...(field.rules || [])]}>
        {field.kind === 'select' ? <Select allowClear={!field.required} showSearch optionFilterProp="label" options={field.options} disabled={busy || (!!editing && field.disabledOnEdit)} /> : field.kind === 'number' ? <InputNumber min={0} style={{ width: '100%' }} /> : field.kind === 'switch' ? <Switch /> : field.kind === 'textarea' ? <Input.TextArea rows={3} /> : <Input type={field.kind === 'date' ? 'date' : 'text'} disabled={busy || (!!editing && field.disabledOnEdit)} />}
      </Form.Item>)}</div></Form>
    </Modal><Drawer title="Thông tin chi tiết" open={!!detail} onClose={() => setDetail(null)} width={Math.min(640, window.innerWidth)}>{detail && (details ? details(detail) : <Descriptions column={1} bordered items={fields.map(field => {
      const value = (detail as Record<string, unknown>)[field.name];
      const display = field.kind === 'switch' ? (value ? 'Hoạt động' : 'Tắt') : field.kind === 'date' ? dateTime(value as string) : field.name === 'luong' ? money(value as number) : field.options?.find(option => option.value === value)?.label || String(value ?? '—');
      return { key: field.name, label: field.label, children: <span style={{ whiteSpace: 'pre-wrap' }}>{display}</span> };
    })} />)}</Drawer></>;
}
