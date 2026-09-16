import { Router } from 'express';
import { addToCart, clearCart, deleteCartItem, getGioHang, updateCartItem } from '../controllers/gioHang.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', authenticate, authorize('KhachHang'), getGioHang);
router.post('/', authenticate, authorize('KhachHang'), addToCart);
router.put('/:ma_san_pham', authenticate, authorize('KhachHang'), updateCartItem);
router.delete('/:ma_san_pham', authenticate, authorize('KhachHang'), deleteCartItem);
router.delete('/', authenticate, authorize('KhachHang'), clearCart);

export default router;
