import request from '../utils/request';

export interface Position {
  id: number;
  name: string;
  sort_order: number;
}

export async function fetchPositionList(): Promise<Position[]> {
  const res = await request.get('/api/position/list');
  return res.data;
}

export async function createPosition(name: string, sortOrder?: number) {
  return request.post('/api/position', { name, sortOrder });
}

export async function updatePosition(id: number, name: string, sortOrder?: number) {
  return request.put(`/api/position/${id}`, { name, sortOrder });
}

export async function deletePosition(id: number) {
  return request.delete(`/api/position/${id}`);
}
