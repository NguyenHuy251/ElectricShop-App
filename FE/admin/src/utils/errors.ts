import axios from 'axios';
import type { FormInstance } from 'antd';
import type { ApiError } from '../types';

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiError>(error)) return error.response?.data?.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.';
  return error instanceof Error ? error.message : 'Thao tác thất bại. Vui lòng thử lại.';
}
export function fieldErrors(error: unknown, form: FormInstance) {
  if (!axios.isAxiosError<ApiError>(error)) return;
  const errors = error.response?.data?.fieldErrors;
  if (errors) form.setFields(Object.entries(errors).map(([name, value]) => ({ name, errors: Array.isArray(value) ? value : [value] })));
}
