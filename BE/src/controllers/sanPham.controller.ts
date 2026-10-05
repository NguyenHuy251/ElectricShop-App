import { getVariants } from './bienThe.controller.js';
import { Request, Response } from 'express';
import { duplicateField } from '../utils/adminErrors.js';
import { sendError, sendSuccess } from '../utils/response.js';
import * as sanPhamService from '../services/sanPham.service.js';
import * as thongSoService from '../services/thongSo.service.js';
import type { GroupedSpecification, ProductSpecification } from '../types/index.js';
import { pool } from '../config/database.js';

export function groupSpecifications(specs: ProductSpecification[]): GroupedSpecification[] {
  const map = new Map<string, { group: string; thu_tu_nhom: number; items: any[] }>();

  for (const s of specs || []) {
    const groupName = s.ten_nhom || 'Thông số khác';
    if (!map.has(groupName)) {
      map.set(groupName, {
        group: groupName,
        thu_tu_nhom: s.thu_tu_nhom ?? 999,
        items: [],
      });
    }

    let displayValue = s.gia_tri;
    if (displayValue == null) {
      if (s.gia_tri_so != null) {
        displayValue = s.don_vi ? `${s.gia_tri_so} ${s.don_vi}` : String(s.gia_tri_so);
      } else if (s.gia_tri_bool != null) {
        displayValue = s.gia_tri_bool ? 'Có' : 'Không';
      } else {
        displayValue = '';
      }
    }

    map.get(groupName)!.items.push({
      ma_thong_so: s.ma_thong_so,
      name: s.ten_thong_so || '',
      value: displayValue,
      raw_value: s.gia_tri,
      numeric_value: s.gia_tri_so,
      bool_value: s.gia_tri_bool,
      unit: s.don_vi || null,
      type: s.kieu_du_lieu || 'TEXT',
      order: s.thu_tu_thong_so ?? 0,
    });
  }

  return Array.from(map.values())
    .sort((a, b) => a.thu_tu_nhom - b.thu_tu_nhom)
    .map(g => ({
      group: g.group,
      items: g.items.sort((a, b) => a.order - b.order),
    }));
}

export function normalizeSpecificationsInput(specsInput: unknown): {
  normalized: { ma_thong_so: number; gia_tri: string | null; gia_tri_so: number | null; gia_tri_bool: boolean | null }[];
  duplicateSpecId: number | null;
} {
  if (!Array.isArray(specsInput)) return { normalized: [], duplicateSpecId: null };

  const seen = new Set<number>();
  const normalized: { ma_thong_so: number; gia_tri: string | null; gia_tri_so: number | null; gia_tri_bool: boolean | null }[] = [];

  for (const item of specsInput) {
    if (!item || typeof item !== 'object') continue;
    const ma_thong_so = Number((item as any).ma_thong_so);
    if (!ma_thong_so || Number.isNaN(ma_thong_so)) continue;

    if (seen.has(ma_thong_so)) {
      return { normalized: [], duplicateSpecId: ma_thong_so };
    }
    seen.add(ma_thong_so);

    const rawVal = (item as any).gia_tri;
    const rawNum = (item as any).gia_tri_so;
    const rawBool = (item as any).gia_tri_bool;

    let gia_tri: string | null = rawVal != null ? String(rawVal).trim() : null;
    let gia_tri_so: number | null = rawNum != null && Number.isFinite(Number(rawNum)) ? Number(rawNum) : null;
    let gia_tri_bool: boolean | null = rawBool != null ? Boolean(rawBool) : null;

    if (gia_tri_so == null && gia_tri != null && !Number.isNaN(Number(gia_tri)) && gia_tri.trim() !== '') {
      gia_tri_so = Number(gia_tri);
    }
    if (gia_tri_bool == null && gia_tri != null) {
      if (gia_tri.toLowerCase() === 'true' || gia_tri === '1') gia_tri_bool = true;
      else if (gia_tri.toLowerCase() === 'false' || gia_tri === '0') gia_tri_bool = false;
    }

    normalized.push({
      ma_thong_so,
      gia_tri,
      gia_tri_so,
      gia_tri_bool,
    });
  }

  return { normalized, duplicateSpecId: null };
}

