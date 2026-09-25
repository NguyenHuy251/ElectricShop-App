import { callProcedure, firstResult } from './procedure.service.js';

export const authProcedures = {
  register: 'sp_auth_register',
  findByUsername: 'sp_auth_find_by_username',
  checkDuplicate: 'sp_auth_check_duplicate',
  findById: 'sp_auth_find_by_id',
  updateProfile: 'sp_auth_update_profile',
} as const;

export const authService = {
  register: (params: unknown[]) => callProcedure(authProcedures.register, params).then(firstResult),
  findByUsername: (username: string) => callProcedure(authProcedures.findByUsername, [username]).then(firstResult),
  checkDuplicate: (username: string, email: string, excludeId = 0) => callProcedure(authProcedures.checkDuplicate, [username, email, excludeId]).then(firstResult),
  findById: (id: number) => callProcedure(authProcedures.findById, [id]).then(firstResult),
  updateProfile: (params: unknown[]) => callProcedure(authProcedures.updateProfile, params).then(firstResult),
};
