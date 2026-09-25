import { Suspense, useEffect, useState } from 'react';
import { Drawer, Spin } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar, { navigation } from './Sidebar';
import Topbar from './Topbar';
export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const title = navigation.find(([path]) => path === pathname)?.[1] || 'Quản trị';
  useEffect(() => { document.title = `${title} | ElectricShop`; setOpen(false); }, [title, pathname]);
  return <div className="layout"><div className="desktop-sidebar"><Sidebar /></div><Drawer title="Menu quản trị" placement="left" open={open} onClose={() => setOpen(false)} width={280}><Sidebar onNavigate={() => setOpen(false)} /></Drawer><main className="main"><Topbar title={title} toggle={() => setOpen(true)} /><div className="page"><Suspense fallback={<Spin tip="Đang tải trang"><div className="loading-area" /></Spin>}><Outlet /></Suspense></div></main></div>;
}
