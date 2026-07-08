import request from '../utils/request';

/** 部门选项 */
export interface DeptOption {
  id: number;
  name: string;
}

/** 用户简易选项（承接人下拉） */
export interface UserOption {
  id: number;
  username: string;
  realName: string;
  label: string;
  deptId: number;
}

/** 获取部门列表 */
export async function fetchDeptList(): Promise<DeptOption[]> {
  const res = await request.get('/api/dept/list');
  return res.data;
}

/** 获取用户列表（承接人下拉） */
export async function fetchUserOptions(): Promise<UserOption[]> {
  const res = await request.get('/api/dept/users');
  return res.data;
}