export function extractImagesInput(reqBody: any): {
  primaryImage: string | null;
  allImages: (string | { duong_dan: string; mo_ta?: string | null; la_anh_chinh?: boolean; thu_tu_hien_thi?: number })[];
} {
  const images = reqBody.danh_sach_hinh_anh || reqBody.images || reqBody.hinh_anh;
  let primaryImage = typeof reqBody.hinh_anh === 'string' && reqBody.hinh_anh.trim() ? reqBody.hinh_anh.trim() : null;
  const allImages: (string | { duong_dan: string; mo_ta?: string | null; la_anh_chinh?: boolean; thu_tu_hien_thi?: number })[] = [];

  if (Array.isArray(images)) {
    for (const img of images) {
      if (typeof img === 'string' && img.trim()) {
        allImages.push(img.trim());
      } else if (img && typeof img === 'object' && img.duong_dan) {
        allImages.push({
          duong_dan: String(img.duong_dan).trim(),
          mo_ta: img.mo_ta || null,
          la_anh_chinh: Boolean(img.la_anh_chinh),
          thu_tu_hien_thi: Number(img.thu_tu_hien_thi) || undefined,
        });
        if (img.la_anh_chinh && !primaryImage) {
          primaryImage = String(img.duong_dan).trim();
        }
      }
    }
  } else if (primaryImage) {
    allImages.push(primaryImage);
  }

  if (!primaryImage && allImages.length > 0) {
    const first = allImages[0];
    primaryImage = typeof first === 'string' ? first : first.duong_dan;
  }

  return { primaryImage, allImages };
}

export async function getAllSanPham(req: Request, res: Response) {
  try {
    const { page = 1, limit = 10, search = '', ma_danh_muc, ma_thuong_hieu, min_price, max_price } = req.query;

    if (!Number.isInteger(Number(page)) || Number(page) < 1 || !Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100) {
      return sendError(res, 400, 'Phân trang không hợp lệ');
    }
    const offset = (Number(page) - 1) * Number(limit);
    const searchTerm = String(search || '').trim();

    const result = await sanPhamService.listSanPham([
      searchTerm,
      ma_danh_muc ? Number(ma_danh_muc) : null,
      ma_thuong_hieu ? Number(ma_thuong_hieu) : null,
      min_price ? Number(min_price) : null,
      max_price ? Number(max_price) : null,
      Number(limit),
      offset,
    ]);

    const enrichedRows = result.rows.map(row => ({
      ...row,
      specifications: groupSpecifications(row.thong_so_ky_thuat || []),
      images: row.danh_sach_hinh_anh || [],
    }));

    const total = result.count[0]?.total ?? 0;

    return sendSuccess(res, 'Danh sách sản phẩm', enrichedRows, {
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
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return sendError(res, 400, 'Mã sản phẩm không hợp lệ');
    }

    const data = await sanPhamService.getSanPhamById(id);
    if (!data || !data.product) {
      return sendError(res, 404, 'Không tìm thấy sản phẩm');
    }

    const { product, categorySpecs } = data;
    const [variantRows] = await pool.query('SELECT ma_bien_the, ma_san_pham, ma_sku, ten_bien_the, gia_ban, so_luong, trang_thai FROM san_pham_bien_the WHERE ma_san_pham = ? ORDER BY ma_bien_the', [id]);
    const specifications = groupSpecifications(product.thong_so_ky_thuat || []);
    const images = product.danh_sach_hinh_anh || [];

    const variants = await getVariants(id);
    const fullResponse = {
      product_variants: variants,
      ...product,
      product: { ...product },
      images,
      specifications,
      category_specifications: categorySpecs || [],
      variants: variantRows,
    };

    return sendSuccess(res, 'Sản phẩm được tìm thấy', fullResponse);
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
      trang_thai,
      thong_so,
      specifications,
    } = req.body;

    if (!ma_danh_muc || !ma_thuong_hieu || !ma_san_pham_code || !ten_san_pham || !gia_ban) {
      return sendError(res, 400, 'Thiếu thông tin sản phẩm bắt buộc');
    }

    const existing = await sanPhamService.findSanPhamByCode(String(ma_san_pham_code).trim());
    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: 'Mã sản phẩm đã tồn tại',
        fieldErrors: { ma_san_pham_code: 'Mã sản phẩm đã tồn tại' },
      });
    }

    // Specifications normalization & validation
    const specsInput = thong_so || specifications;
    const { normalized, duplicateSpecId } = normalizeSpecificationsInput(specsInput);
    if (duplicateSpecId) {
      return res.status(409).json({
        success: false,
        message: `Thông số mã ${duplicateSpecId} xuất hiện nhiều lần`,
      });
    }

    if (normalized.length > 0) {
      const specValidation = await thongSoService.validateSpecificationsForCategory(Number(ma_danh_muc), normalized);
      if (!specValidation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Có thông số không hợp lệ với danh mục sản phẩm',
          invalidSpecIds: specValidation.invalidSpecIds,
        });
      }
    }

    // Images normalization
    const { primaryImage, allImages } = extractImagesInput(req.body);

    const insertId = await sanPhamService.createSanPham(
      [
        Number(ma_danh_muc),
        Number(ma_thuong_hieu),
        String(ma_san_pham_code).trim(),
        String(ten_san_pham).trim(),
        mo_ta || null,
        gia_nhap != null ? Number(gia_nhap) : 0,
        Number(gia_ban),
        so_luong != null ? Number(so_luong) : 0,
        bao_hanh != null ? Number(bao_hanh) : 12,
        primaryImage,
        trang_thai || 'DangBan',
        normalized.length > 0 ? JSON.stringify(normalized) : null,
      ],
      allImages
    );

    return sendSuccess(res, 'Thêm sản phẩm thành công', { ma_san_pham: insertId });
  } catch (error) {
    if (duplicateField(error, res, 'ma_san_pham_code', 'Mã sản phẩm đã tồn tại')) return;
    return sendError(res, 500, 'Lỗi khi thêm sản phẩm', [(error as Error).message]);
  }
}

