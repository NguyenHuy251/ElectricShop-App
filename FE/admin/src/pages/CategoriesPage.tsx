import { type FormEvent, useEffect, useState } from 'react';
import { api } from '../api/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ ten_danh_muc: '', mo_ta: '', trang_thai: true });

  const loadCategories = async () => {
    const response = await api.get('/danh-muc');
    setCategories(response.data.data || []);
  };

  useEffect(() => { loadCategories(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await api.post('/danh-muc', form);
    setForm({ ten_danh_muc: '', mo_ta: '', trang_thai: true });
    loadCategories();
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h3>AppElectricShop</h3>
        <a href="/dashboard">Dashboard</a>
        <a href="/products">Sản phẩm</a>
        <a href="/categories">Danh mục</a>
        <a href="/orders">Đơn hàng</a>
      </aside>
      <main className="main">
        <div className="topbar"><strong>Quản lý danh mục</strong></div>
        <div className="page">
          <div className="card">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="field"><label>Tên danh mục</label><input value={form.ten_danh_muc} onChange={(e) => setForm({ ...form, ten_danh_muc: e.target.value })} /></div>
                <div className="field"><label>Trạng thái</label><select value={String(form.trang_thai)} onChange={(e) => setForm({ ...form, trang_thai: e.target.value === 'true' })}><option value="true">Hoạt động</option><option value="false">Tắt</option></select></div>
                <div className="field" style={{ gridColumn: '1 / -1' }}><label>Mô tả</label><textarea rows={4} value={form.mo_ta} onChange={(e) => setForm({ ...form, mo_ta: e.target.value })} /></div>
              </div>
              <div className="actions mt"><button className="primary-btn" type="submit">Lưu</button></div>
            </form>
          </div>
          <div className="card mt">
            <table className="table">
              <thead><tr><th>Mã</th><th>Tên</th><th>Trạng thái</th></tr></thead>
              <tbody>{categories.map((item) => <tr key={item.ma_danh_muc}><td>{item.ma_danh_muc}</td><td>{item.ten_danh_muc}</td><td>{item.trang_thai ? 'Hoạt động' : 'Tắt'}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
