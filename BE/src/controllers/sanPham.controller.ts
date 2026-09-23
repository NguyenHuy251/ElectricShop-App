import { duplicateField } from '../utils/adminErrors.js';
import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getAllSanPham(req: Request, res: Response) {
  try {
    const { page = 1, limit = 10, search = '', ma_danh_muc, ma_thuong_hieu, min_price, max_price } = req.query;

    if (!Number.isInteger(Number(page)) || Number(page) < 1 || !Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100) return sendError(res, 400, 'Phân trang không hợp lệ');
    const offset = (Number(page) - 1) * Number(limit);
    const searchTerm = String(search || '').trim();

    const whereClauses: string[] = [];
    const values: any[] = [];

    if (searchTerm) {
      whereClauses.push('(sp.ten_san_pham LIKE ? OR sp.ma_san_pham_code LIKE ? OR dm.ten_danh_muc LIKE ?)');
      values.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }

    if (ma_danh_muc) {
      whereClauses.push('sp.ma_danh_muc = ?');
      values.push(Number(ma_danh_muc));
    }

    if (ma_thuong_hieu) {
      whereClauses.push('sp.ma_thuong_hieu = ?');
      values.push(Number(ma_thuong_hieu));
    }

    if (min_price) {
      whereClauses.push('sp.gia_ban >= ?');
      values.push(Number(min_price));
    }

    if (max_price) {
      whereClauses.push('sp.gia_ban <= ?');
      values.push(Number(max_price));
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM san_pham sp LEFT JOIN danh_muc dm ON dm.ma_danh_muc = sp.ma_danh_muc ${whereSql.length ? ` ${whereSql}` : ''}`,
      values,
    );

    const total = (countRows as any[])[0]?.total ?? 0;

    const [rows] = await pool.query(
      `SELECT sp.*, dm.ten_danh_muc, th.ten_thuong_hieu,
              (SELECT JSON_OBJECT(
                  'ma_chi_tiet', cts.ma_chi_tiet,
                  'ma_san_pham', cts.ma_san_pham,
                  'cong_suat', cts.cong_suat,
                  'dung_tich', cts.dung_tich,
                  'kich_thuoc', cts.kich_thuoc,
                  'mau_sac', cts.mau_sac,
                  'xuat_xu', cts.xuat_xu,
                  'thong_so_khac', cts.thong_so_khac
              ) FROM chi_tiet_san_pham cts WHERE cts.ma_san_pham = sp.ma_san_pham) AS chi_tiet_san_pham
       FROM san_pham sp
       LEFT JOIN danh_muc dm ON dm.ma_danh_muc = sp.ma_danh_muc
       LEFT JOIN thuong_hieu th ON th.ma_thuong_hieu = sp.ma_thuong_hieu
       ${whereSql}
       ORDER BY sp.ma_san_pham DESC
       LIMIT ? OFFSET ?`,
      [...values, Number(limit), offset],
    );

    return sendSuccess(res, 'Danh sách sản phẩm', rows, {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages: Math.ceil(Number(total) / Number(limit)),
    });
  } catch (error) {
    if (duplicateField(error, res, 'ma_san_pham_code', 'Mã sản phẩm đã tồn tại')) return;
    return sendError(res, 500, 'Lỗi khi lấy danh sách sản phẩm', [(error as Error).message]);
  }
}

export async function getSanPhamById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT sp.*, dm.ten_danh_muc, th.ten_thuong_hieu,
              (SELECT JSON_OBJECT(
                  'ma_chi_tiet', cts.ma_chi_tiet,
                  'ma_san_pham', cts.ma_san_pham,
                  'cong_suat', cts.cong_suat,
                  'dung_tich', cts.dung_tich,
                  'kich_thuoc', cts.kich_thuoc,
                  'mau_sac', cts.mau_sac,
                  'xuat_xu', cts.xuat_xu,
                  'thong_so_khac', cts.thong_so_khac
              ) FROM chi_tiet_san_pham cts WHERE cts.ma_san_pham = sp.ma_san_pham) AS chi_tiet_san_pham
       FROM san_pham sp
       LEFT JOIN danh_muc dm ON dm.ma_danh_muc = sp.ma_danh_muc
       LEFT JOIN thuong_hieu th ON th.ma_thuong_hieu = sp.ma_thuong_hieu
       WHERE sp.ma_san_pham = ?`,
      [id],
    );

    const result = rows as any[];
    if (!result.length) return sendError(res, 404, 'Không tìm thấy sản phẩm');

    return sendSuccess(res, 'Sản phẩm được tìm thấy', result[0]);
  } catch (error) {
    if (duplicateField(error, res, 'ma_san_pham_code', 'Mã sản phẩm đã tồn tại')) return;
    return sendError(res, 500, 'Lỗi khi lấy sản phẩm', [(error as Error).message]);
  }
}

