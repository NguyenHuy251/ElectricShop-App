import { Router } from 'express';
import { createDanhMuc, deleteDanhMuc, getAllDanhMuc, getDanhMucById, updateDanhMuc } from '../controllers/danhMuc.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), getAllDanhMuc);
router.get('/:id', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), getDanhMucById);
router.post('/', authenticate, authorize('Admin', 'NhanVien'), createDanhMuc);
router.put('/:id', authenticate, authorize('Admin', 'NhanVien'), updateDanhMuc);
router.delete('/:id', authenticate, authorize('Admin', 'NhanVien'), deleteDanhMuc);

export default router;
