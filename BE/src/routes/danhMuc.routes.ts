import { Router } from 'express';
import { createDanhMuc, deleteDanhMuc, getAllDanhMuc, getDanhMucById, updateDanhMuc } from '../controllers/danhMuc.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

import { getThongSoByDanhMuc } from '../controllers/thongSo.controller.js';

const router = Router();

router.get('/', getAllDanhMuc);
router.get('/:id/thong-so', getThongSoByDanhMuc);
router.get('/:id/specifications', getThongSoByDanhMuc);
router.get('/:id', getDanhMucById);
router.post('/', authenticate, authorize('Admin', 'NhanVien'), createDanhMuc);
router.put('/:id', authenticate, authorize('Admin', 'NhanVien'), updateDanhMuc);
router.delete('/:id', authenticate, authorize('Admin', 'NhanVien'), deleteDanhMuc);

export default router;
