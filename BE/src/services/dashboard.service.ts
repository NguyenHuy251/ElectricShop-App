import { callProcedure, firstResult, secondResult } from './procedure.service.js';

export const dashboardProcedures = {
  summary: 'sp_dashboard_summary',
} as const;

export async function getDashboardData() {
  const resultSets = await callProcedure(dashboardProcedures.summary);
  return { summary: firstResult(resultSets), monthly: secondResult(resultSets) };
}
