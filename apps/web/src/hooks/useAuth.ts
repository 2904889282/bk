import { create } from 'zustand';
import request from '../utils/request';
import { FALLBACK_MENUS, type MenuItem } from '../config/menus';

/** 根据是否"记住我"选择存储位置 */
const tokenStore = {
  get(key: string) {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  },
  set(remember: boolean, key: string, value: string) {
    const s = remember ? localStorage : sessionStorage;
    s.setItem(key, value);
  },
  clear(key: string) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

interface UserInfo { id: string; username: string; name: string; avatar: string; roles: string[]; }
interface AuthState {
  user: UserInfo | null;
  token: string | null;
  permissions: string[];
  menus: MenuItem[];
  isLoggedIn: boolean;
  login: (username: string, password: string, remember?: boolean) => Promise<{ success: boolean; msg?: string }>;
  fetchUserInfo: () => Promise<void>;
  logout: () => void;
  hasPermission: (code: string) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: tokenStore.get('beike_token'),
  permissions: [],
  menus: [],
  isLoggedIn: false,

  login: async (username, password, remember = true) => {
    // 1. 尝试后端登录
    try {
      const res = await request.post('/api/auth/login', { username, password });
      const data = res.data;
      const user = normalizeUser(data.user);
      const permissions = normalizePermissions(data);

      tokenStore.set(remember, 'beike_token', data.token);
      if (data.refreshToken) tokenStore.set(remember, 'beike_refresh_token', data.refreshToken);
      // user 始终存 localStorage（UI 展示用，非敏感）
      localStorage.setItem('beike_user', JSON.stringify(user));

      if (remember) {
        localStorage.setItem('beike_remember', '1');
        localStorage.setItem('beike_username', username);
      }

      set({ token: data.token, user, isLoggedIn: true, permissions, menus: data.menus || [] });
      return { success: true };
    } catch {
      // 2. 后端不可用 → 降级模拟登录
    }

    // 演示账号
    const DEMO_USERS: Record<string, { password: string; name: string; roles: string[]; avatar: string; permissions: string[] }> = {
      admin: { password: 'admin123', name: '管理员', roles: ['ROLE_ADMIN'], avatar: '👨‍💼', permissions: ['*'] },
      zhangming: { password: 'zm2026', name: '张明', roles: ['ROLE_MANAGER'], avatar: '👤', permissions: ['pipeline:list', 'pipeline:create', 'pipeline:import', 'pipeline:batch-delete', 'pipeline:batch-modify', 'pipeline:edit', 'pipeline:delete'] },
    };

    const demoUser = DEMO_USERS[username];
    if (demoUser && demoUser.password === password) {
      const token = 'mock_' + Date.now();
      const user = { id: username, username, name: demoUser.name, avatar: demoUser.avatar, roles: demoUser.roles };
      const s = remember ? localStorage : sessionStorage;
      s.setItem('beike_token', token);
      localStorage.setItem('beike_user', JSON.stringify(user));
      if (remember) { localStorage.setItem('beike_remember', '1'); localStorage.setItem('beike_username', username); }
      set({ token, user, isLoggedIn: true, permissions: demoUser.permissions, menus: FALLBACK_MENUS });
      return { success: true };
    }

    // 检查 localStorage 注册用户
    const registered = JSON.parse(localStorage.getItem('beike_registered_users') || '[]');
    const regUser = registered.find((u: { username: string; password: string }) => u.username === username && u.password === password);
    if (regUser) {
      const token = 'mock_' + Date.now();
      const user = { id: username, username, name: regUser.realName || username, avatar: '👤', roles: ['ROLE_USER'] };
      const s = remember ? localStorage : sessionStorage;
      s.setItem('beike_token', token);
      localStorage.setItem('beike_user', JSON.stringify(user));
      if (remember) { localStorage.setItem('beike_remember', '1'); localStorage.setItem('beike_username', username); }
      set({ token, user, isLoggedIn: true, permissions: ['clue:list'], menus: FALLBACK_MENUS.filter(m => m.path === '/' || m.name === 'LTC 管线管理') });
      return { success: true };
    }

    return { success: false, msg: '用户名或密码错误' };
  },

  fetchUserInfo: async () => {
    try {
      const res = await request.get('/api/auth/userinfo');
      const data = res.data;
      const user = normalizeUser(data.user);
      localStorage.setItem('beike_user', JSON.stringify(user));
      set({ user, isLoggedIn: true, permissions: normalizePermissions(data), menus: data.menus || [] });
    } catch {
      get().logout();
    }
  },

  logout: () => {
    tokenStore.clear('beike_token');
    tokenStore.clear('beike_refresh_token');
    localStorage.removeItem('beike_user');
    localStorage.removeItem('beike_remember');
    localStorage.removeItem('beike_username');
    set({ user: null, token: null, isLoggedIn: false, permissions: [], menus: [] });
  },

  hasPermission: (code) => get().permissions.includes('*') || get().permissions.includes(code) || get().user?.roles?.includes('ROLE_ADMIN') || false,
  hasRole: (role) => get().user?.roles?.includes(role) || false,
}));

function normalizeUser(raw: any): UserInfo {
  return {
    id: String(raw?.id ?? raw?.username ?? ''),
    username: raw?.username ?? '',
    name: raw?.name ?? raw?.realName ?? raw?.username ?? '',
    avatar: raw?.avatar ?? '',
    roles: raw?.roles ?? [],
  };
}

function normalizePermissions(data: any): string[] {
  return data?.permissions ?? data?.user?.permissions ?? [];
}
