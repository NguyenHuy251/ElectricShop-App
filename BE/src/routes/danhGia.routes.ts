import { Router } from 'express';
import { createDanhGia, deleteDanhGia, getDanhGiaBySanPham, updateDanhGia } from '../controllers/danhGia.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.get('/san-pham/:ma_san_pham', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), getDanhGiaBySanPham);
router.post('/', authenticate, authorize('KhachHang'), createDanhGia);
router.put('/:id', authenticate, authorize('KhachHang'), updateDanhGia);
router.delete('/:id', authenticate, authorize('KhachHang'), deleteDanhGia);

export default router;
