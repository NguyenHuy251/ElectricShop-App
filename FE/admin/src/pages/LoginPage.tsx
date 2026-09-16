import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';

export default function LoginPage() {
  const [ten_dang_nhap, setUserName] = useState('admin');
  const [mat_khau, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.login({ ten_dang_nhap, mat_khau });
      const token = response.data.data.token;
      const user = response.data.data.user;

      if (user.vai_tro !== 'Admin' && user.vai_tro !== 'NhanVien') {
        throw new Error('Tài khoản không có quyền truy cập Admin');
      }

      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Tên đăng nhập</label>
            <input value={ten_dang_nhap} onChange={(e) => setUserName(e.target.value)} />
          </div>
          <div className="field mt">
            <label>Mật khẩu</label>
            <input type="password" value={mat_khau} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="mt">
            <button className="primary-btn" type="submit" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
