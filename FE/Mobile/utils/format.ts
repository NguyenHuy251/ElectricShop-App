export function formatCurrency(value?: number | string | null) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('vi-VN')}đ`;
}

export function formatDate(value?: string | Date | null) {
  if (!value) return 'Chưa cập nhật';
  return new Date(value).toLocaleDateString('vi-VN');
}

export function getApiMessage(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
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
