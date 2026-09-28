import { useCallback, useRef, useState } from 'react';
import {
  App,
  Badge,
  Button,
  Card,
  Divider,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { DeleteOutlined, PlusOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { productApi } from '../api/product.api';
import { categoryApi } from '../api/category.api';
import { brandApi } from '../api/brand.api';
import { useLoad } from '../hooks/useLoad';
import LoadError from '../components/LoadError';
import { errorMessage, fieldErrors } from '../utils/errors';
import { money, options, Status } from '../utils/format';
import type { CategorySpecification, Product, ProductImage, ProductInput } from '../types';

const { Text } = Typography;

export default function ProductsPage() {
  const { message, modal } = App.useApp();
  const [query, setQuery] = useState({
    search: '',
    page: 1,
    limit: 10,
    ma_danh_muc: undefined as number | undefined,
    ma_thuong_hieu: undefined as number | undefined,
  });

  const loader = useCallback(() => productApi.list(query), [query]);
  const products = useLoad(loader);
  const references = useLoad(
    useCallback(async () => {
      const [categories, brands] = await Promise.all([categoryApi.list(), brandApi.list()]);
      return { categories: categories.data || [], brands: brands.data || [] };
    }, [])
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [form] = Form.useForm<any>();

  // Dynamic specifications for selected category
  const [categorySpecs, setCategorySpecs] = useState<CategorySpecification[]>([]);
  const [specsLoading, setSpecsLoading] = useState(false);

  // Multi-image management state
  const [images, setImages] = useState<ProductImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageDesc, setNewImageDesc] = useState('');

  // View detail modal
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadSpecsForCategory = async (catId: number, currentSpecs?: any[]) => {
    setSpecsLoading(true);
    try {
      const specs = await productApi.getCategorySpecifications(catId);
      setCategorySpecs(specs || []);

      // If currentSpecs provided (editing), populate spec values into form
      if (currentSpecs && Array.isArray(currentSpecs)) {
        const specValues: Record<string, any> = {};
        for (const spec of specs) {
          const match = currentSpecs.find((s: any) => s.ma_thong_so === spec.ma_thong_so);
          if (match) {
            if (spec.kieu_du_lieu === 'NUMBER') {
              specValues[`spec_${spec.ma_thong_so}`] = match.gia_tri_so != null ? match.gia_tri_so : (Number(match.gia_tri) || undefined);
            } else if (spec.kieu_du_lieu === 'BOOLEAN') {
              specValues[`spec_${spec.ma_thong_so}`] = match.gia_tri_bool != null ? String(match.gia_tri_bool) : (match.gia_tri != null ? String(match.gia_tri) : undefined);
            } else {
              specValues[`spec_${spec.ma_thong_so}`] = match.gia_tri ?? '';
            }
          }
        }
        form.setFieldsValue(specValues);
      }
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      setSpecsLoading(false);
    }
  };

  const handleCategoryChange = (catId: number) => {
    form.setFieldValue('ma_danh_muc', catId);
    if (catId) {
      loadSpecsForCategory(catId);
    } else {
      setCategorySpecs([]);
    }
  };

  const addImageToList = () => {
    const url = newImageUrl.trim();
    if (!url) {
      message.warning('Vui lòng nhập đường dẫn hình ảnh');
      return;
    }
    const newImg: ProductImage = {
      duong_dan: url,
      mo_ta: newImageDesc.trim() || null,
      la_anh_chinh: images.length === 0,
      thu_tu_hien_thi: images.length + 1,
    };
    setImages(prev => [...prev, newImg]);
    setNewImageUrl('');
    setNewImageDesc('');
  };

  const removeImageFromList = (index: number) => {
    setImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some(img => img.la_anh_chinh)) {
        updated[0].la_anh_chinh = true;
      }
      return updated;
    });
  };

  const setPrimaryImage = (index: number) => {
    setImages(prev =>
      prev.map((img, i) => ({
        ...img,
        la_anh_chinh: i === index,
      }))
    );
  };

  const viewDetail = async (row: Product) => {
    try {
      const res = await productApi.get(row.ma_san_pham);
      setDetailProduct(res);
      setDetailOpen(true);
    } catch (e) {
      message.error(errorMessage(e));
    }
  };

  const edit = async (row: Product) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const product = await productApi.get(row.ma_san_pham);
      form.resetFields();
      form.setFieldsValue({
        ...product,
        gia_ban: Number(product.gia_ban),
        gia_nhap: Number(product.gia_nhap || 0),
      });

      // Populate images
      const imgList: ProductImage[] =
        product.danh_sach_hinh_anh && product.danh_sach_hinh_anh.length > 0
          ? product.danh_sach_hinh_anh
          : product.hinh_anh
          ? [{ duong_dan: product.hinh_anh, la_anh_chinh: true, thu_tu_hien_thi: 1 }]
          : [];
      setImages(imgList);

      setEditing(row.ma_san_pham);
      setOpen(true);

      // Load specifications for category and prefill
      if (product.ma_danh_muc) {
        await loadSpecsForCategory(product.ma_danh_muc, product.thong_so_ky_thuat);
      }
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const remove = (row: Product) =>
    modal.confirm({
      title: `Xóa ${row.ten_san_pham}?`,
      content: 'Sản phẩm đã có trong đơn hàng sẽ không thể xóa.',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        if (lock.current) throw new Error('Đang xử lý');
        lock.current = true;
        setBusy(true);
        try {
          await productApi.remove(row.ma_san_pham);
          message.success('Đã xóa sản phẩm');
          if (products.data?.data.length === 1 && query.page > 1) {
            setQuery(q => ({ ...q, page: q.page - 1 }));
          } else {
            await products.reload();
          }
        } catch (e) {
          message.error(errorMessage(e));
          throw e;
        } finally {
          lock.current = false;
          setBusy(false);
        }
      },
    });

  // Group category specifications by group name
  const groupedCategorySpecs = categorySpecs.reduce((acc, spec) => {
    const groupName = spec.ten_nhom_thong_so || 'Thông số khác';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(spec);
    return acc;
  }, {} as Record<string, CategorySpecification[]>);

  const handleSubmit = async (values: any) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);

    try {
      // Gather dynamic specifications
      const thong_so = categorySpecs
        .map(ts => {
          const rawVal = values[`spec_${ts.ma_thong_so}`];
          if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') return null;

          let gia_tri: string | null = String(rawVal).trim();
          let gia_tri_so: number | null = null;
          let gia_tri_bool: boolean | null = null;

          if (ts.kieu_du_lieu === 'NUMBER') {
            gia_tri_so = Number(rawVal);
          } else if (ts.kieu_du_lieu === 'BOOLEAN') {
            gia_tri_bool = rawVal === 'true' || rawVal === true;
          }

          return {
            ma_thong_so: ts.ma_thong_so,
            gia_tri,
            gia_tri_so,
            gia_tri_bool,
          };
        })
        .filter(Boolean);

      const primaryImg = images.find(img => img.la_anh_chinh) || images[0];

      const payload: ProductInput = {
        ma_san_pham_code: values.ma_san_pham_code,
        ten_san_pham: values.ten_san_pham,
        ma_danh_muc: values.ma_danh_muc,
        ma_thuong_hieu: values.ma_thuong_hieu,
        gia_nhap: values.gia_nhap,
        gia_ban: values.gia_ban,
        so_luong: values.so_luong,
        bao_hanh: values.bao_hanh,
        trang_thai: values.trang_thai,
        mo_ta: values.mo_ta,
        hinh_anh: primaryImg?.duong_dan || null,
        danh_sach_hinh_anh: images.map((img, idx) => ({
          duong_dan: img.duong_dan,
          mo_ta: img.mo_ta || null,
          la_anh_chinh: img.la_anh_chinh ?? idx === 0,
          thu_tu_hien_thi: idx + 1,
        })),
        thong_so: thong_so as any,
      };

      if (editing) {
        await productApi.update(editing, payload);
        message.success('Đã cập nhật sản phẩm');
      } else {
        await productApi.create(payload);
        message.success('Đã tạo sản phẩm thành công');
      }

      setOpen(false);
      await products.reload();
    } catch (e) {
      fieldErrors(e, form);
      message.error(errorMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-heading">
        <h1 className="page-title">Sản phẩm</h1>
        <Button
          type="primary"
          disabled={busy || references.loading || !!references.error}
          onClick={() => {
            form.resetFields();
            form.setFieldsValue({ trang_thai: 'DangBan', gia_nhap: 0, so_luong: 0, bao_hanh: 12 });
            setCategorySpecs([]);
            setImages([]);
            setEditing(null);
            setOpen(true);
          }}
        >
          Thêm sản phẩm
        </Button>
      </div>

      <LoadError error={products.error} retry={products.reload} />
      <LoadError error={references.error} retry={references.reload} />

      <div className="card">
        <Space wrap className="toolbar">
          <Input.Search
            placeholder="Tên hoặc mã sản phẩm"
            aria-label="Tìm sản phẩm"
            allowClear
            onSearch={search => setQuery(q => ({ ...q, search, page: 1 }))}
          />
          <Select
            aria-label="Lọc danh mục"
            placeholder="Danh mục"
            allowClear
            style={{ minWidth: 170 }}
            options={references.data?.categories.map(c => ({ value: c.ma_danh_muc, label: c.ten_danh_muc }))}
            onChange={ma_danh_muc => setQuery(q => ({ ...q, ma_danh_muc, page: 1 }))}
          />
          <Select
            aria-label="Lọc thương hiệu"
            placeholder="Thương hiệu"
            allowClear
            style={{ minWidth: 170 }}
            options={references.data?.brands.map(b => ({ value: b.ma_thuong_hieu, label: b.ten_thuong_hieu }))}
            onChange={ma_thuong_hieu => setQuery(q => ({ ...q, ma_thuong_hieu, page: 1 }))}
          />
          <Button onClick={products.reload}>Làm mới</Button>
        </Space>

        <Table<Product>
          rowKey="ma_san_pham"
          loading={products.loading}
          dataSource={products.data?.data || []}
          scroll={{ x: 1050 }}
          locale={{ emptyText: <Empty description="Chưa có sản phẩm" /> }}
          pagination={{
            current: query.page,
            pageSize: query.limit,
            total: products.data?.pagination?.total || 0,
            showSizeChanger: true,
            onChange: (page, limit) => setQuery(q => ({ ...q, page: limit !== q.limit ? 1 : page, limit })),
          }}
          columns={[
            {
              title: 'Ảnh',
              dataIndex: 'hinh_anh',
              render: (value, row) => {
                const count = row.danh_sach_hinh_anh?.length || (value ? 1 : 0);
                return value ? (
                  <Badge count={count > 1 ? `${count} ảnh` : 0} offset={[-8, 8]} style={{ backgroundColor: '#176b52' }}>
                    <Image width={54} height={54} style={{ objectFit: 'cover', borderRadius: 8 }} src={value} alt="Ảnh sản phẩm" />
                  </Badge>
                ) : (
                  'Chưa có'
                );
              },
            },
            { title: 'Mã', dataIndex: 'ma_san_pham_code' },
            {
              title: 'Tên sản phẩm',
              dataIndex: 'ten_san_pham',
              render: (text, row) => (
                <div>
                  <Text strong>{text}</Text>
                  {row.thong_so_ky_thuat && row.thong_so_ky_thuat.length > 0 && (
                    <div>
                      <Tag color="cyan" style={{ fontSize: 10, marginTop: 4 }}>
                        {row.thong_so_ky_thuat.length} thông số
                      </Tag>
                    </div>
                  )}
                </div>
              ),
            },
            { title: 'Danh mục', dataIndex: 'ten_danh_muc' },
            { title: 'Thương hiệu', dataIndex: 'ten_thuong_hieu' },
            { title: 'Giá bán', dataIndex: 'gia_ban', render: money },
            { title: 'Tồn kho', dataIndex: 'so_luong' },
            { title: 'Trạng thái', dataIndex: 'trang_thai', render: value => <Status value={value} /> },
            {
              title: 'Thao tác',
              render: (_, row) => (
                <Space>
                  <Button onClick={() => viewDetail(row)}>Xem</Button>
                  <Button disabled={busy} onClick={() => edit(row)}>
                    Sửa
                  </Button>
                  <Button danger disabled={busy} onClick={() => remove(row)}>
                    Xóa
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </div>

      {/* Modal View Detail */}
      <Modal
        title={detailProduct ? `${detailProduct.ten_san_pham} (${detailProduct.ma_san_pham_code})` : 'Chi tiết sản phẩm'}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={850}
      >
        {detailProduct && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 160px' }}>
                <Image
                  src={detailProduct.hinh_anh || ''}
                  width={160}
                  height={160}
                  style={{ objectFit: 'cover', borderRadius: 10 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <p>
                  <strong>Danh mục:</strong> {detailProduct.ten_danh_muc} | <strong>Thương hiệu:</strong> {detailProduct.ten_thuong_hieu}
                </p>
                <p>
                  <strong>Giá bán:</strong> {money(detailProduct.gia_ban)} | <strong>Tồn kho:</strong> {detailProduct.so_luong}
                </p>
                <p>
                  <strong>Trạng thái:</strong> <Status value={detailProduct.trang_thai} /> | <strong>Bảo hành:</strong> {detailProduct.bao_hanh} tháng
                </p>
                <p>
                  <strong>Mô tả:</strong> {detailProduct.mo_ta || 'Không có mô tả'}
                </p>
              </div>
            </div>

            {/* Gallery Images */}
            {detailProduct.danh_sach_hinh_anh && detailProduct.danh_sach_hinh_anh.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4>Hình ảnh sản phẩm ({detailProduct.danh_sach_hinh_anh.length})</h4>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {detailProduct.danh_sach_hinh_anh.map(img => (
                    <div key={img.ma_hinh_anh || img.duong_dan} style={{ textAlign: 'center' }}>
                      <Image src={img.duong_dan} width={90} height={90} style={{ objectFit: 'cover', borderRadius: 8 }} />
                      {img.la_anh_chinh ? <Tag color="green" style={{ display: 'block', marginTop: 4 }}>Ảnh chính</Tag> : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications grouped */}
            <h4>Thông số kỹ thuật</h4>
            {detailProduct.specifications && detailProduct.specifications.length > 0 ? (
              detailProduct.specifications.map(group => (
                <Card key={group.group} size="small" title={group.group} style={{ marginBottom: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {group.items.map(item => (
                        <tr key={item.ma_thong_so} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '6px 12px', width: '40%', color: '#555' }}>{item.name}</td>
                          <td style={{ padding: '6px 12px', fontWeight: 600 }}>
                            {item.value} {item.unit && !item.value.includes(item.unit) ? item.unit : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              ))
            ) : (
              <Empty description="Chưa có thông số kỹ thuật" />
            )}
          </div>
        )}
      </Modal>

      {/* Modal Add / Edit Product */}
      <Modal
        title={editing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}
        open={open}
        width={850}
        onCancel={() => {
          if (!busy) setOpen(false);
        }}
        onOk={() => form.submit()}
        confirmLoading={busy}
        okText="Lưu"
        cancelText="Hủy"
        cancelButtonProps={{ disabled: busy }}
      >
        <Form form={form} layout="vertical" disabled={busy} onFinish={handleSubmit}>
          <Divider orientation="left">Thông tin cơ bản</Divider>
          <div className="form-grid">
            <Form.Item name="ma_san_pham_code" label="Mã sản phẩm" rules={[{ required: true, whitespace: true, message: 'Nhập mã sản phẩm' }]}>
              <Input placeholder="VD: TL-SAM-001" />
            </Form.Item>
            <Form.Item name="ten_san_pham" label="Tên sản phẩm" rules={[{ required: true, whitespace: true, message: 'Nhập tên sản phẩm' }]}>
              <Input placeholder="VD: Tủ lạnh Samsung Inverter 236L" />
            </Form.Item>
            <Form.Item name="ma_danh_muc" label="Danh mục" rules={[{ required: true, message: 'Chọn danh mục' }]}>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Chọn danh mục"
                options={references.data?.categories.map(c => ({ value: c.ma_danh_muc, label: c.ten_danh_muc }))}
                onChange={handleCategoryChange}
              />
            </Form.Item>
            <Form.Item name="ma_thuong_hieu" label="Thương hiệu" rules={[{ required: true, message: 'Chọn thương hiệu' }]}>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Chọn thương hiệu"
                options={references.data?.brands.map(b => ({ value: b.ma_thuong_hieu, label: b.ten_thuong_hieu }))}
              />
            </Form.Item>
            <Form.Item name="gia_nhap" label="Giá nhập (VNĐ)" rules={[{ required: true, type: 'number', min: 0, message: 'Nhập số hợp lệ' }]}>
              <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="Giá nhập kho" />
            </Form.Item>
            <Form.Item name="gia_ban" label="Giá bán (VNĐ)" rules={[{ required: true, type: 'number', min: 1, message: 'Nhập giá bán > 0' }]}>
              <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="Giá niêm yết" />
            </Form.Item>
            <Form.Item name="so_luong" label="Số lượng tồn kho" rules={[{ required: true, type: 'number', min: 0, message: 'Nhập số lượng >= 0' }]}>
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="bao_hanh" label="Bảo hành (tháng)" rules={[{ required: true, type: 'number', min: 0, message: 'Nhập số tháng' }]}>
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="trang_thai" label="Trạng thái" rules={[{ required: true }]}>
              <Select options={options(['DangBan', 'HetHang', 'NgungBan'])} />
            </Form.Item>
          </div>

          <Form.Item name="mo_ta" label="Mô tả sản phẩm">
            <Input.TextArea rows={3} placeholder="Mô tả ngắn gọn về tính năng và ưu điểm của sản phẩm..." />
          </Form.Item>

          {/* Multi-Image Section */}
          <Divider orientation="left">Hình ảnh sản phẩm (Hỗ trợ nhiều ảnh)</Divider>
          <div style={{ marginBottom: 16 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="Dán URL hình ảnh (https://...)"
                value={newImageUrl}
                onChange={e => setNewImageUrl(e.target.value)}
                onPressEnter={addImageToList}
              />
              <Input
                placeholder="Mô tả ảnh (tùy chọn)"
                style={{ width: '35%' }}
                value={newImageDesc}
                onChange={e => setNewImageDesc(e.target.value)}
                onPressEnter={addImageToList}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={addImageToList}>
                Thêm ảnh
              </Button>
            </Space.Compact>

            {images.length > 0 ? (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: img.la_anh_chinh ? '2px solid #176b52' : '1px solid #d9d9d9',
                      borderRadius: 10,
                      padding: 6,
                      background: img.la_anh_chinh ? '#f2f8f5' : '#fafafa',
                      width: 140,
                      textAlign: 'center',
                    }}
                  >
                    <Image
                      src={img.duong_dan}
                      width={124}
                      height={90}
                      style={{ objectFit: 'cover', borderRadius: 6 }}
                      fallback="https://via.placeholder.com/124x90?text=Loi+Anh"
                    />
                    <div style={{ marginTop: 6, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {img.mo_ta || `Ảnh ${idx + 1}`}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, alignItems: 'center' }}>
                      {img.la_anh_chinh ? (
                        <Tag color="success" icon={<StarFilled />} style={{ margin: 0, fontSize: 10 }}>
                          Chính
                        </Tag>
                      ) : (
                        <Button size="small" type="text" icon={<StarOutlined />} onClick={() => setPrimaryImage(idx)} title="Đặt làm ảnh chính">
                          Chính
                        </Button>
                      )}
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeImageFromList(idx)}
                        title="Xóa ảnh"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '12px 0', color: '#888', fontStyle: 'italic' }}>
                Chưa có hình ảnh nào. Vui lòng nhập URL và nhấn "Thêm ảnh".
              </div>
            )}
          </div>

          {/* Dynamic Specifications by Category */}
          <Divider orientation="left">
            Thông số kỹ thuật {categorySpecs.length > 0 ? `(${categorySpecs.length} thông số theo danh mục)` : ''}
          </Divider>

          {specsLoading ? (
            <div style={{ textAlign: 'center', padding: 20 }}>Đang tải thông số kỹ thuật theo danh mục...</div>
          ) : Object.keys(groupedCategorySpecs).length > 0 ? (
            <div>
              {Object.entries(groupedCategorySpecs).map(([groupName, specs]) => (
                <div key={groupName} style={{ marginBottom: 16 }}>
                  <h4 style={{ color: '#176b52', marginBottom: 10, borderBottom: '1px solid #e8f0eb', paddingBottom: 4 }}>
                    {groupName}
                  </h4>
                  <div className="form-grid">
                    {specs.map(spec => (
                      <Form.Item
                        key={spec.ma_thong_so}
                        name={`spec_${spec.ma_thong_so}`}
                        label={
                          <span>
                            {spec.ten_thong_so}
                            {spec.don_vi ? <span style={{ color: '#888', fontWeight: 'normal' }}> ({spec.don_vi})</span> : null}
                          </span>
                        }
                        rules={
                          spec.bat_buoc
                            ? [{ required: true, message: `Vui lòng nhập ${spec.ten_thong_so}` }]
                            : undefined
                        }
                      >
                        {spec.kieu_du_lieu === 'NUMBER' ? (
                          <InputNumber
                            placeholder={spec.don_vi ? `Đơn vị: ${spec.don_vi}` : 'Nhập số'}
                            style={{ width: '100%' }}
                            addonAfter={spec.don_vi || undefined}
                          />
                        ) : spec.kieu_du_lieu === 'BOOLEAN' ? (
                          <Select
                            placeholder="Chọn Có/Không"
                            allowClear
                            options={[
                              { value: 'true', label: 'Có / Đúng' },
                              { value: 'false', label: 'Không / Sai' },
                            ]}
                          />
                        ) : (
                          <Input placeholder={`Nhập ${spec.ten_thong_so.toLowerCase()}...`} />
                        )}
                      </Form.Item>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#888', fontStyle: 'italic', padding: '10px 0' }}>
              Vui lòng chọn danh mục để tự động tải các thông số kỹ thuật tương ứng.
            </div>
          )}
        </Form>
      </Modal>
    </>
  );
}
