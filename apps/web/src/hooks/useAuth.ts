import { create } from 'zustand';
import request from '../utils/request';
import { FALLBACK_MENUS, REGULAR_USER_MENUS, type MenuItem } from '../config/menus';

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
  /** 是否处于演示模式（token 为 mock_xxx，后端不可用） */
  isMockMode: () => boolean;
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

      const isAdminOrManager = user.roles?.includes('ROLE_ADMIN') || user.roles?.includes('ROLE_MANAGER');
      set({ token: data.token, user, isLoggedIn: true, permissions, menus: data.menus?.length ? data.menus : (isAdminOrManager ? FALLBACK_MENUS : REGULAR_USER_MENUS) });
      return { success: true };
    } catch (err: unknown) {
      // 后端返回了明确的业务错误（如密码错误），直接反馈给用户
      const bizMsg = (err as { response?: { data?: { msg?: string; message?: string } } })?.response?.data?.msg
        || (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (bizMsg) return { success: false, msg: bizMsg };
      // 网络错误或后端不可用 → 降级到演示模式
    }

    // 后端不可用 → 降级模拟登录（仅当 VITE_ENABLE_DEMO 环境变量显式启用时才生效）
    // 生产构建默认不包含演示模式逻辑
    const isDemoEnabled = import.meta.env.VITE_ENABLE_DEMO === 'true';

    if (isDemoEnabled) {
      const DEMO_USERS: Record<string, { password: string; name: string; roles: string[]; avatar: string; permissions: string[] }> = {
        admin: { password: 'admin', name: '管理员', roles: ['ROLE_ADMIN'], avatar: '👨‍💼', permissions: ['clue:list', 'project:list', 'system:user:list'] },
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
    }

    return { success: false, msg: '后端服务不可用，请联系管理员' };
  },

  fetchUserInfo: async () => {
    try {
      const res = await request.get('/api/auth/userinfo');
      const data = res.data;
      const user = normalizeUser(data.user);
      localStorage.setItem('beike_user', JSON.stringify(user));
      const permissions = normalizePermissions(data);
      // 根据角色选择菜单
      const menus = user.roles?.includes('ROLE_ADMIN') || user.roles?.includes('ROLE_MANAGER')
        ? (data.menus || FALLBACK_MENUS)
        : REGULAR_USER_MENUS;
      set({ user, isLoggedIn: true, permissions, menus });
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

  isMockMode: () => {
    const t = get().token;
    return !!(t && t.startsWith('mock_'));
  },
  hasPermission: (code) => {
    const perms = get().permissions || [];
    return perms.includes(code);
  },
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


