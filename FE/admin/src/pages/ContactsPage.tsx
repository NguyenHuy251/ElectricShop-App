import { useEffect, useState } from 'react';
import { api } from '../api/api';
import AdminSidebar from '../components/AdminSidebar';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await api.get('/lien-he');
      setContacts(response.data.data || []);
    };
    load();
  }, []);

  return (
    <div className="layout">
      <AdminSidebar />
      <main className="main">
        <div className="topbar"><strong>Liên hệ</strong></div>
        <div className="page">
          <div className="card">
            <table className="table">
              <thead><tr><th>Họ tên</th><th>Email</th><th>Tiêu đề</th><th>Trạng thái</th></tr></thead>
              <tbody>{contacts.map((contact) => <tr key={contact.ma_lien_he}><td>{contact.ho_ten}</td><td>{contact.email}</td><td>{contact.tieu_de}</td><td>{contact.trang_thai}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
