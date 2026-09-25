import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { testConnection } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import danhGiaRoutes from './routes/danhGia.routes.js';
import danhMucRoutes from './routes/danhMuc.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import donHangRoutes from './routes/donHang.routes.js';
import gioHangRoutes from './routes/gioHang.routes.js';
import lienHeRoutes from './routes/lienHe.routes.js';
import nhanVienRoutes from './routes/nhanVien.routes.js';
import sanPhamRoutes from './routes/sanPham.routes.js';
import taiKhoanRoutes from './routes/taiKhoan.routes.js';
import thuongHieuRoutes from './routes/thuongHieu.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { adminValidation } from './middleware/adminValidation.middleware.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:8081').split(',').map(value => value.trim()).filter(Boolean);
if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGINS) throw new Error('CORS_ORIGINS must be configured in production');
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)), credentials: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', adminValidation);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API is running', data: { status: 'ok' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/tai-khoan', taiKhoanRoutes);
app.use('/api/nhan-vien', nhanVienRoutes);
app.use('/api/danh-muc', danhMucRoutes);
app.use('/api/thuong-hieu', thuongHieuRoutes);
app.use('/api/san-pham', sanPhamRoutes);
app.use('/api/gio-hang', gioHangRoutes);
app.use('/api/don-hang', donHangRoutes);
app.use('/api/danh-gia', danhGiaRoutes);
app.use('/api/lien-he', lienHeRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  await testConnection();
});
