import { type FormEvent, useEffect, useState } from 'react';
import { api } from '../api/api';
import type { Category } from '../types';
import AdminSidebar from '../components/AdminSidebar';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ ten_danh_muc: '', mo_ta: '', trang_thai: true });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadCategories = async () => {
    try {
      const response = await api.get('/danh-muc');
      setCategories(response.data.data || []);
      setError('');
    } catch {
      setError('Không thể tải danh sách danh mục');
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.ten_danh_muc.trim()) return;
    try {
      if (editingId) await api.put(`/danh-muc/${editingId}`, form);
      else await api.post('/danh-muc', form);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Không thể lưu danh mục');
      return;
    }
    setEditingId(null);
    setForm({ ten_danh_muc: '', mo_ta: '', trang_thai: true });
    await loadCategories();
  };

  const deleteCategory = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
      await api.delete(`/danh-muc/${id}`);
      await loadCategories();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Không thể xóa danh mục');
    }
  };

  return (
    <div className="layout">
      <AdminSidebar />
      <main className="main">
        <div className="topbar"><strong>Quản lý danh mục</strong></div>
        <div className="page">
          {error ? <div className="error-box">{error}</div> : null}
          <div className="card">
            <h3>{editingId ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="field"><label>Tên danh mục</label><input value={form.ten_danh_muc} onChange={(e) => setForm({ ...form, ten_danh_muc: e.target.value })} /></div>
                <div className="field"><label>Trạng thái</label><select value={String(form.trang_thai)} onChange={(e) => setForm({ ...form, trang_thai: e.target.value === 'true' })}><option value="true">Hoạt động</option><option value="false">Tắt</option></select></div>
                <div className="field" style={{ gridColumn: '1 / -1' }}><label>Mô tả</label><textarea rows={4} value={form.mo_ta} onChange={(e) => setForm({ ...form, mo_ta: e.target.value })} /></div>
              </div>
              <div className="actions mt"><button className="primary-btn" type="submit">Lưu</button>{editingId ? <button className="secondary-btn" type="button" onClick={() => { setEditingId(null); setForm({ ten_danh_muc: '', mo_ta: '', trang_thai: true }); }}>Hủy</button> : null}</div>
            </form>
          </div>
          <div className="card mt">
            <table className="table">
              <thead><tr><th>Mã</th><th>Tên</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>{categories.map((item) => <tr key={item.ma_danh_muc}><td>{item.ma_danh_muc}</td><td>{item.ten_danh_muc}</td><td>{item.trang_thai ? 'Hoạt động' : 'Tắt'}</td><td><button className="secondary-btn" onClick={() => { setEditingId(item.ma_danh_muc); setForm({ ten_danh_muc: item.ten_danh_muc, mo_ta: item.mo_ta || '', trang_thai: Boolean(item.trang_thai) }); }}>Sửa</button>{' '}<button className="danger-btn" onClick={() => deleteCategory(item.ma_danh_muc)}>Xóa</button></td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
