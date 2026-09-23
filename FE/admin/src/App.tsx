import { lazy } from 'react';
import { Button, Result, Spin } from 'antd';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const BrandsPage = lazy(() => import('./pages/BrandsPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'));
const ContactsPage = lazy(() => import('./pages/ContactsPage'));
function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const { user, loading, error, restore, logout } = useAuth();
  if (loading) return <div className="loading-area"><Spin size="large" /></div>;
  if (error) return <Result status="error" title={error} extra={[<Button key="retry" onClick={restore}>Thử lại</Button>, <Button key="logout" onClick={logout}>Đăng xuất</Button>]} />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.vai_tro !== 'Admin') return <Result status="403" title="Bạn không có quyền truy cập trang này" />;
  return <Outlet />;
}
export default function App() {
  return <AuthProvider><Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route element={<AdminLayout />}>
    <Route index element={<Navigate to="/dashboard" replace />} />
    <Route path="dashboard" element={<DashboardPage />} /><Route path="products" element={<ProductsPage />} />
    <Route path="categories" element={<CategoriesPage />} /><Route path="brands" element={<BrandsPage />} />
    <Route path="orders" element={<OrdersPage />} /><Route path="reviews" element={<ReviewsPage />} /><Route path="contacts" element={<ContactsPage />} />
    <Route element={<ProtectedRoute adminOnly />}><Route path="customers" element={<CustomersPage />} /><Route path="employees" element={<EmployeesPage />} /></Route>
  </Route></Route><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes></AuthProvider>;
}
