import request from '../utils/request';

export interface DeptNode {
  id: number;
  name: string;
  parent_id?: number;
  sort_order?: number;
  children?: DeptNode[];
}

export async function fetchDeptTree(): Promise<DeptNode[]> {
  const res = await request.get('/api/dept/tree');
  return res.data;
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
