import { Router } from 'express';
import { createDanhMuc, deleteDanhMuc, getAllDanhMuc, getDanhMucById, updateDanhMuc } from '../controllers/danhMuc.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

import {
  addThongSoToDanhMuc,
  getThongSoByDanhMuc,
  removeThongSoFromDanhMuc,
  updateThongSoInDanhMuc,
} from '../controllers/thongSo.controller.js';

const router = Router();

router.get('/', getAllDanhMuc);
router.get('/:id/thong-so', getThongSoByDanhMuc);
router.get('/:id/specifications', getThongSoByDanhMuc);
router.post('/:id/thong-so', authenticate, authorize('Admin', 'NhanVien'), addThongSoToDanhMuc);
router.post('/:id/specifications', authenticate, authorize('Admin', 'NhanVien'), addThongSoToDanhMuc);
router.put('/:id/thong-so/:specId', authenticate, authorize('Admin', 'NhanVien'), updateThongSoInDanhMuc);
router.put('/:id/specifications/:specId', authenticate, authorize('Admin', 'NhanVien'), updateThongSoInDanhMuc);
router.delete('/:id/thong-so/:specId', authenticate, authorize('Admin', 'NhanVien'), removeThongSoFromDanhMuc);
router.delete('/:id/specifications/:specId', authenticate, authorize('Admin', 'NhanVien'), removeThongSoFromDanhMuc);
router.get('/:id', getDanhMucById);
router.post('/', authenticate, authorize('Admin', 'NhanVien'), createDanhMuc);
router.put('/:id', authenticate, authorize('Admin', 'NhanVien'), updateDanhMuc);
router.delete('/:id', authenticate, authorize('Admin', 'NhanVien'), deleteDanhMuc);

export default router;
