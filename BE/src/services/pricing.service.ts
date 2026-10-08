import { createHash } from 'node:crypto';
import type { Pool, PoolConnection } from 'mysql2/promise';
import { CheckoutError, summarizeCart } from '../utils/checkout.js';
import { findVoucher, voucherIssue } from './voucher.service.js';

export async function priceCheckout(db: Pool | PoolConnection, quote: ReturnType<typeof summarizeCart>, code?: string, lock = false, accountId?: number) {
  const fee = Number(process.env.SHIPPING_FEE || 0), freeFrom = Number(process.env.FREE_SHIPPING_FROM || 0);
  if (!Number.isFinite(fee) || fee < 0 || fee > 1e7 || !Number.isFinite(freeFrom) || freeFrom < 0) throw new Error('Invalid shipping configuration');
  const shipping = freeFrom > 0 && quote.tam_tinh >= freeFrom ? 0 : fee;
  let discount = 0, voucherId: number | null = null;
  if (code) {
    const voucher = await findVoucher(db,code,lock,accountId);
    if (!voucher) throw new CheckoutError(409,'Mã giảm giá không tồn tại.');
    const reason = voucherIssue(voucher, quote.tam_tinh);
    if (reason) throw new CheckoutError(409,reason);
    const amount=Number(voucher.giam_tien);
    discount=voucher.loai==='PhanTram' ? Math.round(quote.tam_tinh*amount)/100 : amount;
    if (voucher.giam_toi_da!=null) discount=Math.min(discount,Number(voucher.giam_toi_da));
    discount=Math.min(quote.tam_tinh,discount);
    voucherId=voucher.ma_voucher;
  }
  return {...quote,phi_giao_hang:shipping,giam_gia:discount,ma_voucher:voucherId,ma_code:code || '',tong_tien:quote.tam_tinh+shipping-discount,
    snapshot: code || shipping ? createHash('sha256').update(`${quote.snapshot}:${shipping}:${discount}:${voucherId}`).digest('hex') : quote.snapshot};
}

export function voucherCode(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{3,40}$/.test(value.trim())) throw new CheckoutError(400,'Mã giảm giá không hợp lệ.');
  return value.trim().toUpperCase();
}
