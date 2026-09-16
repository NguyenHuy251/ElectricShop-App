import { useEffect, useState } from 'react';
import { api } from '../api/api';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await api.get('/danh-gia/san-pham/1');
      setReviews(response.data.data || []);
    };
    load();
  }, []);

  return (
    <div className="layout">
      <aside className="sidebar"><h3>AppElectricShop</h3><a href="/dashboard">Dashboard</a></aside>
      <main className="main">
        <div className="topbar"><strong>Đánh giá</strong></div>
        <div className="page">
          <div className="card">
            <table className="table">
              <thead><tr><th>Người đánh giá</th><th>Số sao</th><th>Nội dung</th></tr></thead>
              <tbody>{reviews.map((review) => <tr key={review.ma_danh_gia}><td>{review.ho_ten}</td><td>{review.so_sao}</td><td>{review.noi_dung || '-'}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
