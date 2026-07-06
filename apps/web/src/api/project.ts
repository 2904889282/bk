import request from '../utils/request';

// ============================================================
// 项目模块 API 层
// 基础路径：/api/project（和单体后端 @RequestMapping 严格对齐）
// 响应格式：后端 R<T> → {code, msg, data}，由 request.ts 拦截器统一解包
// 字段命名：100% 对齐后端 ProjectVO / ProjectSaveDTO，前端零映射
// ============================================================

// ==================== 类型定义 ====================

/** 项目列表查询参数 */
export interface ProjectPageParams {
  pageNum: number;
  pageSize: number;
  keyword?: string;       // 关键词：匹配项目名称/客户公司
  status?: string;        // 项目状态：进行中/暂停/已交付/已终止
  projectLevel?: string;  // 项目等级：S/A/B/C
  deptBelong?: string;    // 所属部门
}

/** 项目视图对象（列表+详情同构） */
export interface ProjectVO {
  id: number;
  projectName: string;
  clientCompany: string;
  clientContact?: string;
  projectManager: string;
  projectAmount: number;
  projectLevel: string;
  projectStatus: string;
  deptBelong: string;
  startDate: string;
  expectEndDate?: string;
  actualEndDate?: string;
  progress: number;
  sourceClueId?: number;
  remark?: string;
  createTime: string;
  updateTime: string;
}

/** 分页返回结构 */
export interface ProjectPageResult {
  list: ProjectVO[];
  total: number;
}

/** 新增/编辑请求体 */
export interface ProjectSaveDTO {
  projectName: string;
  clientCompany: string;
  clientContact?: string;
  projectManager: string;
  projectAmount: number;
  projectLevel: string;
  projectStatus: string;
  deptBelong: string;
  startDate: string;
  expectEndDate?: string;
  progress?: number;
  remark?: string;
}

// ==================== 接口函数 ====================

/** 1. 分页查询项目列表 */
export async function fetchProjectPage(params: ProjectPageParams): Promise<ProjectPageResult> {
  const res = await request.get('/api/project/page', { params });
  return res.data;
}

/** 2. 获取项目详情 */
export async function fetchProjectDetail(id: number): Promise<ProjectVO> {
  const res = await request.get(`/api/project/${id}`);
  return res.data;
}

/** 3. 新增项目 */
export async function createProject(data: ProjectSaveDTO): Promise<void> {
  await request.post('/api/project', data);
}

/** 4. 编辑项目 */
export async function updateProject(id: number, data: ProjectSaveDTO): Promise<void> {
  await request.put(`/api/project/${id}`, data);
}

/** 5. 单条删除项目 */
export async function deleteProject(id: number): Promise<void> {
  await request.delete(`/api/project/${id}`);
}

/** 6. 批量删除项目 */
export async function deleteProjectBatch(ids: number[]): Promise<void> {
  await request.delete('/api/project/batch', { data: ids });
}
