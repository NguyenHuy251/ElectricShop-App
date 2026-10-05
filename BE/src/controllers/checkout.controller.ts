import { createHash } from 'node:crypto';
import { Response } from 'express';
import { pool } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { CheckoutError, CheckoutItem, checkoutSelection, summarizeCart, validateCheckout } from '../utils/checkout.js';

function fail(res: Response, error: unknown) {
  if (error instanceof CheckoutError) return res.status(error.status).json({ success: false, message: error.message, fieldErrors: error.fieldErrors || {} });
  console.error('Checkout error:', error);
  return sendError(res, 503, 'Chưa thể hoàn tất yêu cầu. Vui lòng thử lại với cùng thông tin đặt hàng.');
}

export async function previewCheckout(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');
  try {
    const selection = checkoutSelection(req.query || {}, true);
    if (selection.source === 'buy_now') {
      const [rows] = await pool.query('SELECT ma_san_pham, ten_san_pham, gia_ban, hinh_anh, so_luong AS ton_kho, trang_thai FROM san_pham WHERE ma_san_pham = ?', [selection.ma_san_pham]);
      const product = (rows as CheckoutItem[])[0];
      if (!product) throw new CheckoutError(404, 'Sản phẩm không còn tồn tại.');
      return sendSuccess(res, 'Thông tin thanh toán ngay', { ...summarizeCart([{ ...product, so_luong: selection.so_luong! }]), ...selection });
    }
    const [rows] = await pool.query(
      `SELECT cth.ma_san_pham, cth.so_luong, sp.ten_san_pham, sp.gia_ban, sp.hinh_anh, sp.so_luong AS ton_kho, sp.trang_thai
       FROM gio_hang gh JOIN chi_tiet_gio_hang cth ON cth.ma_gio_hang = gh.ma_gio_hang
       JOIN san_pham sp ON sp.ma_san_pham = cth.ma_san_pham WHERE gh.ma_tai_khoan = ? ORDER BY sp.ma_san_pham`, [req.user.ma_tai_khoan]);
    return sendSuccess(res, 'Thông tin thanh toán', summarizeCart(rows as CheckoutItem[]));
  } catch (error) { return fail(res, error); }
}

