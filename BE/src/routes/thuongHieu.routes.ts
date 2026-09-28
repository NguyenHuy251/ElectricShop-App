import { Router } from 'express';
import { createThuongHieu, deleteThuongHieu, getAllThuongHieu, getThuongHieuById, updateThuongHieu } from '../controllers/thuongHieu.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', getAllThuongHieu);
router.get('/:id', getThuongHieuById);
router.post('/', authenticate, authorize('Admin', 'NhanVien'), createThuongHieu);
router.put('/:id', authenticate, authorize('Admin', 'NhanVien'), updateThuongHieu);
router.delete('/:id', authenticate, authorize('Admin', 'NhanVien'), deleteThuongHieu);

export default router;
