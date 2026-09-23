import { useState } from 'react';
import { Alert, Button, Form, Input } from 'antd';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { errorMessage } from '../utils/errors';
export default function LoginPage() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  if (user) return <Navigate to="/dashboard" replace />;
  return <div className="login-page"><div className="login-box"><h2>Đăng nhập quản trị</h2>
    {error && <Alert type="error" showIcon message={error} />}
    <Form layout="vertical" onFinish={async (values: { username: string; password: string }) => {
      if (loading) return; setLoading(true); setError('');
      try { await login(values.username, values.password); } catch (e) { setError(errorMessage(e)); } finally { setLoading(false); }
    }}>
      <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, whitespace: true, message: 'Nhập tên đăng nhập' }]}><Input autoComplete="username" /></Form.Item>
      <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu' }]}><Input.Password autoComplete="current-password" /></Form.Item>
      <Button type="primary" htmlType="submit" loading={loading} block>Đăng nhập</Button>
    </Form></div></div>;
}
