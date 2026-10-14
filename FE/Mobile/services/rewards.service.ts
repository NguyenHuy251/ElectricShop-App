import api from './api';

export interface RewardsStatus {
  diem_thuong: number;
  ma_gioi_thieu: string | null;
  da_nhap_ma_moi: boolean;
  so_ban_be_da_moi: number;
  tong_thuong_gioi_thieu: number;
  danh_sach_da_moi?: {
    ho_ten: string;
    diem_thuong: number;
    ngay_tham_gia: string;
  }[];
  da_diem_danh_hom_nay: boolean;
  chuoi_ngay: number;
  lich_su_diem_danh_tuan: string[];
  lich_su_diem_danh_30_ngay?: string[];
  mocs_da_nhan?: number[];
  da_quay_hom_nay?: boolean;
  vouchers_doi_thuong: {
    code: string;
    title: string;
    giam_tien: number;
    don_toi_thieu: number;
    xu_can: number;
  }[];
}

export interface CheckinResult {
  diem_cong: number;
  chuoi_ngay: number;
  qua_tang: string;
  tong_diem_hien_tai: number;
}

export interface ClaimMilestoneResult {
  moc_ngay: number;
  phan_thuong: string;
  diem_cong: number;
  voucher: string | null;
  tong_diem_hien_tai: number;
}

export interface ReferralResult {
  nguoi_gioi_thieu: string;
  diem_nhan: number;
  voucher_tan_thu: string;
}

export interface ExchangeResult {
  ma_code: string;
  xu_tru: number;
  xu_con_lai: number;
}

export interface SpinResult {
  prize: string;
  points_won: number;
  voucher_won: string | null;
  xu_con_lai: number;
}

export const rewardsService = {
  async getStatus(): Promise<RewardsStatus> {
    const response = await api.get('/shop/rewards/status');
    return response.data.data;
  },

  async checkin(): Promise<CheckinResult> {
    const response = await api.post('/shop/rewards/checkin');
    return response.data.data;
  },

  async claimMilestone(moc_ngay: number): Promise<ClaimMilestoneResult> {
    const response = await api.post('/shop/rewards/claim-milestone', { moc_ngay });
    return response.data.data;
  },

  async enterReferral(code: string): Promise<ReferralResult> {
    const response = await api.post('/shop/rewards/referral', { referral_code: code });
    return response.data.data;
  },

  async exchangeVoucher(rewardCode: string): Promise<ExchangeResult> {
    const response = await api.post('/shop/rewards/exchange', { reward_code: rewardCode });
    return response.data.data;
  },

  async spinWheel(): Promise<SpinResult> {
    const response = await api.post('/shop/rewards/spin');
    return response.data.data;
  },
};
