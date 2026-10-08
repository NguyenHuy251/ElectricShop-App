import type { RequestHandler } from 'express';

export function rateLimit(max: number, windowMs = 60_000): RequestHandler {
  const buckets = new Map<string, { count: number; until: number }>();
  return (req, res, next) => {
    const now = Date.now();
    for (const [key, bucket] of buckets) if (bucket.until <= now) buckets.delete(key);
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const bucket = buckets.get(key) || { count: 0, until: now + windowMs };
    bucket.count++;
    buckets.set(key, bucket);
    if (bucket.count > max) {
      res.setHeader('Retry-After', Math.ceil((bucket.until - now) / 1000));
      res.status(429).json({ success: false, message: 'Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau.' });
      return;
    }
    next();
  };
}
