import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizePermission } from '../middleware/role.middleware.js';

const router = Router();
router.get('/', authenticate, authorizePermission('dashboard'), getDashboard);

export default router;
