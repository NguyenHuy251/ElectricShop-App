import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, App, Button, Form, Input, Modal, Space, Tag } from 'antd';
import { SafetyCertificateOutlined, UserAddOutlined } from '@ant-design/icons';
import EmployeePermissionsModal from '../components/EmployeePermissionsModal';
import { permissionApi, type StaffAccount } from '../api/permission.api';
import { errorMessage, fieldErrors } from '../utils/errors';
import ResourcePage from '../components/ResourcePage';
import LoadError from '../components/LoadError';
import { employeeApi } from '../api/employee.api';
import { customerApi } from '../api/customer.api';
import { useLoad } from '../hooks/useLoad';
import { dateTime, money, options, Status } from '../utils/format';
import type { Employee } from '../types';
export default function EmployeesPage() {
  const [params, setParams] = useSearchParams();
  const permissionState = useLoad(useCallback(() => permissionApi.list(), []));
  const permissionData = permissionState.data?.data;
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [permissionAccount, setPermissionAccount] = useState<StaffAccount | null>(null);
  const openPermissions = (account: StaffAccount | null) => { setPermissionAccount(account); setPermissionOpen(true); };
  useEffect(() => {
    const account = permissionData?.accounts.find(item => item.ma_tai_khoan === Number(params.get('account')));
    if (account) { setPermissionAccount(account); setPermissionOpen(true); setParams({}, { replace: true }); }
  }, [permissionData, params, setParams]);
  const loader = useCallback(() => customerApi.list(), []);
  const accounts = useLoad(loader);
  const { message } = App.useApp();
  const [accountForm] = Form.useForm();
  const [selected, setSelected] = useState<Employee | null>(null);
  const [creating, setCreating] = useState(false);
  const saving = useRef(false);
  const reloadEmployees = useRef<(() => Promise<void>) | null>(null);
  return <><ResourcePage<Employee> title="Nhân viên" idKey="ma_nhan_vien" api={employeeApi} searchKeys={['ho_ten', 'email', 'so_dien_thoai', 'chuc_vu']} defaults={{ trang_thai: 'DangLam', luong: 0 }}
    rowActions={(row, reload) => !row.ma_tai_khoan ? <Button icon={<UserAddOutlined />} disabled={creating} onClick={() => {
      reloadEmployees.current = reload; accountForm.resetFields(); accountForm.setFieldsValue({ email: row.email || '' }); setSelected(row);
    }}>Tạo tài khoản</Button> : permissionData?.accounts.find(account => account.ma_tai_khoan === row.ma_tai_khoan) ? <Button aria-label="Phân quyền" icon={<SafetyCertificateOutlined />} disabled={permissionOpen} onClick={() => openPermissions(permissionData!.accounts.find(account => account.ma_tai_khoan === row.ma_tai_khoan)!)}>Phân quyền</Button> : null}
    extra={<><LoadError error={accounts.error} retry={accounts.reload} /><LoadError error={permissionState.error} retry={permissionState.reload} /><Space wrap style={{ marginBottom: 16 }}><Button aria-label="Phân quyền tài khoản" icon={<SafetyCertificateOutlined />} loading={permissionState.loading} disabled={!permissionData || permissionOpen} onClick={() => openPermissions(null)}>Phân quyền tài khoản</Button><span className="permission-secondary">Cấp quyền trực tiếp hoặc chọn tài khoản chưa liên kết hồ sơ nhân viên.</span></Space></>} filter={{ key: 'trang_thai', options: options(['DangLam', 'NghiLam']) }} prepare={row => ({ ...row, ngay_vao_lam: row.ngay_vao_lam?.slice(0, 10) })}
    columns={[{ title: 'Họ tên', dataIndex: 'ho_ten' }, { title: 'Tài khoản', dataIndex: 'ma_tai_khoan', render: value => accounts.data?.data?.find(a => a.ma_tai_khoan === value)?.ten_dang_nhap || value || 'Chưa liên kết' }, { title: 'Quyền nghiệp vụ', render: (_, row) => {
      if (!row.ma_tai_khoan) return <span className="permission-secondary">Chưa có tài khoản</span>;
      if (accounts.data?.data?.find(account => account.ma_tai_khoan === row.ma_tai_khoan)?.vai_tro === 'Admin') return <Tag color="gold">Toàn quyền Admin</Tag>;
      const account = permissionData?.accounts.find(item => item.ma_tai_khoan === row.ma_tai_khoan);
      if (!account) return <span className="permission-secondary">{permissionState.error ? 'Không tải được quyền' : 'Đang tải quyền...'}</span>;
      return account.permissions.length ? <Space wrap>{account.permissions.map(code => <Tag color="cyan" key={code}>{permissionData?.groups.find(group => group.code === code)?.name}</Tag>)}</Space> : <Tag>Chưa cấp quyền</Tag>;
    } }, { title: 'Chức vụ', dataIndex: 'chuc_vu' }, { title: 'Ngày vào làm', dataIndex: 'ngay_vao_lam', render: dateTime }, { title: 'Lương', dataIndex: 'luong', render: money }, { title: 'Trạng thái', dataIndex: 'trang_thai', render: value => <Status value={value} /> }]}
    fields={[{ name: 'ho_ten', label: 'Họ tên', required: true, rules: [{ whitespace: true, message: 'Nhập họ tên' }] }, { name: 'ma_tai_khoan', label: 'Tài khoản liên kết', kind: 'select', options: (accounts.data?.data || []).filter(a => a.vai_tro !== 'KhachHang').map(a => ({ value: a.ma_tai_khoan, label: a.ten_dang_nhap })) }, { name: 'chuc_vu', label: 'Chức vụ' }, { name: 'email', label: 'Email', rules: [{ type: 'email', message: 'Email không hợp lệ' }] }, { name: 'so_dien_thoai', label: 'Số điện thoại' }, { name: 'ngay_vao_lam', label: 'Ngày vào làm', kind: 'date' }, { name: 'luong', label: 'Lương', kind: 'number' }, { name: 'trang_thai', label: 'Trạng thái', kind: 'select', required: true, options: options(['DangLam', 'NghiLam']) }]} />
    <Modal open={Boolean(selected)} title={`Tạo tài khoản cho ${selected?.ho_ten || 'nhân viên'}`} okText="Tạo và liên kết" cancelText="Hủy" confirmLoading={creating} cancelButtonProps={{ disabled: creating }} onCancel={() => { if (!saving.current) { setSelected(null); accountForm.resetFields(); } }} onOk={() => accountForm.submit()} destroyOnClose>
      <Alert type="info" showIcon message="Tài khoản có vai trò Nhân viên và được liên kết với hồ sơ này." description={selected?.trang_thai === 'NghiLam' ? 'Nhân viên đã nghỉ làm: tài khoản mới sẽ ở trạng thái khóa.' : 'Sau khi tạo tài khoản, hãy bấm Phân quyền để chọn các nhóm nghiệp vụ cho nhân viên.'} style={{ marginBottom: 20 }} />
      <Form form={accountForm} layout="vertical" disabled={creating} onFinish={async (values: { ten_dang_nhap: string; mat_khau: string; email: string }) => {
        if (!selected || saving.current) return;
        saving.current = true; setCreating(true);
        try {
          await employeeApi.createAccount(selected.ma_nhan_vien, { ...values, ten_dang_nhap: values.ten_dang_nhap.trim(), email: values.email.trim() });
          message.success('Đã tạo và liên kết tài khoản nhân viên');
          setSelected(null); accountForm.resetFields();
          await Promise.all([accounts.reload(), permissionState.reload(), reloadEmployees.current?.()]);
        } catch (error) { fieldErrors(error, accountForm); message.error(errorMessage(error)); }
        finally { saving.current = false; setCreating(false); }
      }}>
        <Form.Item name="ten_dang_nhap" label="Tên đăng nhập" rules={[{ required: true, message: 'Nhập tên đăng nhập' }, { pattern: /^[A-Za-z0-9_.-]{3,50}$/, message: 'Dùng 3–50 ký tự chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.' }]}><Input autoComplete="off" maxLength={50} /></Form.Item>
        <Form.Item name="email" label="Email tài khoản" rules={[{ required: true, message: 'Nhập email tài khoản' }, { type: 'email', message: 'Email không hợp lệ' }]}><Input type="email" maxLength={100} autoComplete="off" /></Form.Item>
        <Form.Item name="mat_khau" label="Mật khẩu ban đầu" rules={[{ required: true, message: 'Nhập mật khẩu ban đầu' }, { validator: (_, value) => !value || (value.length >= 8 && new TextEncoder().encode(value).length <= 72) ? Promise.resolve() : Promise.reject(new Error('Mật khẩu tối thiểu 8 ký tự và tối đa 72 byte.')) }]}><Input.Password autoComplete="new-password" /></Form.Item>
      </Form>
    </Modal><EmployeePermissionsModal open={permissionOpen} account={permissionAccount} data={permissionData} onClose={() => setPermissionOpen(false)} onSaved={permissionState.reload} /></>;
}
