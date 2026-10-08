import { Router } from 'express';
import { createDanhMuc, deleteDanhMuc, getAllDanhMuc, getDanhMucById, updateDanhMuc } from '../controllers/danhMuc.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizePermission } from '../middleware/role.middleware.js';

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
router.post('/:id/thong-so', authenticate, authorizePermission('catalog'), addThongSoToDanhMuc);
router.post('/:id/specifications', authenticate, authorizePermission('catalog'), addThongSoToDanhMuc);
router.put('/:id/thong-so/:specId', authenticate, authorizePermission('catalog'), updateThongSoInDanhMuc);
router.put('/:id/specifications/:specId', authenticate, authorizePermission('catalog'), updateThongSoInDanhMuc);
router.delete('/:id/thong-so/:specId', authenticate, authorizePermission('catalog'), removeThongSoFromDanhMuc);
router.delete('/:id/specifications/:specId', authenticate, authorizePermission('catalog'), removeThongSoFromDanhMuc);
router.get('/:id', getDanhMucById);
router.post('/', authenticate, authorizePermission('catalog'), createDanhMuc);
router.put('/:id', authenticate, authorizePermission('catalog'), updateDanhMuc);
router.delete('/:id', authenticate, authorizePermission('catalog'), deleteDanhMuc);

export default router;
