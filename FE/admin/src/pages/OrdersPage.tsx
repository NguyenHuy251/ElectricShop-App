import { useEffect, useState } from 'react';
import { api } from '../api/api';
import AdminSidebar from '../components/AdminSidebar';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  const loadOrders = async () => {
    const response = await api.get('/don-hang');
    setOrders(response.data.data || []);
  };

  useEffect(() => { loadOrders(); }, []);

  const updateStatus = async (id: number, status: string) => {
    await api.put(`/don-hang/${id}/trang-thai`, { trang_thai: status });
    loadOrders();
  };

  return (
    <div className="layout">
      <AdminSidebar />
      <main className="main">
        <div className="topbar"><strong>Quản lý đơn hàng</strong></div>
        <div className="page">
          <div className="card">
            <table className="table">
              <thead>
                <tr><th>Mã</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.ma_don_hang}>
                    <td>{order.ma_don_hang}</td>
                    <td>{order.ho_ten_nguoi_nhan}</td>
                    <td>{Number(order.tong_tien).toLocaleString()}đ</td>
                    <td>{order.trang_thai}</td>
                    <td>
                      <select value={order.trang_thai} onChange={(e) => updateStatus(order.ma_don_hang, e.target.value)}>
                        <option value="ChoXacNhan">ChoXacNhan</option>
                        <option value="DaXacNhan">DaXacNhan</option>
                        <option value="DangGiao">DangGiao</option>
                        <option value="DaGiao">DaGiao</option>
                        <option value="DaHuy">DaHuy</option>
                      </select>
                    </td>
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
