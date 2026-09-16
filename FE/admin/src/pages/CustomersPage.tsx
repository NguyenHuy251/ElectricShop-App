import { useEffect, useState } from 'react';
import { api } from '../api/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await api.get('/tai-khoan');
      setCustomers((response.data.data || []).filter((u: any) => u.vai_tro === 'KhachHang'));
    };
    load();
  }, []);

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
        <div className="topbar"><strong>Quản lý khách hàng</strong></div>
        <div className="page">
          <div className="card">
            <table className="table">
              <thead><tr><th>Mã</th><th>Họ tên</th><th>Email</th><th>SĐT</th></tr></thead>
              <tbody>{customers.map((customer) => <tr key={customer.ma_tai_khoan}><td>{customer.ma_tai_khoan}</td><td>{customer.ho_ten}</td><td>{customer.email}</td><td>{customer.so_dien_thoai || '-'}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
