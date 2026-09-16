import { type FormEvent, useEffect, useState } from 'react';
import { api } from '../api/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({
    ma_san_pham_code: '',
    ten_san_pham: '',
    ma_danh_muc: 1,
    ma_thuong_hieu: 1,
    gia_ban: 0,
    gia_nhap: 0,
    so_luong: 0,
    bao_hanh: 12,
    mo_ta: '',
    trang_thai: 'DangBan',
  });

  const loadProducts = async () => {
    const response = await api.get('/san-pham');
    setProducts(response.data.data || []);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await api.post('/san-pham', form);
    setForm({
      ma_san_pham_code: '',
      ten_san_pham: '',
      ma_danh_muc: 1,
      ma_thuong_hieu: 1,
      gia_ban: 0,
      gia_nhap: 0,
      so_luong: 0,
      bao_hanh: 12,
      mo_ta: '',
      trang_thai: 'DangBan',
    });
    loadProducts();
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h3>AppElectricShop</h3>
        <a href="/dashboard">Dashboard</a>
        <a href="/products">Sản phẩm</a>
        <a href="/categories">Danh mục</a>
        <a href="/orders">Đơn hàng</a>
        <a href="/customers">Khách hàng</a>
        <a href="/employees">Nhân viên</a>
        <a href="/reviews">Đánh giá</a>
        <a href="/contacts">Liên hệ</a>
      </aside>
      <main className="main">
        <div className="topbar"><strong>Quản lý sản phẩm</strong></div>
        <div className="page">
          <div className="card">
            <h3>Thêm sản phẩm</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="field"><label>Mã SP</label><input value={form.ma_san_pham_code} onChange={(e) => setForm({ ...form, ma_san_pham_code: e.target.value })} /></div>
                <div className="field"><label>Tên sản phẩm</label><input value={form.ten_san_pham} onChange={(e) => setForm({ ...form, ten_san_pham: e.target.value })} /></div>
                <div className="field"><label>Danh mục</label><input type="number" value={form.ma_danh_muc} onChange={(e) => setForm({ ...form, ma_danh_muc: Number(e.target.value) })} /></div>
                <div className="field"><label>Thương hiệu</label><input type="number" value={form.ma_thuong_hieu} onChange={(e) => setForm({ ...form, ma_thuong_hieu: Number(e.target.value) })} /></div>
                <div className="field"><label>Giá nhập</label><input type="number" value={form.gia_nhap} onChange={(e) => setForm({ ...form, gia_nhap: Number(e.target.value) })} /></div>
                <div className="field"><label>Giá bán</label><input type="number" value={form.gia_ban} onChange={(e) => setForm({ ...form, gia_ban: Number(e.target.value) })} /></div>
                <div className="field"><label>Số lượng</label><input type="number" value={form.so_luong} onChange={(e) => setForm({ ...form, so_luong: Number(e.target.value) })} /></div>
                <div className="field"><label>Bảo hành</label><input type="number" value={form.bao_hanh} onChange={(e) => setForm({ ...form, bao_hanh: Number(e.target.value) })} /></div>
                <div className="field"><label>Trạng thái</label><select value={form.trang_thai} onChange={(e) => setForm({ ...form, trang_thai: e.target.value as any })}><option value="DangBan">DangBan</option><option value="HetHang">HetHang</option><option value="NgungBan">NgungBan</option></select></div>
                <div className="field" style={{ gridColumn: '1 / -1' }}><label>Mô tả</label><textarea rows={4} value={form.mo_ta} onChange={(e) => setForm({ ...form, mo_ta: e.target.value })} /></div>
              </div>
              <div className="actions mt"><button className="primary-btn" type="submit">Lưu</button></div>
            </form>
          </div>

          <div className="card mt">
            <table className="table">
              <thead>
                <tr><th>Mã</th><th>Tên</th><th>Giá</th><th>Số lượng</th><th>Trạng thái</th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.ma_san_pham}>
                    <td>{p.ma_san_pham_code}</td>
                    <td>{p.ten_san_pham}</td>
                    <td>{Number(p.gia_ban).toLocaleString()}đ</td>
                    <td>{p.so_luong}</td>
                    <td><span className="badge success">{p.trang_thai}</span></td>
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
