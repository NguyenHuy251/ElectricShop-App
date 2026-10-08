import { Router } from 'express';
import { createLienHe, deleteLienHe, getAllLienHe, getLienHeById, getMyLienHe, updateLienHe } from '../controllers/lienHe.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizePermission } from '../middleware/role.middleware.js';

const router = Router();

// Keep guest contact support, but always validate and attach a supplied session.
router.post('/', (req, res, next) => req.headers.authorization ? authenticate(req, res, next) : next(), createLienHe);
router.get('/cua-toi', authenticate, getMyLienHe);
router.get('/', authenticate, authorizePermission('contacts'), getAllLienHe);
router.get('/:id', authenticate, authorizePermission('contacts'), getLienHeById);
router.put('/:id', authenticate, authorizePermission('contacts'), updateLienHe);
router.delete('/:id', authenticate, authorizePermission('contacts'), deleteLienHe);

export default router;
