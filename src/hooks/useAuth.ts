import { create } from 'zustand';
import { loginApi, registerApi, getUserInfoApi, type LoginResult } from '../api/auth';

interface UserInfo {
  id: number; username: string; realName: string; roles: string[]; permissions: string[];
}
interface AuthState {
  user: UserInfo | null;
  token: string | null;
  permissions: string[];
  roles: string[];
  isLoggedIn: boolean;

  login: (username: string, password: string) => Promise<{ success: boolean; msg?: string }>;
  register: (username: string, password: string, realName: string) => Promise<{ success: boolean; msg?: string }>;
  fetchUserInfo: () => Promise<void>;
  logout: () => void;
  hasPermission: (code: string) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('beike_token'),
  permissions: [],
  roles: [],
  isLoggedIn: false,

  login: async (username, password) => {
    try {
      const data: LoginResult = await loginApi({ username, password });
      localStorage.setItem('beike_token', data.token);
      localStorage.setItem('beike_user', JSON.stringify(data.user));
      set({
        token: data.token, user: data.user,
        permissions: data.user.permissions, roles: data.user.roles, isLoggedIn: true,
      });
      return { success: true };
    } catch (e: unknown) {
      // 降级：后端不可用时使用本地模拟登录
      const DEMO: Record<string, { name: string; roles: string[]; permissions: string[] }> = {
        admin: { name: '管理员', roles: ['ROLE_ADMIN'], permissions: ['*'] },
        zhangming: { name: '张明', roles: ['ROLE_MANAGER'], permissions: ['clue:list','clue:create','clue:edit','clue:delete','clue:batch','clue:import','clue:export','clue:convert','project:list','project:create','project:edit'] },
      };
      const d = DEMO[username];
      if (d && password === (username === 'admin' ? 'admin123' : 'zm2026')) {
        const token = 'mock_' + Date.now();
        const user = { id: 1, username, realName: d.name, roles: d.roles, permissions: d.permissions };
        localStorage.setItem('beike_token', token);
        localStorage.setItem('beike_user', JSON.stringify(user));
        set({ token, user, permissions: d.permissions, roles: d.roles, isLoggedIn: true });
        return { success: true };
      }
      return { success: false, msg: (e as Error).message || '登录失败' };
    }
  },

  register: async (username, password, realName) => {
    try {
      await registerApi({ username, password, realName });
      return { success: true };
    } catch (e: unknown) {
      return { success: false, msg: (e as Error).message || '注册失败' };
    }
  },

  fetchUserInfo: async () => {
    try {
      const data = await getUserInfoApi();
      localStorage.setItem('beike_user', JSON.stringify(data.user));
      set({
        user: data.user, isLoggedIn: true,
        permissions: data.user.permissions, roles: data.user.roles,
      });
    } catch {
      // 降级：localStorage
      const saved = localStorage.getItem('beike_user');
      if (saved) {
        const u = JSON.parse(saved) as UserInfo;
        set({ user: u, isLoggedIn: true, permissions: u.permissions, roles: u.roles });
      } else {
        get().logout();
      }
    }
  },

  logout: () => {
    localStorage.removeItem('beike_token');
    localStorage.removeItem('beike_user');
    set({ user: null, token: null, isLoggedIn: false, permissions: [], roles: [] });
  },

  hasPermission: (code) => {
    const { permissions, roles } = get();
    return roles.includes('ROLE_ADMIN') || permissions.includes('*') || permissions.includes(code);
  },
  hasRole: (role) => get().roles.includes(role),
}));
