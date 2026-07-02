import axios from 'axios';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { message } from 'antd';

NProgress.configure({ showSpinner: false, minimum: 0.2, speed: 400, trickleSpeed: 200 });

// 请求计数：多个并发请求时不重复启停进度条
let reqCount = 0;
const startProgress = () => { reqCount++; NProgress.start(); };
const stopProgress = () => { reqCount--; if (reqCount <= 0) { reqCount = 0; NProgress.done(); } };

// 防重复提交锁：key = method:url:bodyHash
const pendingRequests = new Map<string, AbortController>();

const genKey = (config: axios.AxiosRequestConfig) => {
  const { method, url, data } = config;
  return `${method?.toUpperCase()}:${url}:${typeof data === 'string' ? data : JSON.stringify(data || '')}`;
};

const request = axios.create({
  baseURL: '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ========== 请求拦截器 ==========
request.interceptors.request.use(config => {
  const token = localStorage.getItem('beike_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // 非 GET 请求防重复提交
  const method = config.method?.toUpperCase();
  if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && !config.headers['X-Allow-Duplicate']) {
    const key = genKey(config);
    if (pendingRequests.has(key)) {
      const controller = pendingRequests.get(key)!;
      controller.abort();
      pendingRequests.delete(key);
    }
    const controller = new AbortController();
    config.signal = controller.signal;
    pendingRequests.set(key, controller);
  }

  startProgress();
  return config;
});

// ========== 响应拦截器 ==========
request.interceptors.response.use(
  resp => {
    stopProgress();
    // 清除防重复锁
    const method = resp.config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      pendingRequests.delete(genKey(resp.config));
    }

    const body = resp.data;
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 200) {
        resp.data = body.data;
        return resp;
      }
      // 业务错误
      message.error(body.message || body.msg || '操作失败');
      return Promise.reject(body);
    }
    return resp;
  },
  err => {
    stopProgress();
    // 清除防重复锁
    if (err.config) {
      const method = err.config.method?.toUpperCase();
      if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        pendingRequests.delete(genKey(err.config));
      }
    }

    // 请求被取消（防重复或路由切换）
    if (axios.isCancel(err)) return Promise.reject(err);

    // HTTP 状态码处理
    const status = err.response?.status;
    if (status === 401 || status === 403) {
      message.error(status === 401 ? '登录已过期，请重新登录' : '认证失败，请重新登录');
      localStorage.removeItem('beike_token');
      localStorage.removeItem('beike_user');
      localStorage.removeItem('rm_user');
      localStorage.removeItem('rm_pass');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (status === 404) {
      message.error('请求的资源不存在');
    } else if (status && status >= 500) {
      message.error('系统繁忙，请稍后重试');
    } else if (err.code === 'ECONNABORTED') {
      message.error('请求超时，请检查网络');
    } else if (err.message === 'Network Error') {
      message.error('网络连接失败，请检查后端服务');
    }

    return Promise.reject(err);
  }
);

export default request;
