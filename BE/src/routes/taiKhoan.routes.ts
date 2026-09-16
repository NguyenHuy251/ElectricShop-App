import { Router } from 'express';
import { deleteTaiKhoan, getAllTaiKhoan, getTaiKhoanById, updateTaiKhoan } from '../controllers/taiKhoan.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', authenticate, authorize('Admin'), getAllTaiKhoan);
router.get('/:id', authenticate, authorize('Admin'), getTaiKhoanById);
router.put('/:id', authenticate, authorize('Admin'), updateTaiKhoan);
router.delete('/:id', authenticate, authorize('Admin'), deleteTaiKhoan);

export default router;
