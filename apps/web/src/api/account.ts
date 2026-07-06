import request from '../utils/request';

// ==================== 类型 ====================

export interface LoginDevice {
  id: number;
  userId: number;
  tokenJti: string;
  deviceName: string;
  ip: string;
  userAgent: string;
  loginTime: string;
  lastActive: string;
  active: number;
  isCurrent: boolean;
}

// ==================== 忘记密码 ====================

export async function sendVerifyCode(email: string): Promise<{ message: string; code: string }> {
  const res = await request.post('/api/auth/send-code', { email });
  return res.data;
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  await request.post('/api/auth/reset-password', { email, code, newPassword });
}

// ==================== 微信登录 ====================

export async function getWechatAuthUrl(): Promise<string> {
  const res = await request.get('/api/auth/wechat/url');
  return res.data.url;
}

export async function wechatCallback(code: string): Promise<any> {
  const res = await request.get('/api/auth/wechat/callback', { params: { code } });
  return res.data;
}

// ==================== 设备管理 ====================

export async function fetchDevices(): Promise<LoginDevice[]> {
  const res = await request.get('/api/auth/devices');
  return res.data;
}

export async function kickDevice(id: number): Promise<void> {
  await request.delete(`/api/auth/devices/${id}`);
}

export async function kickAllDevices(): Promise<void> {
  await request.delete('/api/auth/devices');
}
