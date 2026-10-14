import { useCallback, useState } from 'react';
import {
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Table,
  Switch,
  Select,
  Space,
  Modal,
  Alert,
  Tag,
  Tooltip,
} from 'antd';
import { api } from '../api/api';
import { useLoad } from '../hooks/useLoad';
import LoadError from '../components/LoadError';
import { errorMessage } from '../utils/errors';
import { money, dateTime } from '../utils/format';
import {
  PlusOutlined,
  CloseOutlined,
  GiftOutlined,
  UserOutlined,
  SearchOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

export default function ShopOperationsPage({ kind }: { kind: 'vouchers' | 'inventory' }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [grantForm] = Form.useForm();
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedVoucherForGrant, setSelectedVoucherForGrant] = useState<any>(null);
  const [lookingUpUser, setLookingUpUser] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);
  const [lookupError, setLookupError] = useState<string>('');
  const [granting, setGranting] = useState(false);
  const [variants, setVariants] = useState<{ ma_bien_the: number; ten_bien_the: string }[]>([]);

  const result = useLoad(
    useCallback(async () => {
      const response = await api.get(`/shop/${kind}`);
      return response.data.data as any[];
    }, [kind])
  );

  const products = useLoad(
    useCallback(async () => {
      const response = await api.get('/san-pham', { params: { limit: 100 } });
      return response.data.data as any[];
    }, [])
  );

  const save = async (values: any) => {
    setBusy(true);
    try {
      await api.post(`/shop/${kind}`, values);
      if (kind === 'vouchers' && values.tai_khoan_rieng?.trim()) {
        try {
          await api.post('/shop/vouchers/grant', {
            ma_code: values.ma_code,
            tai_khoan: values.tai_khoan_rieng.trim(),
            so_ngay_hieu_luc: 30,
          });
          message.success(`Đã tạo và kích hoạt mã ${values.ma_code} riêng cho tài khoản ${values.tai_khoan_rieng}!`);
        } catch (grantErr) {
          message.warning(`Đã tạo voucher nhưng chưa kích hoạt được cho tài khoản: ${errorMessage(grantErr)}`);
        }
      } else {
        message.success('Đã lưu');
      }
      form.resetFields();
      setVariants([]);
      setShowForm(false);
      await result.reload();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const openGrantModal = (voucher: any = null) => {
    setSelectedVoucherForGrant(voucher);
    setFoundUser(null);
    setLookupError('');
    grantForm.resetFields();
    if (voucher) {
      grantForm.setFieldsValue({
        ma_voucher: voucher.ma_voucher,
        so_ngay_hieu_luc: 30,
      });
    } else {
      grantForm.setFieldsValue({
        so_ngay_hieu_luc: 30,
      });
    }
    setShowGrantModal(true);
  };

  const handleLookupUser = async () => {
    const val = grantForm.getFieldValue('tai_khoan')?.trim();
    if (!val) {
      setLookupError('Vui lòng nhập số điện thoại hoặc tên đăng nhập để kiểm tra.');
      setFoundUser(null);
      return;
    }
    setLookingUpUser(true);
    setLookupError('');
    try {
      const res = await api.get('/shop/vouchers/lookup-user', { params: { q: val } });
      const users = res.data.data as any[];
      if (users && users.length > 0) {
        setFoundUser(users[0]);
        setLookupError('');
      } else {
        setFoundUser(null);
        setLookupError(`Không tìm thấy tài khoản nào khớp với "${val}".`);
      }
    } catch (e) {
      setFoundUser(null);
      setLookupError(errorMessage(e));
    } finally {
      setLookingUpUser(false);
    }
  };

  const handleGrantVoucher = async (values: any) => {
    setGranting(true);
    try {
      const res = await api.post('/shop/vouchers/grant', {
        ma_voucher: values.ma_voucher,
        tai_khoan: values.tai_khoan?.trim(),
        so_ngay_hieu_luc: values.so_ngay_hieu_luc || 30,
      });
      message.success(res.data.message || 'Đã kích hoạt voucher thành công vào ví khách hàng!');
      setShowGrantModal(false);
      grantForm.resetFields();
      setFoundUser(null);
      await result.reload();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      setGranting(false);
    }
  };

  return (
    <>
      <div className="page-heading">
        <h1 className="page-title">{kind === 'vouchers' ? 'Mã giảm giá' : 'Nhập kho'}</h1>
        <Space wrap>
          {kind === 'vouchers' && (
            <Button
              type="primary"
              style={{ backgroundColor: '#176B52', borderColor: '#176B52' }}
              icon={<GiftOutlined />}
              onClick={() => openGrantModal(null)}
            >
              Kích hoạt riêng cho tài khoản
            </Button>
          )}
          <Button
            type={showForm ? 'default' : 'primary'}
            icon={showForm ? <CloseOutlined /> : <PlusOutlined />}
            disabled={busy}
            aria-expanded={showForm}
            aria-controls="shop-add-form"
            onClick={() => setShowForm((current) => !current)}
          >
            {showForm ? 'Ẩn form thêm' : kind === 'vouchers' ? 'Thêm mã giảm giá' : 'Tạo phiếu nhập'}
          </Button>
        </Space>
      </div>

      <LoadError
        error={result.error || products.error}
        retry={() => {
          void result.reload();
          void products.reload();
        }}
      />

      {showForm && (
        <Card id="shop-add-form" title={kind === 'vouchers' ? 'Tạo mã giảm giá' : 'Tạo phiếu nhập'}>
          <Form form={form} layout="vertical" onFinish={save}>
            {kind === 'vouchers' ? (
              <>
                <Form.Item
                  name="ma_code"
                  label="Mã giảm giá"
                  rules={[
                    {
                      required: true,
                      pattern: /^[A-Za-z0-9_-]{3,32}$/,
                      message: 'Nhập 3–32 ký tự chữ, số, gạch ngang hoặc gạch dưới.',
                    },
                  ]}
                >
                  <Input maxLength={32} autoComplete="off" placeholder="Ví dụ: SALE50K, VIP100K..." />
                </Form.Item>
                <Form.Item name="giam_tien" label="Số tiền giảm (đ)" rules={[{ required: true }]}>
                  <InputNumber min={1} max={1e9} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="don_toi_thieu" label="Giá trị đơn tối thiểu (đ)" initialValue={0}>
                  <InputNumber min={0} max={1e12} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="so_luot" label="Tổng lượt sử dụng" rules={[{ required: true }]}>
                  <InputNumber min={1} max={1e6} precision={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="bat_dau" label="Bắt đầu" rules={[{ required: true }]}>
                  <Input type="datetime-local" />
                </Form.Item>
                <Form.Item name="ket_thuc" label="Kết thúc" rules={[{ required: true }]}>
                  <Input type="datetime-local" />
                </Form.Item>
                <Form.Item
                  name="tai_khoan_rieng"
                  label="Kích hoạt riêng ngay cho tài khoản (Tùy chọn: Nhập SĐT hoặc Tên đăng nhập)"
                  help="Nếu nhập, hệ thống sẽ tự động gán mã giảm giá này trực tiếp vào ví của khách hàng đó."
                >
                  <Input prefix={<UserOutlined />} placeholder="Ví dụ: 0912345678 hoặc dung2005" allowClear />
                </Form.Item>
              </>
            ) : (
              <>
                <Form.Item name="ma_san_pham" label="Sản phẩm" rules={[{ required: true }]}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={(products.data || []).map((p) => ({ value: p.ma_san_pham, label: p.ten_san_pham }))}
                    onChange={async (id: number) => {
                      form.setFieldValue('ma_bien_the', undefined);
                      try {
                        const r = await api.get(`/san-pham/${id}`);
                        setVariants(r.data.data.variants || []);
                      } catch (e) {
                        message.error(errorMessage(e));
                      }
                    }}
                  />
                </Form.Item>
                <Form.Item name="ma_bien_the" label="Biến thể" rules={[{ required: variants.length > 0 }]}>
                  <Select
                    allowClear
                    disabled={!variants.length}
                    options={variants.map((v) => ({ value: v.ma_bien_the, label: v.ten_bien_the }))}
                  />
                </Form.Item>
                <Form.Item name="so_luong" label="Số lượng nhập" rules={[{ required: true }]}>
                  <InputNumber min={1} max={1e6} precision={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="ghi_chu" label="Ghi chú">
                  <Input.TextArea maxLength={500} />
                </Form.Item>
              </>
            )}
            <Space>
              <Button htmlType="submit" type="primary" loading={busy}>
                Lưu
              </Button>
              <Button
                disabled={busy}
                onClick={() => {
                  form.resetFields();
                  setVariants([]);
                  setShowForm(false);
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form>
        </Card>
      )}

      <div className="card mt">
        <Space style={{ marginBottom: 16 }}>
          <Button onClick={result.reload}>Làm mới</Button>
        </Space>
        <Table
          rowKey={kind === 'vouchers' ? 'ma_voucher' : 'ma_nhap'}
          loading={result.loading}
          dataSource={result.data || []}
          scroll={{ x: 1000 }}
          columns={
            kind === 'vouchers'
              ? [
                  {
                    title: 'Mã',
                    dataIndex: 'ma_code',
                    render: (v) => <Tag color="green" style={{ fontWeight: 700, fontSize: 13 }}>{v}</Tag>,
                  },
                  {
                    title: 'Giảm',
                    dataIndex: 'giam_tien',
                    render: (value, r) =>
                      r.loai === 'PhanTram'
                        ? `${value}%${r.giam_toi_da != null ? ` (tối đa ${money(r.giam_toi_da)})` : ''}`
                        : money(value),
                  },
                  { title: 'Đơn tối thiểu', dataIndex: 'don_toi_thieu', render: money },
                  { title: 'Đã dùng', render: (_, r) => `${r.da_dung}/${r.so_luot}` },
                  { title: 'Lượt/khách', render: (_, r) => r.moi_khach || 'Không giới hạn' },
                  { title: 'Hết hạn', dataIndex: 'ket_thuc', render: dateTime },
                  {
                    title: 'Hoạt động',
                    render: (_, r) => (
                      <Switch
                        checked={Boolean(r.trang_thai)}
                        onChange={async (trang_thai) => {
                          try {
                            await api.put(`/shop/vouchers/${r.ma_voucher}`, { trang_thai });
                            await result.reload();
                          } catch (e) {
                            message.error(errorMessage(e));
                          }
                        }}
                      />
                    ),
                  },
                  {
                    title: 'Cấp riêng',
                    render: (_, r) => (
                      <Tooltip title="Nhập SĐT hoặc Tên đăng nhập để kích hoạt voucher này riêng cho khách hàng">
                        <Button
                          size="small"
                          type="primary"
                          ghost
                          icon={<GiftOutlined />}
                          onClick={() => openGrantModal(r)}
                        >
                          Tặng khách
                        </Button>
                      </Tooltip>
                    ),
                  },
                ]
              : [
                  { title: 'Sản phẩm', dataIndex: 'ten_san_pham' },
                  { title: 'Biến thể', dataIndex: 'ten_bien_the' },
                  { title: 'Số lượng', dataIndex: 'so_luong' },
                  { title: 'Người nhập', dataIndex: 'ho_ten' },
                  { title: 'Ngày nhập', dataIndex: 'ngay_nhap', render: dateTime },
                  { title: 'Ghi chú', dataIndex: 'ghi_chu' },
                ]
          }
        />
      </div>

      {/* Modal Kích hoạt Voucher riêng cho tài khoản */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
            <GiftOutlined style={{ color: '#176B52', fontSize: 20 }} />
            <span>Kích hoạt Voucher riêng cho Tài khoản</span>
          </div>
        }
        open={showGrantModal}
        onCancel={() => {
          setShowGrantModal(false);
          setFoundUser(null);
          setLookupError('');
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={grantForm} layout="vertical" onFinish={handleGrantVoucher} style={{ marginTop: 16 }}>
          <Form.Item
            name="ma_voucher"
            label="Chọn Mã giảm giá"
            rules={[{ required: true, message: 'Vui lòng chọn mã giảm giá cần kích hoạt.' }]}
          >
            <Select
              placeholder="Chọn mã voucher"
              showSearch
              optionFilterProp="label"
              options={(result.data || []).map((v) => ({
                value: v.ma_voucher,
                label: `${v.ma_code} (Giảm ${money(v.giam_tien)} - Đơn từ ${money(v.don_toi_thieu)})`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="tai_khoan"
            label="Số điện thoại hoặc Tên đăng nhập khách hàng"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại hoặc tên đăng nhập của khách hàng.' }]}
            help="Hệ thống sẽ tra cứu và kích hoạt voucher trực tiếp vào ví của khách hàng này."
          >
            <Space.Compact style={{ width: '100%' }}>
              <Input
                prefix={<UserOutlined style={{ color: '#176B52' }} />}
                placeholder="Ví dụ: 0912345678 hoặc dung2005"
                allowClear
                onPressEnter={handleLookupUser}
              />
              <Button
                icon={<SearchOutlined />}
                loading={lookingUpUser}
                onClick={handleLookupUser}
              >
                Kiểm tra
              </Button>
            </Space.Compact>
          </Form.Item>

          {/* User Lookup Preview */}
          {foundUser && (
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              style={{ marginBottom: 16 }}
              message={
                <div>
                  <div style={{ fontWeight: 700, color: '#135200' }}>
                    {foundUser.ho_ten || foundUser.ten_dang_nhap} (ID: #{foundUser.ma_tai_khoan})
                  </div>
                  <div style={{ fontSize: 12, color: '#389e0d', marginTop: 2 }}>
                    📱 SĐT: {foundUser.so_dien_thoai || 'Chưa cập nhật'} | 👤 Username: {foundUser.ten_dang_nhap} | 🪙 Xu: {foundUser.diem_thuong || 0}
                  </div>
                </div>
              }
            />
          )}

          {lookupError && (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              message={lookupError}
            />
          )}

          <Form.Item
            name="so_ngay_hieu_luc"
            label="Thời hạn sử dụng sau khi kích hoạt (ngày)"
            initialValue={30}
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={365} style={{ width: '100%' }} />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <Button
              onClick={() => {
                setShowGrantModal(false);
                setFoundUser(null);
                setLookupError('');
              }}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={granting}
              icon={<GiftOutlined />}
              style={{ backgroundColor: '#176B52', borderColor: '#176B52' }}
            >
              Kích hoạt vào Ví khách hàng
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
