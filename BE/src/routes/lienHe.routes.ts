import { Router } from 'express';
import { createLienHe, deleteLienHe, getAllLienHe, getLienHeById, updateLienHe } from '../controllers/lienHe.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.post('/', createLienHe);
router.get('/', authenticate, authorize('Admin', 'NhanVien'), getAllLienHe);
router.get('/:id', authenticate, authorize('Admin', 'NhanVien'), getLienHeById);
router.put('/:id', authenticate, authorize('Admin', 'NhanVien'), updateLienHe);
router.delete('/:id', authenticate, authorize('Admin', 'NhanVien'), deleteLienHe);

export default router;
