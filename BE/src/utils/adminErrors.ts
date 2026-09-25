import { Response } from 'express';
export function duplicateField(error: unknown, res: Response, field: string, message: string): boolean {
  if ((error as { code?: string }).code !== 'ER_DUP_ENTRY') return false;
  res.status(409).json({ success: false, message, fieldErrors: { [field]: message } });
  return true;
}
