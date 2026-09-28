import { Router } from 'express';
import {
  getAllThongSo,
  getNhomThongSo,
  getThongSoByDanhMuc,
  getThongSoBySanPham,
} from '../controllers/thongSo.controller.js';

const router = Router();

router.get('/nhom', getNhomThongSo);
router.get('/danh-muc/:id', getThongSoByDanhMuc);
router.get('/san-pham/:id', getThongSoBySanPham);
router.get('/', getAllThongSo);

export default router;
