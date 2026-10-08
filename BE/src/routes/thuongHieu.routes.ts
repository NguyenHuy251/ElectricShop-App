import { Router } from 'express';
import { createThuongHieu, deleteThuongHieu, getAllThuongHieu, getThuongHieuById, updateThuongHieu } from '../controllers/thuongHieu.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizePermission } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', getAllThuongHieu);
router.get('/:id', getThuongHieuById);
router.post('/', authenticate, authorizePermission('catalog'), createThuongHieu);
router.put('/:id', authenticate, authorizePermission('catalog'), updateThuongHieu);
router.delete('/:id', authenticate, authorizePermission('catalog'), deleteThuongHieu);

export default router;
