import { Router } from 'express';
import { cancelDonHang, confirmOrderReceipt, createDonHang, deleteDonHang, getDonHang, getDonHangById, updateTrangThaiDonHang } from '../controllers/donHang.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize, authorizePermission } from '../middleware/role.middleware.js';
import { previewCheckout } from '../controllers/checkout.controller.js';

const router = Router();
router.get('/checkout', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), previewCheckout);

router.post('/', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), createDonHang);
router.get('/', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), getDonHang);
router.get('/:id', authenticate, authorize('Admin', 'NhanVien', 'KhachHang'), getDonHangById);
router.put('/:id/trang-thai', authenticate, authorizePermission('orders'), updateTrangThaiDonHang);
router.put('/:id/huy', authenticate, authorize('KhachHang'), cancelDonHang);
router.put('/:id/xac-nhan-nhan-hang', authenticate, authorize('KhachHang', 'Admin'), confirmOrderReceipt);
router.delete('/:id', authenticate, authorizePermission('orders'), deleteDonHang);

export default router;
