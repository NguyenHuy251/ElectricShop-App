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
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.get('/nhom', getNhomThongSo);
router.post('/nhom', authenticate, authorize('Admin', 'NhanVien'), createNhomThongSo);
router.put('/nhom/:id', authenticate, authorize('Admin', 'NhanVien'), updateNhomThongSo);

router.get('/danh-muc/:id', getThongSoByDanhMuc);
router.get('/san-pham/:id', getThongSoBySanPham);

router.get('/', getAllThongSo);
router.post('/', authenticate, authorize('Admin', 'NhanVien'), createThongSo);
router.put('/:id', authenticate, authorize('Admin', 'NhanVien'), updateThongSo);
router.delete('/:id', authenticate, authorize('Admin', 'NhanVien'), deleteThongSo);

export default router;
