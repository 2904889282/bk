import request from './request';

export interface ProjectVO {
  id: number; projectName: string; clientName: string; projectManager: string;
  projectAmount: number; projectStatus: string; progress: number; startDate: string;
  expectedEnd: string; actualEnd: string; stage: string; projectLevel: string;
  deptBelong: string; sourceClueId: number; arUserId: number; srUserId: number; frUserId: number;
  riskCount: number; description: string; createTime: string; updateTime: string;
}

export interface ProjectPageResult { list: ProjectVO[]; total: number; pageNum: number; pageSize: number; }

export function fetchProjectList(params: Record<string, unknown>): Promise<ProjectPageResult> {
  return request.get('/project/page', { params });
}

export function fetchProjectDetail(id: number): Promise<ProjectVO> {
  return request.get(`/project/${id}`);
}

export function createProject(data: Record<string, unknown>) {
  return request.post('/project', data);
}

export function updateProject(id: number, data: Record<string, unknown>) {
  return request.put(`/project/${id}`, data);
}

export function deleteProject(id: number) {
  return request.delete(`/project/${id}`);
}

export function deleteProjectBatch(ids: number[]) {
  return request.delete('/project/batch', { data: ids });
}
