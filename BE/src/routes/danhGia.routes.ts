import { Router } from 'express';
import { getAllDanhGia, createDanhGia, deleteDanhGia, getDanhGiaBySanPham, updateDanhGia } from '../controllers/danhGia.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', authenticate, authorize('Admin', 'NhanVien'), getAllDanhGia);
router.get('/san-pham/:ma_san_pham', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), getDanhGiaBySanPham);
router.post('/', authenticate, authorize('KhachHang'), createDanhGia);
router.put('/:id', authenticate, authorize('KhachHang'), updateDanhGia);
router.delete('/:id', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), deleteDanhGia);

export default router;
