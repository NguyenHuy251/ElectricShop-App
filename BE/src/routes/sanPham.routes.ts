import { listVariants, saveVariants } from '../controllers/bienThe.controller.js';
import { Router } from 'express';
import {
  addProductImage,
  createSanPham,
  deleteProductImage,
  deleteSanPham,
  getAllSanPham,
  getProductImages,
  getSanPhamById,
  setPrimaryProductImage,
  updateSanPham,
} from '../controllers/sanPham.controller.js';
import { getThongSoBySanPham } from '../controllers/thongSo.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', getAllSanPham);
router.get('/:id', getSanPhamById);
router.get('/:id/bien-the', listVariants);
router.put('/:id/bien-the', authenticate, authorize('Admin', 'NhanVien'), saveVariants);
router.get('/:id/thong-so', getThongSoBySanPham);
router.get('/:id/specifications', getThongSoBySanPham);
router.get('/:id/hinh-anh', getProductImages);
router.get('/:id/images', getProductImages);

router.post('/', authenticate, authorize('Admin', 'NhanVien'), createSanPham);
router.put('/:id', authenticate, authorize('Admin', 'NhanVien'), updateSanPham);
router.delete('/:id', authenticate, authorize('Admin', 'NhanVien'), deleteSanPham);

router.post('/:id/hinh-anh', authenticate, authorize('Admin', 'NhanVien'), addProductImage);
router.delete('/:id/hinh-anh/:ma_hinh_anh', authenticate, authorize('Admin', 'NhanVien'), deleteProductImage);
router.put('/:id/hinh-anh/:ma_hinh_anh/chinh', authenticate, authorize('Admin', 'NhanVien'), setPrimaryProductImage);

export default router;
