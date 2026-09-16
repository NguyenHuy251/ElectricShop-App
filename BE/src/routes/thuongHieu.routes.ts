import { Router } from 'express';
import { createThuongHieu, deleteThuongHieu, getAllThuongHieu, getThuongHieuById, updateThuongHieu } from '../controllers/thuongHieu.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), getAllThuongHieu);
router.get('/:id', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), getThuongHieuById);
router.post('/', authenticate, authorize('Admin', 'NhanVien'), createThuongHieu);
router.put('/:id', authenticate, authorize('Admin', 'NhanVien'), updateThuongHieu);
router.delete('/:id', authenticate, authorize('Admin', 'NhanVien'), deleteThuongHieu);

export default router;
