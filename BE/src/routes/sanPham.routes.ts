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
import { authorizePermission } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', getAllSanPham);
router.get('/:id', getSanPhamById);
router.get('/:id/thong-so', getThongSoBySanPham);
router.get('/:id/specifications', getThongSoBySanPham);
router.get('/:id/hinh-anh', getProductImages);
router.get('/:id/images', getProductImages);

router.post('/', authenticate, authorizePermission('catalog'), createSanPham);
router.put('/:id', authenticate, authorizePermission('catalog'), updateSanPham);
router.delete('/:id', authenticate, authorizePermission('catalog'), deleteSanPham);

router.post('/:id/hinh-anh', authenticate, authorizePermission('catalog'), addProductImage);
router.delete('/:id/hinh-anh/:ma_hinh_anh', authenticate, authorizePermission('catalog'), deleteProductImage);
router.put('/:id/hinh-anh/:ma_hinh_anh/chinh', authenticate, authorizePermission('catalog'), setPrimaryProductImage);

export default router;
