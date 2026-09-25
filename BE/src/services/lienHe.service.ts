import { callProcedure, firstResult } from './procedure.service.js';

export const lienHeProcedures = {
  create: 'sp_lien_he_create',
  list: 'sp_lien_he_list',
  getById: 'sp_lien_he_get_by_id',
  updateStatus: 'sp_lien_he_update_status',
  remove: 'sp_lien_he_delete',
} as const;

export const lienHeService = {
  create: (params: unknown[]) => callProcedure(lienHeProcedures.create, params).then(firstResult),
  list: () => callProcedure(lienHeProcedures.list).then(firstResult),
  getById: (id: number) => callProcedure(lienHeProcedures.getById, [id]).then(firstResult),
  updateStatus: (params: unknown[]) => callProcedure(lienHeProcedures.updateStatus, params).then(firstResult),
  remove: (id: number) => callProcedure(lienHeProcedures.remove, [id]).then(firstResult),
};
