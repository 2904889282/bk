import axios from 'axios';
import { message } from 'antd';

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// 清除登录态
function clearAuth() {
  localStorage.removeItem('beike_token');
  localStorage.removeItem('beike_user');
}

// 请求拦截器：自动注入 Token
request.interceptors.request.use(config => {
  const token = localStorage.getItem('beike_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一错误处理
request.interceptors.response.use(
  res => {
    const { code, message: msg, data } = res.data;
    if (code === 200) return data;
    // 业务无权限（BizException 403）
    if (code === 403) {
      message.error('无操作权限');
      return Promise.reject(new Error('无权限'));
    }
    message.error(msg || '请求失败');
    return Promise.reject(new Error(msg));
  },
  err => {
    if (err.response?.status === 401) {
      // HTTP 401 → 未登录/Token失效
      clearAuth();
      window.location.href = '/login';
    } else if (err.response?.status === 403) {
      // 区分：Spring Security 原生 403（无登录态） vs BizException 403（无权限）
      const body = err.response.data;
      if (body && body.code === 403) {
        // BizException.noPermission() — 已登录但权限不足
        message.error('无操作权限');
      } else {
        // Spring Security 默认 403 — Token 缺失/无效
        clearAuth();
        window.location.href = '/login';
      }
    } else if (!err.response) {
      message.error('网络异常，请检查网络连接');
    } else {
      message.error('服务器异常，请稍后重试');
    }
    return Promise.reject(err);
  }
);

export default request;