export async function updateSanPham(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return sendError(res, 400, 'Mã sản phẩm không hợp lệ');
    }

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
      trang_thai,
      thong_so,
      specifications,
    } = req.body;

    const existingProductData = await sanPhamService.getSanPhamById(id);
    if (!existingProductData || !existingProductData.product) {
      return sendError(res, 404, 'Không tìm thấy sản phẩm');
    }

    const targetDanhMuc = ma_danh_muc != null ? Number(ma_danh_muc) : existingProductData.product.ma_danh_muc;

    // Check duplicate code if changed
    if (ma_san_pham_code && String(ma_san_pham_code).trim() !== existingProductData.product.ma_san_pham_code) {
      const codeCheck = await sanPhamService.findSanPhamByCode(String(ma_san_pham_code).trim());
      if (codeCheck.length && (codeCheck[0] as any).ma_san_pham !== id) {
        return res.status(409).json({
          success: false,
          message: 'Mã sản phẩm đã tồn tại',
          fieldErrors: { ma_san_pham_code: 'Mã sản phẩm đã tồn tại' },
        });
      }
    }

    // Specifications normalization
    const specsInput = thong_so !== undefined ? thong_so : specifications;
    let thongSoJsonParam: string | null = null;

    if (specsInput !== undefined) {
      const { normalized, duplicateSpecId } = normalizeSpecificationsInput(specsInput);
      if (duplicateSpecId) {
        return res.status(409).json({
          success: false,
          message: `Thông số mã ${duplicateSpecId} xuất hiện nhiều lần`,
        });
      }

      if (normalized.length > 0) {
        const specValidation = await thongSoService.validateSpecificationsForCategory(targetDanhMuc, normalized);
        if (!specValidation.valid) {
          return res.status(400).json({
            success: false,
            message: 'Có thông số không hợp lệ với danh mục sản phẩm',
            invalidSpecIds: specValidation.invalidSpecIds,
          });
        }
      }
      thongSoJsonParam = JSON.stringify(normalized);
    }

    const { primaryImage, allImages } = extractImagesInput(req.body);

    await sanPhamService.updateSanPham(
      [
        id,
        ma_danh_muc != null ? Number(ma_danh_muc) : null,
        ma_thuong_hieu != null ? Number(ma_thuong_hieu) : null,
        ma_san_pham_code ? String(ma_san_pham_code).trim() : null,
        ten_san_pham ? String(ten_san_pham).trim() : null,
        mo_ta !== undefined ? mo_ta : null,
        gia_nhap != null ? Number(gia_nhap) : null,
        gia_ban != null ? Number(gia_ban) : null,
        so_luong != null ? Number(so_luong) : null,
        bao_hanh != null ? Number(bao_hanh) : null,
        primaryImage || null,
        trang_thai || null,
        thongSoJsonParam,
      ],
      allImages.length > 0 ? allImages : undefined
    );

    return sendSuccess(res, 'Cập nhật sản phẩm thành công', { ma_san_pham: id });
  } catch (error) {
    if (duplicateField(error, res, 'ma_san_pham_code', 'Mã sản phẩm đã tồn tại')) return;
    return sendError(res, 500, 'Lỗi khi cập nhật sản phẩm', [(error as Error).message]);
  }
}

