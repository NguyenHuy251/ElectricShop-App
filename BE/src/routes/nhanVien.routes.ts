import { Router } from 'express';
import { createNhanVien, deleteNhanVien, getAllNhanVien, getNhanVienById, updateNhanVien } from '../controllers/nhanVien.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', authenticate, authorize('Admin'), getAllNhanVien);
router.get('/:id', authenticate, authorize('Admin'), getNhanVienById);
router.post('/', authenticate, authorize('Admin'), createNhanVien);
router.put('/:id', authenticate, authorize('Admin'), updateNhanVien);
router.delete('/:id', authenticate, authorize('Admin'), deleteNhanVien);

export default router;
