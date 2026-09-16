import { useEffect, useState } from 'react';
import { api } from '../api/api';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await api.get('/nhan-vien');
      setEmployees(response.data.data || []);
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
        <div className="topbar"><strong>Quản lý nhân viên</strong></div>
        <div className="page">
          <div className="card">
            <table className="table">
              <thead><tr><th>Mã</th><th>Họ tên</th><th>Chức vụ</th><th>Trạng thái</th></tr></thead>
              <tbody>{employees.map((emp) => <tr key={emp.ma_nhan_vien}><td>{emp.ma_nhan_vien}</td><td>{emp.ho_ten}</td><td>{emp.chuc_vu || '-'}</td><td>{emp.trang_thai || 'DangLam'}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
