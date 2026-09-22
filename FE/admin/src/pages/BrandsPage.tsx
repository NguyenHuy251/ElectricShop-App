import { type FormEvent, useEffect, useState } from 'react';
import { api } from '../api/api';
import type { Brand } from '../types';
import AdminSidebar from '../components/AdminSidebar';

const emptyForm = { ten_thuong_hieu: '', quoc_gia: '', mo_ta: '' };

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadBrands = async () => {
    setLoading(true);
    try {
      const response = await api.get('/thuong-hieu');
      setBrands(response.data.data || []);
      setError('');
    } catch {
      setError('Không thể tải danh sách thương hiệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBrands(); }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.ten_thuong_hieu.trim()) return;

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/thuong-hieu/${editingId}`, form);
      } else {
        await api.post('/thuong-hieu', form);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadBrands();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Không thể lưu thương hiệu');
    } finally {
      setSaving(false);
    }
  };

  const editBrand = (brand: Brand) => {
    setEditingId(brand.ma_thuong_hieu);
    setForm({ ten_thuong_hieu: brand.ten_thuong_hieu, quoc_gia: brand.quoc_gia || '', mo_ta: brand.mo_ta || '' });
  };

  const deleteBrand = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa thương hiệu này?')) return;
    try {
      await api.delete(`/thuong-hieu/${id}`);
      await loadBrands();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Không thể xóa thương hiệu');
    }
  };

  return (
    <div className="layout">
      <AdminSidebar />
      <main className="main">
        <div className="topbar"><strong>Quản lý thương hiệu</strong></div>
        <div className="page">
          {error ? <div className="error-box">{error}</div> : null}
          <div className="card">
            <h3>{editingId ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="field"><label>Tên thương hiệu</label><input required value={form.ten_thuong_hieu} onChange={(event) => setForm({ ...form, ten_thuong_hieu: event.target.value })} /></div>
                <div className="field"><label>Quốc gia</label><input value={form.quoc_gia} onChange={(event) => setForm({ ...form, quoc_gia: event.target.value })} /></div>
                <div className="field" style={{ gridColumn: '1 / -1' }}><label>Mô tả</label><textarea rows={3} value={form.mo_ta} onChange={(event) => setForm({ ...form, mo_ta: event.target.value })} /></div>
              </div>
              <div className="actions mt"><button className="primary-btn" type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>{editingId ? <button className="secondary-btn" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Hủy</button> : null}</div>
            </form>
          </div>
          <div className="card mt">
            {loading ? <p>Đang tải...</p> : <table className="table"><thead><tr><th>Mã</th><th>Tên</th><th>Quốc gia</th><th>Thao tác</th></tr></thead><tbody>{brands.map((brand) => <tr key={brand.ma_thuong_hieu}><td>{brand.ma_thuong_hieu}</td><td>{brand.ten_thuong_hieu}</td><td>{brand.quoc_gia || '-'}</td><td><button className="secondary-btn" onClick={() => editBrand(brand)}>Sửa</button>{' '}<button className="danger-btn" onClick={() => deleteBrand(brand.ma_thuong_hieu)}>Xóa</button></td></tr>)}</tbody></table>}
          </div>
        </div>
      </main>
    </div>
  );
}
