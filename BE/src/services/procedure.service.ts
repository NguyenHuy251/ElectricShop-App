import { pool } from '../config/database.js';

export type ProcedureRow = Record<string, unknown>;

export async function callProcedure(name: string, params: unknown[] = []): Promise<ProcedureRow[][]> {
  const placeholders = params.map(() => '?').join(', ');
  const [result] = await pool.query(`CALL ${name}(${placeholders})`, params);
  return (result as unknown[]).filter(Array.isArray) as ProcedureRow[][];
}

export function firstResult<T extends ProcedureRow = ProcedureRow>(resultSets: ProcedureRow[][]): T[] {
  return (resultSets[0] || []) as T[];
}

export function secondResult<T extends ProcedureRow = ProcedureRow>(resultSets: ProcedureRow[][]): T[] {
  return (resultSets[1] || []) as T[];
}

export function procedureError(error: unknown): { code?: string; sqlMessage?: string; message?: string } {
  return error as { code?: string; sqlMessage?: string; message?: string };
}
