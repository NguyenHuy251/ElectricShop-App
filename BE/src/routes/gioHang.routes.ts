import { Router } from 'express';
import { addToCart, clearCart, deleteCartItem, getGioHang, updateCartItem } from '../controllers/gioHang.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), getGioHang);
router.post('/', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), addToCart);
router.put('/:ma_san_pham', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), updateCartItem);
router.delete('/:ma_san_pham', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), deleteCartItem);
router.delete('/', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), clearCart);

export default router;
