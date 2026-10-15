import api from './api';

export type CustomerVoucher = {
  ma_voucher: number;
  ma_code: string;
  giam_tien: number;
  loai: 'SoTien' | 'PhanTram';
  giam_toi_da: number | null;
  don_toi_thieu: number;
  ket_thuc: string;
  so_luong?: number;
  co_the_dung: boolean;
  ly_do: string;
  la_cong_khai?: boolean;
  nguon_goc?: string;
  mo_ta?: string | null;
};

export const voucherService = {
  async getMine(subtotal?: number): Promise<CustomerVoucher[]> {
    const response = await api.get('/shop/my-vouchers', { params: subtotal === undefined ? {} : { tam_tinh: subtotal } });
    return response.data.data || [];
  },

  async claim(code: string): Promise<{ message: string; data: any }> {
    const response = await api.post('/shop/my-vouchers/claim', { ma_code: code });
    return response.data;
  },
};