export async function createSanPham(req: Request, res: Response) {
  try {
    const {
      ma_danh_muc,
      ma_thuong_hieu,
      ma_san_pham_code,
      ten_san_pham,
      mo_ta,
      gia_nhap,
      gia_ban,
      so_luong,
      bao_hanh,
      hinh_anh,
      trang_thai,
      cong_suat,
      dung_tich,
      kich_thuoc,
      mau_sac,
      xuat_xu,
      thong_so_khac,
    } = req.body;

    if (!ma_danh_muc || !ma_thuong_hieu || !ma_san_pham_code || !ten_san_pham || !gia_ban) {
      return sendError(res, 400, 'Thiếu thông tin sản phẩm bắt buộc');
    }

    const [existing] = await pool.query('SELECT ma_san_pham FROM san_pham WHERE ma_san_pham_code = ?', [ma_san_pham_code]);
    if ((existing as any[]).length) {
      return res.status(409).json({ success: false, message: 'Mã sản phẩm đã tồn tại', fieldErrors: { ma_san_pham_code: 'Mã sản phẩm đã tồn tại' } });
    }

    const [result] = await pool.execute(
      `INSERT INTO san_pham (ma_danh_muc, ma_thuong_hieu, ma_san_pham_code, ten_san_pham, mo_ta, gia_nhap, gia_ban, so_luong, bao_hanh, hinh_anh, trang_thai, ngay_tao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [ma_danh_muc, ma_thuong_hieu, ma_san_pham_code, ten_san_pham, mo_ta || null, gia_nhap ?? 0, gia_ban, so_luong ?? 0, bao_hanh ?? 12, hinh_anh || null, trang_thai || 'DangBan'],
    );

    const productResult = result as { insertId: number };
    const maSanPham = productResult.insertId;

    await pool.execute(
      `INSERT INTO chi_tiet_san_pham (ma_san_pham, cong_suat, dung_tich, kich_thuoc, mau_sac, xuat_xu, thong_so_khac)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [maSanPham, cong_suat || null, dung_tich || null, kich_thuoc || null, mau_sac || null, xuat_xu || null, thong_so_khac || null],
    );

    return sendSuccess(res, 'Thêm sản phẩm thành công', { ma_san_pham: maSanPham });
  } catch (error) {
    if (duplicateField(error, res, 'ma_san_pham_code', 'Mã sản phẩm đã tồn tại')) return;
    return sendError(res, 500, 'Lỗi khi thêm sản phẩm', [(error as Error).message]);
  }
}

export async function updateSanPham(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      ma_danh_muc,
      ma_thuong_hieu,
      ma_san_pham_code,
      ten_san_pham,
      mo_ta,
      gia_nhap,
      gia_ban,
      so_luong,
      bao_hanh,
      hinh_anh,
      trang_thai,
      cong_suat,
      dung_tich,
      kich_thuoc,
      mau_sac,
      xuat_xu,
      thong_so_khac,
    } = req.body;

    const [rows] = await pool.query('SELECT * FROM san_pham WHERE ma_san_pham = ?', [id]);
    if (!(rows as any[]).length) return sendError(res, 404, 'Không tìm thấy sản phẩm');

    await pool.query(
      `UPDATE san_pham SET ma_danh_muc = COALESCE(?, ma_danh_muc), ma_thuong_hieu = COALESCE(?, ma_thuong_hieu), ma_san_pham_code = COALESCE(?, ma_san_pham_code), ten_san_pham = COALESCE(?, ten_san_pham), mo_ta = COALESCE(?, mo_ta), gia_nhap = COALESCE(?, gia_nhap), gia_ban = COALESCE(?, gia_ban), so_luong = COALESCE(?, so_luong), bao_hanh = COALESCE(?, bao_hanh), hinh_anh = COALESCE(?, hinh_anh), trang_thai = COALESCE(?, trang_thai) WHERE ma_san_pham = ?`,
      [ma_danh_muc ?? null, ma_thuong_hieu ?? null, ma_san_pham_code ?? null, ten_san_pham ?? null, mo_ta ?? null, gia_nhap ?? null, gia_ban ?? null, so_luong ?? null, bao_hanh ?? null, hinh_anh ?? null, trang_thai ?? null, id],
    );

    await pool.query(
      `UPDATE chi_tiet_san_pham SET cong_suat = COALESCE(?, cong_suat), dung_tich = COALESCE(?, dung_tich), kich_thuoc = COALESCE(?, kich_thuoc), mau_sac = COALESCE(?, mau_sac), xuat_xu = COALESCE(?, xuat_xu), thong_so_khac = COALESCE(?, thong_so_khac) WHERE ma_san_pham = ?`,
      [cong_suat ?? null, dung_tich ?? null, kich_thuoc ?? null, mau_sac ?? null, xuat_xu ?? null, thong_so_khac ?? null, id],
    );

    return sendSuccess(res, 'Cập nhật sản phẩm thành công', { ma_san_pham: Number(id) });
  } catch (error) {
    if (duplicateField(error, res, 'ma_san_pham_code', 'Mã sản phẩm đã tồn tại')) return;
    return sendError(res, 500, 'Lỗi khi cập nhật sản phẩm', [(error as Error).message]);
  }
}

export async function deleteSanPham(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM san_pham WHERE ma_san_pham = ?', [id]);
    if (!(rows as any[]).length) return sendError(res, 404, 'Không tìm thấy sản phẩm');

    await pool.query('DELETE FROM san_pham WHERE ma_san_pham = ?', [id]);
    return sendSuccess(res, 'Xóa sản phẩm thành công', { ma_san_pham: Number(id) });
  } catch (error) {
    if (duplicateField(error, res, 'ma_san_pham_code', 'Mã sản phẩm đã tồn tại')) return;
    if ((error as { code?: string }).code === 'ER_ROW_IS_REFERENCED_2') return sendError(res, 409, 'Sản phẩm đang được sử dụng trong đơn hàng, không thể xóa.');
    return sendError(res, 500, 'Lỗi khi xóa sản phẩm', [(error as Error).message]);
  }
}
