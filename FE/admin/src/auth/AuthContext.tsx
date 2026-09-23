import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth.api';
import type { User } from '../types';
import { errorMessage } from '../utils/errors';

interface AuthState { user: User | null; loading: boolean; error: string; restore: () => Promise<void>; login: (username: string, password: string) => Promise<void>; logout: () => void }
const AuthContext = createContext<AuthState | null>(null);
const allowed = (user: User) => user.trang_thai === 'HoatDong' && ['Admin', 'NhanVien'].includes(user.vai_tro);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const logout = useCallback(() => {
    generation.current++; localStorage.removeItem('admin_token'); localStorage.removeItem('admin_user'); setUser(null); setError(''); setLoading(false);
  }, []);
  const restore = useCallback(async () => {
    const current = ++generation.current;
    if (!localStorage.getItem('admin_token')) { setUser(null); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const { data } = await authApi.me();
      if (current !== generation.current) return;
      if (!data.data || !allowed(data.data)) { logout(); return; }
      setUser(data.data); localStorage.removeItem('admin_user');
    } catch (e) { if (current === generation.current) setError(errorMessage(e)); }
    finally { if (current === generation.current) setLoading(false); }
  }, [logout]);
  useEffect(() => {
    void restore();
    const storage = (e: StorageEvent) => { if (e.key === 'admin_token') void restore(); };
    window.addEventListener('admin:unauthorized', logout); window.addEventListener('storage', storage);
    return () => { generation.current++; window.removeEventListener('admin:unauthorized', logout); window.removeEventListener('storage', storage); };
  }, [logout, restore]);
  const login = async (username: string, password: string) => {
    const { data } = await authApi.login({ ten_dang_nhap: username, mat_khau: password });
    if (!data.data?.user || !allowed(data.data.user)) { logout(); throw new Error('Tài khoản không có quyền truy cập quản trị.'); }
    generation.current++; localStorage.setItem('admin_token', data.data.token); localStorage.removeItem('admin_user'); setUser(data.data.user); setError('');
  };
  return <AuthContext.Provider value={{ user, loading, error, restore, login, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const auth = useContext(AuthContext); if (!auth) throw new Error('Thiếu AuthProvider'); return auth; }
