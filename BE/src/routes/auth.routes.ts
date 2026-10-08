import { Router } from 'express';
import { login, me, register, updateMe, changePassword,refresh,logout } from '../controllers/auth.controller.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { forgotPassword } from '../controllers/forgotPassword.controller.js';

const router = Router();

router.post('/register', process.env.NODE_ENV === 'production' ? rateLimit(10, 15 * 60_000) : rateLimit(30, 60_000), register);
router.post('/login', rateLimit(30, 15 * 60_000), login);
router.post('/forgot-password', rateLimit(5, 15 * 60_000), forgotPassword);
router.put('/password', authenticate, rateLimit(10, 15 * 60_000), changePassword);
router.post('/refresh',rateLimit(60),refresh);
router.post('/logout',logout);
router.get('/me', authenticate, me);
router.put('/me', authenticate, updateMe);

export default router;
