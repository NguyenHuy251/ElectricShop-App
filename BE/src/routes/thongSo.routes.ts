import { Router } from 'express';
import {
  createNhomThongSo,
  createThongSo,
  deleteThongSo,
  getAllThongSo,
  getNhomThongSo,
  getThongSoByDanhMuc,
  getThongSoBySanPham,
  updateNhomThongSo,
  updateThongSo,
} from '../controllers/thongSo.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizePermission } from '../middleware/role.middleware.js';

const router = Router();

router.get('/nhom', getNhomThongSo);
router.post('/nhom', authenticate, authorizePermission('catalog'), createNhomThongSo);
router.put('/nhom/:id', authenticate, authorizePermission('catalog'), updateNhomThongSo);

router.get('/danh-muc/:id', getThongSoByDanhMuc);
router.get('/san-pham/:id', getThongSoBySanPham);

router.get('/', getAllThongSo);
router.post('/', authenticate, authorizePermission('catalog'), createThongSo);
router.put('/:id', authenticate, authorizePermission('catalog'), updateThongSo);
router.delete('/:id', authenticate, authorizePermission('catalog'), deleteThongSo);

export default router;
