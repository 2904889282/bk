import request from './request';

// 用户管理
export function fetchUserList(params: Record<string, unknown>) {
  return request.get('/user/page', { params });
}
export function createUser(data: Record<string, unknown>) {
  return request.post('/user', data);
}
export function updateUser(id: number, data: Record<string, unknown>) {
  return request.put(`/user/${id}`, data);
}
export function toggleUserStatus(id: number) {
  return request.put(`/user/${id}/status`);
}
export function resetUserPassword(id: number) {
  return request.put(`/user/${id}/reset-password`);
}

// 角色权限
export function fetchRoleList() { return request.get('/role/list'); }
export function fetchRolePerms(roleId: number) { return request.get(`/role/${roleId}/permission`); }
export function assignPermissions(roleId: number, permissionIds: number[]) {
  return request.put('/role/permission', { roleId, permissionIds });
}
export function fetchAllPermissions() { return request.get('/role/permission/all'); }

// 回收站
export function fetchRecycleList(params: Record<string, unknown>) {
  return request.get('/recycle/page', { params });
}
export function restoreItems(type: string, ids: number[]) {
  return request.put('/recycle/restore', { type, ids });
}
export function permDeleteItems(type: string, ids: number[]) {
  return request.delete('/recycle/perm', { data: { type, ids } });
}

// 操作日志
export function fetchLogList(params: Record<string, unknown>) {
  return request.get('/log/page', { params });
}
