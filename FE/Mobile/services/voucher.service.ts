import api from './api';
export type CustomerVoucher = {
  ma_voucher: number; ma_code: string; giam_tien: number; loai: 'SoTien' | 'PhanTram';
  giam_toi_da: number | null; don_toi_thieu: number; ket_thuc: string; co_the_dung: boolean; ly_do: string;
};
export const voucherService = {
  async getMine(subtotal?: number): Promise<CustomerVoucher[]> {
    const response = await api.get('/shop/my-vouchers', { params: subtotal === undefined ? {} : { tam_tinh: subtotal } });
    return response.data.data || [];
  },
};
