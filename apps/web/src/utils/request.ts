import axios, { type AxiosRequestConfig } from 'axios';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

/** antd v6 message holder — 由 App.tsx 注入，避免静态调用警告 */
let _message: { error: (msg: string) => void; success?: (msg: string) => void } = { error: console.error };
export const setMessageApi = (api: typeof _message) => { _message = api; };
const msg = (text: string) => _message.error(text);

NProgress.configure({ showSpinner: false, minimum: 0.2, speed: 400, trickleSpeed: 200 });

// 请求计数：多个并发请求时不重复启停进度条
let reqCount = 0;
const startProgress = () => { reqCount++; NProgress.start(); };
const stopProgress = () => { reqCount--; if (reqCount <= 0) { reqCount = 0; NProgress.done(); } };

// 防重复提交锁：key = method:url:bodyHash
const pendingRequests = new Map<string, AbortController>();

// 无感刷新状态
let isRefreshing = false;
let refreshQueue: ((token: string) => void)[] = [];

const genKey = (config: AxiosRequestConfig) => {
  const { method, url, data } = config;
  return `${method?.toUpperCase()}:${url}:${typeof data === 'string' ? data : JSON.stringify(data || '')}`;
};

/** 清除所有认证信息 */
const clearAuth = () => {
  ['beike_token', 'beike_refresh_token', 'beike_user', 'beike_remember', 'beike_username'].forEach(k => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
};

/** 创建 mock 令牌错误对象，携带标记位供响应拦截器识别 */
const createMockTokenError = (url: string) => ({
  __mockToken: true,
  message: `演示模式下 API 不可用（${url}），请启动后端服务后使用真实账号登录`,
});

/**
 * 判断 mock 令牌是否可以放行到后端。
 * 仅允许后端的无鉴权认证接口（与 SecurityConfig WHITELIST 对齐）+ userinfo。
 * /api/auth/devices 等需要鉴权的接口不在白名单内，mock 令牌会被拦截。
 */
const MOCK_ALLOWED_AUTH_URLS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/send-code',
  '/api/auth/reset-password',
  '/api/auth/login-by-email',
  '/api/auth/userinfo',
];
const isMockAllowedAuthUrl = (url: string) =>
  MOCK_ALLOWED_AUTH_URLS.some(allowed => url.startsWith(allowed));

/** 防止 mock 模式下多个并发 API 调用重复弹 toast */
let mockTokenNotified = false;
const resetMockTokenNotified = () => { mockTokenNotified = false; };

/** 判断是否为 mock 令牌错误（供各页面 catch 块使用） */
export const isMockTokenError = (err: unknown): boolean =>
  !!(err as { __mockToken?: boolean }).__mockToken;

const request = axios.create({
  baseURL: '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ========== 请求拦截器 ==========
request.interceptors.request.use(config => {
  const token = localStorage.getItem('beike_token') || sessionStorage.getItem('beike_token');

  // 拦截 mock 演示令牌（mock_xxx）：阻止发送无效令牌到后端
  // mock 令牌无法通过 Spring Security JWT 校验，必然导致 HTTP 403，
  // 此处提前拦截并给出明确指引，避免用户困惑。
  if (token && token.startsWith('mock_')) {
    const url = (config.url || '').toLowerCase();
    // 仅放行后端 SecurityConfig 白名单中的认证接口 + userinfo
    if (!isMockAllowedAuthUrl(url)) {
      return Promise.reject(createMockTokenError(config.url || ''));
    }
  } else if (token) {
    // 真实令牌：重置 mock 通知标志，以便用户切换回 mock 模式时能再次提示
    resetMockTokenNotified();
  }

  if (token) config.headers.Authorization = `Bearer ${token}`;

  // DELETE 请求统一携带确认标记
  if (config.method?.toUpperCase() === 'DELETE' && config.url?.includes('/api/')) {
    config.data = { ...(config.data || {}), confirm: true };
  }

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
      msg(body.message || body.msg || '操作失败');
      return Promise.reject(body);
    }
    return resp;
  },
  async err => {
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

    // Mock 令牌拦截：演示模式下后端不可用，给出明确指引（同次会话只弹一次）
    if (err.__mockToken) {
      if (!mockTokenNotified) {
        mockTokenNotified = true;
        msg('当前为演示模式，请启动后端服务后使用真实账号登录');
      }
      return Promise.reject(err);
    }

    // HTTP 状态码处理
    const status = err.response?.status;

    // 401 → 尝试无感刷新 Access Token
    if (status === 401 && !err.config._retry && !err.config.url?.includes('/auth/refresh')) {
      err.config._retry = true;

      if (isRefreshing) {
        return new Promise(resolve => {
          refreshQueue.push((newToken: string) => {
            err.config.headers.Authorization = `Bearer ${newToken}`;
            resolve(request(err.config));
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem('beike_refresh_token') || sessionStorage.getItem('beike_refresh_token');
        if (!refreshToken) throw new Error('no refresh token');

        // 判断原始存储位置
        const store = localStorage.getItem('beike_token') ? localStorage : sessionStorage;

        const resp = await axios.post('/api/auth/refresh', { refreshToken });
        const { token: newToken, refreshToken: newRefresh } = resp.data.data || resp.data;

        store.setItem('beike_token', newToken);
        if (newRefresh) store.setItem('beike_refresh_token', newRefresh);

        refreshQueue.forEach(cb => cb(newToken));
        refreshQueue = [];

        err.config.headers.Authorization = `Bearer ${newToken}`;
        return request(err.config);
      } catch {
        msg('登录已过期，请重新登录');
        clearAuth();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // 403：后端返回的具体消息优先于通用提示
    if (status === 403) {
      const bodyMsg = err.response?.data?.message;
      msg(bodyMsg || '当前账号无此操作权限，请联系管理员开通权限');
    } else if (status === 400) {
      const data = err.response?.data;
      msg(data?.message || data?.msg || '请求参数错误');
    } else if (status === 404) {
      msg('请求的资源不存在');
    } else if (status && status >= 500) {
      msg('系统繁忙，请稍后重试');
    } else if (err.code === 'ECONNABORTED') {
      msg('请求超时，请检查网络');
    } else if (err.message === 'Network Error') {
      msg('网络连接失败，请检查后端服务');
    }

    return Promise.reject(err);
  }
);

export default request;
