export function formatCurrency(value?: number | string | null) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('vi-VN')}đ`;
}

export function formatDate(value?: string | Date | null) {
  if (!value) return 'Chưa cập nhật';
  return new Date(value).toLocaleDateString('vi-VN');
}

export function getApiMessage(error: any, fallback: string) {
  if (error?.response?.status === 401 && !['/auth/login', '/auth/register'].includes(error.config?.url)) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (error?.code === 'ECONNABORTED') return 'Kết nối máy chủ quá thời gian chờ. Vui lòng thử lại.';
  if (error?.isAxiosError && !error.response) return 'Không kết nối được máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.';
  return error?.response?.data?.message || error?.response?.data?.errors?.[0] || fallback;
}

export function getInitials(name?: string | null) {
  if (!name) return 'U';
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
