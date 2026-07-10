import request from '../utils/request';

export interface DeptNode {
  id: number;
  name: string;
  parent_id?: number;
  sort_order?: number;
  children?: DeptNode[];
}

export interface DeptOption {
  id: number;
  name: string;
  label?: string;
  value?: number;
}

export interface UserOption {
  id: number;
  name: string;
  username?: string;
  realName?: string;
  deptId?: number;
  label?: string;
  value?: number;
}

export async function fetchDeptTree(): Promise<DeptNode[]> {
  const res = await request.get('/api/dept/tree');
  return res.data;
}

export async function fetchDeptList(): Promise<DeptOption[]> {
  try {
    const res = await request.get('/api/dept/list');
    return res.data || [];
  } catch {
    return [];
  }
}

export async function fetchUserOptions(): Promise<UserOption[]> {
  try {
    const res = await request.get('/api/user/options');
    return res.data || [];
  } catch {
    return [];
  }
}

export async function createDept(name: string, parentId?: number | null) {
  return request.post('/api/dept', { name, parentId });
}

export async function updateDept(id: number, name: string, parentId?: number | null) {
  return request.put(`/api/dept/${id}`, { name, parentId });
}

export async function deleteDept(id: number) {
  return request.delete(`/api/dept/${id}`);
}
