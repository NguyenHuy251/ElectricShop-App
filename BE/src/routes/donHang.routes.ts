import { Router } from 'express';
import { createDonHang, deleteDonHang, getDonHang, getDonHangById, updateTrangThaiDonHang } from '../controllers/donHang.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.post('/', authenticate, authorize('KhachHang'), createDonHang);
router.get('/', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), getDonHang);
router.get('/:id', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), getDonHangById);
router.put('/:id/trang-thai', authenticate, authorize('Admin', 'NhanVien'), updateTrangThaiDonHang);
router.delete('/:id', authenticate, authorize('Admin', 'NhanVien'), deleteDonHang);

export default router;