export async function createDonHang(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');
  try {
    const input = validateCheckout(req.body || {});
    const requestHash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    const connection = await pool.getConnection();
    try {
      // Parent/product row locks provide consistency; avoid range locks between unrelated carts.
      await connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
      await connection.beginTransaction();
      // The unique request row serializes retries, including direct purchases without a cart.
      // This placeholder rolls back with any failed order and is never committed unfinished.
      await connection.execute('INSERT INTO checkout_requests (ma_tai_khoan, request_id, request_hash, response_json) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE request_id = VALUES(request_id)', [req.user.ma_tai_khoan, input.request_id, requestHash, '{}']);
      const [requests] = await connection.query('SELECT request_hash, response_json FROM checkout_requests WHERE ma_tai_khoan = ? AND request_id = ? FOR UPDATE', [req.user.ma_tai_khoan, input.request_id]);
      const previous = (requests as { request_hash: string; response_json: unknown }[])[0];
      if (previous.request_hash !== requestHash) throw new CheckoutError(409, 'Yêu cầu đã được sử dụng với thông tin khác. Vui lòng kiểm tra đơn hàng đã đặt.');
      const previousResult = typeof previous.response_json === 'string' ? JSON.parse(previous.response_json) : previous.response_json as { ma_don_hang?: number };
      if (previousResult.ma_don_hang) {
        await connection.commit();
        return sendSuccess(res, 'Đơn hàng đã được ghi nhận', previousResult);
      }
      let cartId: number | undefined;
      let lines: { ma_san_pham: number; so_luong: number }[];
      if (input.source === 'buy_now') {
        lines = [{ ma_san_pham: input.ma_san_pham!, so_luong: input.so_luong! }];
      } else {
        // Cart writers lock this parent too; edits cannot interleave with checkout.
        const [carts] = await connection.query('SELECT ma_gio_hang FROM gio_hang WHERE ma_tai_khoan = ? FOR UPDATE', [req.user.ma_tai_khoan]);
        cartId = (carts as { ma_gio_hang: number }[])[0]?.ma_gio_hang;
        if (!cartId) throw new CheckoutError(409, 'Giỏ hàng trống. Vui lòng chọn sản phẩm trước.');
        const [cartRows] = await connection.query('SELECT ma_san_pham, so_luong FROM chi_tiet_gio_hang WHERE ma_gio_hang = ? ORDER BY ma_san_pham FOR UPDATE', [cartId]);
        lines = cartRows as typeof lines;
      }
      if (!lines.length) throw new CheckoutError(409, 'Giỏ hàng trống. Vui lòng kiểm tra các đơn hàng đã đặt.');
      const items: CheckoutItem[] = [];
      // Lock in product-id order across carts to prevent overselling.
      for (const line of lines) {
        const [products] = await connection.query('SELECT ma_san_pham, ten_san_pham, gia_ban, so_luong AS ton_kho, trang_thai FROM san_pham WHERE ma_san_pham = ? FOR UPDATE', [line.ma_san_pham]);
        const product = (products as CheckoutItem[])[0];
        if (!product) throw new CheckoutError(409, 'Một sản phẩm không còn tồn tại. Vui lòng kiểm tra lại giỏ hàng.');
        items.push({ ...product, so_luong: line.so_luong });
      }
      const quote = summarizeCart(items);
      if (!quote.can_checkout) throw new CheckoutError(409, quote.issues.join(' '));
      if (quote.snapshot !== input.snapshot) throw new CheckoutError(409, 'Giá hoặc giỏ hàng đã thay đổi. Vui lòng cập nhật và kiểm tra lại trước khi đặt hàng.');
      const [result] = await connection.execute(
        `INSERT INTO don_hang (ma_tai_khoan, ho_ten_nguoi_nhan, so_dien_thoai, dia_chi_giao_hang, tong_tien, phuong_thuc_thanh_toan, trang_thai, ghi_chu, ngay_dat)
         VALUES (?, ?, ?, ?, ?, ?, 'ChoXacNhan', ?, NOW())`,
        [req.user.ma_tai_khoan, input.ho_ten_nguoi_nhan, input.so_dien_thoai, input.dia_chi_giao_hang, quote.tong_tien, input.phuong_thuc_thanh_toan, input.ghi_chu || null]);
      const orderId = (result as { insertId: number }).insertId;
      for (const item of items) {
        // thanh_tien is a generated column in MySQL.
        await connection.execute('INSERT INTO chi_tiet_don_hang (ma_don_hang, ma_san_pham, ten_san_pham, so_luong, don_gia) VALUES (?, ?, ?, ?, ?)', [orderId, item.ma_san_pham, item.ten_san_pham, item.so_luong, item.gia_ban]);
        await connection.execute('UPDATE san_pham SET so_luong = so_luong - ? WHERE ma_san_pham = ?', [item.so_luong, item.ma_san_pham]);
      }
      const response = { ma_don_hang: orderId, tong_tien: quote.tong_tien, phuong_thuc_thanh_toan: input.phuong_thuc_thanh_toan, trang_thai: 'ChoXacNhan' };
      await connection.execute('UPDATE checkout_requests SET response_json = ? WHERE ma_tai_khoan = ? AND request_id = ?', [JSON.stringify(response), req.user.ma_tai_khoan, input.request_id]);
      if (cartId) await connection.execute('DELETE FROM chi_tiet_gio_hang WHERE ma_gio_hang = ?', [cartId]);
      await connection.commit();
      return sendSuccess(res, 'Đặt hàng thành công', response);
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
  } catch (error) { return fail(res, error); }
}
