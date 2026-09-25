import { useCallback, useRef, useState } from 'react';
import { App, Button, Empty, Rate, Select, Space, Table } from 'antd';
import { reviewApi } from '../api/review.api';
import { productApi } from '../api/product.api';
import { useLoad } from '../hooks/useLoad';
import LoadError from '../components/LoadError';
import { dateTime } from '../utils/format';
import { errorMessage } from '../utils/errors';
import type { Review } from '../types';
export default function ReviewsPage() {
  const { message, modal } = App.useApp();
  const [query, setQuery] = useState({ page: 1, limit: 10, ma_san_pham: undefined as number | undefined, so_sao: undefined as number | undefined });
  const [productSearch, setProductSearch] = useState('');
  const products = useLoad(useCallback(() => productApi.list({ search: productSearch, limit: 50 }), [productSearch]));
  const result = useLoad(useCallback(() => reviewApi.list(query), [query]));
  const [busy, setBusy] = useState(false); const lock = useRef(false);
  return <><h1 className="page-title">Đánh giá</h1><LoadError error={result.error} retry={result.reload} /><LoadError error={products.error} retry={products.reload} /><div className="card mt"><Space wrap className="toolbar">
    <Select aria-label="Chọn sản phẩm" placeholder="Tất cả sản phẩm (gõ để tìm)" allowClear showSearch filterOption={false} onSearch={setProductSearch} loading={products.loading} style={{ width: 300, maxWidth: '100%' }} options={products.data?.data?.map(p => ({ value: p.ma_san_pham, label: p.ten_san_pham }))} onChange={ma_san_pham => setQuery(q => ({ ...q, ma_san_pham, page: 1 }))} />
    <Select aria-label="Lọc số sao" placeholder="Số sao" allowClear style={{ width: 130 }} options={[1, 2, 3, 4, 5].map(value => ({ value, label: `${value} sao` }))} onChange={so_sao => setQuery(q => ({ ...q, so_sao, page: 1 }))} /><Button onClick={result.reload}>Làm mới</Button></Space>
    <Table<Review> rowKey="ma_danh_gia" loading={result.loading} dataSource={result.data?.data || []} scroll={{ x: 900 }} locale={{ emptyText: <Empty description="Chưa có đánh giá" /> }} pagination={{ current: query.page, pageSize: query.limit, total: result.data?.pagination?.total || 0, showSizeChanger: true, onChange: (page, limit) => setQuery(q => ({ ...q, page: limit !== q.limit ? 1 : page, limit })) }} columns={[
      { title: 'Người đánh giá', dataIndex: 'ho_ten' }, { title: 'Sản phẩm', dataIndex: 'ten_san_pham' }, { title: 'Số sao', dataIndex: 'so_sao', render: value => <Rate disabled value={value} /> }, { title: 'Nội dung', dataIndex: 'noi_dung' }, { title: 'Ngày đánh giá', dataIndex: 'ngay_danh_gia', render: dateTime }, { title: 'Thao tác', render: (_, row) => <Button danger disabled={busy} onClick={() => modal.confirm({ title: 'Xóa đánh giá này?', okText: 'Xóa', cancelText: 'Hủy', okButtonProps: { danger: true }, onOk: async () => {
        if (lock.current) throw new Error('Đang xử lý'); lock.current = true; setBusy(true);
        try { await reviewApi.remove(row.ma_danh_gia); message.success('Đã xóa đánh giá'); if (result.data?.data.length === 1 && query.page > 1) setQuery(q => ({ ...q, page: q.page - 1 })); else await result.reload(); }
        catch (e) { message.error(errorMessage(e)); throw e; } finally { lock.current = false; setBusy(false); }
      } })}>Xóa</Button> },
    ]} /></div></>;
}
