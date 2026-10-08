import { Router, raw } from 'express';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizePermission } from '../middleware/role.middleware.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';

export const uploadDirectory = resolve('uploads');
const router = Router();
router.post('/', authenticate, authorizePermission('catalog'), rateLimit(30), raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }), async (req, res) => {
  const data = req.body;
  if (!Buffer.isBuffer(data) || data.length < 12) return sendError(res, 400, 'Chọn ảnh JPEG, PNG hoặc WebP (tối đa 5 MB).');
  const extension = data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png' : data[0] === 255 && data[1] === 216 && data[2] === 255 ? 'jpg' : data.toString('ascii',0,4) === 'RIFF' && data.toString('ascii',8,12) === 'WEBP' ? 'webp' : null;
  if (!extension) return sendError(res, 400, 'Nội dung file không phải ảnh hợp lệ.');
  try {
    await mkdir(uploadDirectory, { recursive: true });
    const filename = `${randomUUID()}.${extension}`;
    await writeFile(resolve(uploadDirectory, filename), data, { flag: 'wx' });
    const origin = process.env.PUBLIC_BACKEND_URL || '';
    return sendSuccess(res, 'Tải ảnh thành công', { url: `${origin.replace(/\/$/, '')}/uploads/${filename}`, path: `/uploads/${filename}` });
  } catch { return sendError(res, 503, 'Chưa thể lưu ảnh. Vui lòng thử lại.'); }
});
export default router;