export async function deleteSanPham(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return sendError(res, 400, 'Mã sản phẩm không hợp lệ');
    }

    const existingProductData = await sanPhamService.getSanPhamById(id);
    if (!existingProductData || !existingProductData.product) {
      return sendError(res, 404, 'Không tìm thấy sản phẩm');
    }

    await sanPhamService.deleteSanPham(id);
    return sendSuccess(res, 'Xóa sản phẩm thành công', { ma_san_pham: id });
  } catch (error) {
    if (duplicateField(error, res, 'ma_san_pham_code', 'Mã sản phẩm đã tồn tại')) return;
    if (['ER_ROW_IS_REFERENCED_2', 'ER_ROW_IS_REFERENCED'].includes((error as { code?: string }).code || '')) {
      return sendError(res, 409, 'Sản phẩm đang được sử dụng trong đơn hàng, không thể xóa.');
    }
    return sendError(res, 500, 'Lỗi khi xóa sản phẩm', [(error as Error).message]);
  }
}

// Multi-image management endpoints
export async function getProductImages(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const images = await sanPhamService.getProductImages(id);
    return sendSuccess(res, 'Danh sách hình ảnh sản phẩm', images);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy danh sách hình ảnh', [(error as Error).message]);
  }
}

export async function addProductImage(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { duong_dan, mo_ta, la_anh_chinh, thu_tu_hien_thi } = req.body;
    if (!duong_dan || !String(duong_dan).trim()) {
      return sendError(res, 400, 'Đường dẫn hình ảnh không được để trống');
    }
    const insertId = await sanPhamService.addProductImage(id, {
      duong_dan: String(duong_dan).trim(),
      mo_ta,
      la_anh_chinh,
      thu_tu_hien_thi,
    });
    return sendSuccess(res, 'Thêm hình ảnh thành công', { ma_hinh_anh: insertId });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi thêm hình ảnh', [(error as Error).message]);
  }
}

export async function deleteProductImage(req: Request, res: Response) {
  try {
    const productId = Number(req.params.id);
    const imageId = Number(req.params.ma_hinh_anh);
    await sanPhamService.deleteProductImage(productId, imageId);
    return sendSuccess(res, 'Xóa hình ảnh thành công', { ma_hinh_anh: imageId });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi xóa hình ảnh', [(error as Error).message]);
  }
}

export async function setPrimaryProductImage(req: Request, res: Response) {
  try {
    const productId = Number(req.params.id);
    const imageId = Number(req.params.ma_hinh_anh);
    await sanPhamService.setPrimaryProductImage(productId, imageId);
    return sendSuccess(res, 'Đặt ảnh chính thành công', { ma_hinh_anh: imageId, la_anh_chinh: true });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi đặt ảnh chính', [(error as Error).message]);
  }
}
