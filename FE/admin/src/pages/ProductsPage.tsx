import { type FormEvent, useEffect, useState } from 'react';
import { api } from '../api/api';
import type { Brand, Category, Product } from '../types';
import AdminSidebar from '../components/AdminSidebar';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    ma_san_pham_code: '',
    ten_san_pham: '',
    ma_danh_muc: 1,
    ma_thuong_hieu: 1,
    gia_ban: 0,
    gia_nhap: 0,
    so_luong: 0,
    bao_hanh: 12,
    hinh_anh: '',
    mo_ta: '',
    trang_thai: 'DangBan',
  });

  const loadProducts = async () => {
    try {
      const [productsResponse, categoriesResponse, brandsResponse] = await Promise.all([
        api.get('/san-pham'), api.get('/danh-muc'), api.get('/thuong-hieu'),
      ]);
      setProducts(productsResponse.data.data || []);
      setCategories(categoriesResponse.data.data || []);
      setBrands(brandsResponse.data.data || []);
      setError('');
    } catch {
      setError('Không thể tải dữ liệu sản phẩm, danh mục hoặc thương hiệu');
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.ma_san_pham_code.trim() || !form.ten_san_pham.trim() || form.gia_ban <= 0) return;
    try {
      if (editingId) await api.put(`/san-pham/${editingId}`, form);
      else await api.post('/san-pham', form);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Không thể lưu sản phẩm');
      return;
    }
    setEditingId(null);
    setShowForm(false);
    setForm({
      ma_san_pham_code: '',
      ten_san_pham: '',
      ma_danh_muc: 1,
      ma_thuong_hieu: 1,
      gia_ban: 0,
      gia_nhap: 0,
      so_luong: 0,
      bao_hanh: 12,
      hinh_anh: '',
      mo_ta: '',
      trang_thai: 'DangBan',
    });
    await loadProducts();
  };

  const deleteProduct = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      await api.delete(`/san-pham/${id}`);
      await loadProducts();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Không thể xóa sản phẩm');
    }
  };

  return (
    <div className="layout">
      <AdminSidebar />
      <main className="main">
        <div className="topbar"><strong>Quản lý sản phẩm</strong></div>
        <div className="page">
          {error ? <div className="error-box">{error}</div> : null}
          <div className="page-heading"><div><span className="eyebrow">KHO HÀNG</span><h1 className="page-title">Sản phẩm</h1></div><button className="primary-btn add-product-btn" onClick={() => { setEditingId(null); setShowForm(true); }}>+ Thêm sản phẩm</button></div>
          {showForm ? <div className="card">
            <div className="row"><h3>{editingId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</h3><button className="secondary-btn" type="button" onClick={() => { setShowForm(false); setEditingId(null); }}>Đóng</button></div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="field"><label>Mã SP</label><input required value={form.ma_san_pham_code} onChange={(e) => setForm({ ...form, ma_san_pham_code: e.target.value })} /></div>
                <div className="field"><label>Tên sản phẩm</label><input required value={form.ten_san_pham} onChange={(e) => setForm({ ...form, ten_san_pham: e.target.value })} /></div>
                <div className="field"><label>Danh mục</label><select value={form.ma_danh_muc} onChange={(e) => setForm({ ...form, ma_danh_muc: Number(e.target.value) })}>{categories.map((category) => <option key={category.ma_danh_muc} value={category.ma_danh_muc}>{category.ten_danh_muc}</option>)}</select></div>
                <div className="field"><label>Thương hiệu</label><select value={form.ma_thuong_hieu} onChange={(e) => setForm({ ...form, ma_thuong_hieu: Number(e.target.value) })}>{brands.map((brand) => <option key={brand.ma_thuong_hieu} value={brand.ma_thuong_hieu}>{brand.ten_thuong_hieu}</option>)}</select></div>
                <div className="field"><label>Giá nhập</label><input type="number" value={form.gia_nhap} onChange={(e) => setForm({ ...form, gia_nhap: Number(e.target.value) })} /></div>
                <div className="field"><label>Giá bán</label><input required type="number" value={form.gia_ban} onChange={(e) => setForm({ ...form, gia_ban: Number(e.target.value) })} /></div>
                <div className="field"><label>Số lượng</label><input type="number" value={form.so_luong} onChange={(e) => setForm({ ...form, so_luong: Number(e.target.value) })} /></div>
                <div className="field"><label>Bảo hành</label><input type="number" value={form.bao_hanh} onChange={(e) => setForm({ ...form, bao_hanh: Number(e.target.value) })} /></div>
                <div className="field"><label>Trạng thái</label><select value={form.trang_thai} onChange={(e) => setForm({ ...form, trang_thai: e.target.value as any })}><option value="DangBan">Đang bán</option><option value="HetHang">Hết hàng</option><option value="NgungBan">Ngừng bán</option></select></div>
                <div className="field"><label>URL hình ảnh</label><input type="url" placeholder="https://..." value={form.hinh_anh} onChange={(e) => setForm({ ...form, hinh_anh: e.target.value })} /></div>
                <div className="field" style={{ gridColumn: '1 / -1' }}><label>Mô tả</label><textarea rows={4} value={form.mo_ta} onChange={(e) => setForm({ ...form, mo_ta: e.target.value })} /></div>
              </div>
              {form.hinh_anh ? <img className="product-preview" src={form.hinh_anh} alt="Xem trước sản phẩm" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : null}
              <div className="actions mt"><button className="primary-btn" type="submit">Lưu sản phẩm</button>{editingId ? <button className="secondary-btn" type="button" onClick={() => { setShowForm(false); setEditingId(null); }}>Hủy</button> : null}</div>
            </form>
          </div> : null}

          <div className="card mt">
            <table className="table">
              <thead>
                <tr><th>Ảnh</th><th>Mã</th><th>Tên</th><th>Giá</th><th>Số lượng</th><th>Trạng thái</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.ma_san_pham}>
                    <td>{p.hinh_anh ? <img className="product-thumb" src={p.hinh_anh} alt={p.ten_san_pham} onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <span className="image-placeholder">Chưa có</span>}</td>
                    <td>{p.ma_san_pham_code}</td>
                    <td>{p.ten_san_pham}</td>
                    <td>{Number(p.gia_ban).toLocaleString()}đ</td>
                    <td>{p.so_luong}</td>
                    <td><span className="badge success">{p.trang_thai}</span></td>
                    <td><button className="secondary-btn" onClick={() => { setEditingId(p.ma_san_pham); setShowForm(true); setForm({ ma_san_pham_code: p.ma_san_pham_code, ten_san_pham: p.ten_san_pham, ma_danh_muc: p.ma_danh_muc, ma_thuong_hieu: p.ma_thuong_hieu, gia_ban: Number(p.gia_ban), gia_nhap: Number(p.gia_nhap || 0), so_luong: p.so_luong, bao_hanh: p.bao_hanh || 12, hinh_anh: p.hinh_anh || '', mo_ta: p.mo_ta || '', trang_thai: p.trang_thai }); }}>Sửa</button>{' '}<button className="danger-btn" onClick={() => deleteProduct(p.ma_san_pham)}>Xóa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
