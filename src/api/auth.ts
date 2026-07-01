import request from './request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: {
    id: number;
    username: string;
    realName: string;
    roles: string[];
    permissions: string[];
  };
}

export function loginApi(data: LoginParams): Promise<LoginResult> {
  return request.post('/auth/login', data);
}

export function registerApi(data: { username: string; password: string; realName: string }) {
  return request.post('/auth/register', data);
}

export function getUserInfoApi(): Promise<LoginResult> {
  return request.get('/auth/userinfo');
}

export function changePasswordApi(data: { oldPassword: string; newPassword: string }) {
  return request.put('/auth/password', data);
}
