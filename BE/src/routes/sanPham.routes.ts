import { Router } from 'express';
import { createSanPham, deleteSanPham, getAllSanPham, getSanPhamById, updateSanPham } from '../controllers/sanPham.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), getAllSanPham);
router.get('/:id', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), getSanPhamById);
router.post('/', authenticate, authorize('Admin', 'NhanVien'), createSanPham);
router.put('/:id', authenticate, authorize('Admin', 'NhanVien'), updateSanPham);
router.delete('/:id', authenticate, authorize('Admin', 'NhanVien'), deleteSanPham);

export default router;
