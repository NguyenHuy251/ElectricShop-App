import { Alert, App, Button, Card, Form, Input } from 'antd';
import { useState } from 'react';
import { api } from '../api/api';
import { useAuth } from '../auth/AuthContext';
import { errorMessage } from '../utils/errors';

export default function AccountPage() {
  const {user,restore,logout}=useAuth();
  const {message}=App.useApp();
  const [busy,setBusy]=useState(false);
  const [passwordForm]=Form.useForm();
  const save=async(url:string,values:unknown)=>{
    setBusy(true);
    try{await api.put(url,values);message.success('Đã lưu thay đổi');if(url==='/auth/me')await restore();else {passwordForm.resetFields();logout();}}
    catch(err){message.error(errorMessage(err));}finally{setBusy(false);}
  };
  return <><h1 className="page-title">Tài khoản của tôi</h1>{user?.vai_tro === 'NhanVien' && !user.permissions?.length && <Alert type="info" showIcon message="Tài khoản chưa được cấp quyền nghiệp vụ. Hãy liên hệ quản trị viên để được phân quyền." style={{ marginBottom: 20 }} />}<Card title="Hồ sơ"><Form layout="vertical" initialValues={user || {}} onFinish={v=>save('/auth/me',v)}>
    <Form.Item name="ho_ten" label="Họ tên" rules={[{required:true,max:100}]}><Input/></Form.Item>
    <Form.Item name="email" label="Email" rules={[{required:true,type:'email'}]}><Input/></Form.Item>
    <Form.Item name="so_dien_thoai" label="Điện thoại"><Input maxLength={15}/></Form.Item><Form.Item name="dia_chi" label="Địa chỉ"><Input maxLength={255}/></Form.Item>
    <Button htmlType="submit" type="primary" loading={busy}>Lưu hồ sơ</Button></Form></Card>
    <Card title="Đổi mật khẩu" className="mt"><Form form={passwordForm} layout="vertical" onFinish={({confirm,...v})=>save('/auth/password',v)}>
    <Form.Item name="mat_khau_cu" label="Mật khẩu hiện tại" rules={[{required:true}]}><Input.Password autoComplete="current-password"/></Form.Item>
    <Form.Item name="mat_khau_moi" label="Mật khẩu mới" rules={[{required:true,min:8,max:72}]}><Input.Password autoComplete="new-password"/></Form.Item>
    <Form.Item name="confirm" label="Nhập lại mật khẩu mới" dependencies={['mat_khau_moi']} rules={[{required:true},({getFieldValue})=>({validator:(_,v)=>v===getFieldValue('mat_khau_moi') ? Promise.resolve() : Promise.reject(new Error('Mật khẩu không khớp'))})]}><Input.Password autoComplete="new-password"/></Form.Item>
    <Button htmlType="submit" type="primary" loading={busy}>Đổi mật khẩu</Button></Form></Card></>;
}
