import { create } from 'zustand';
import request from '../utils/request';

interface UserInfo { id: string; username: string; name: string; avatar: string; roles: string[]; }
interface AuthState {
  user: UserInfo | null;
  token: string | null;
  permissions: string[];
  menus: { path: string; name: string; icon: string; component?: string }[];
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; msg?: string }>;
  fetchUserInfo: () => Promise<void>;
  logout: () => void;
  hasPermission: (code: string) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('beike_token'),
  permissions: [],
  menus: [],
  isLoggedIn: false,

  login: async (username, password) => {
    // 1. 尝试后端登录
    try {
      const res = await request.post('/api/auth/login', { username, password });
      const data = res.data;
      localStorage.setItem('beike_token', data.token);
      localStorage.setItem('beike_user', JSON.stringify(data.user));
      set({ token: data.token, user: data.user, isLoggedIn: true, permissions: data.permissions || [], menus: data.menus || [] });
      return { success: true };
    } catch {
      // 2. 后端不可用 → 降级模拟登录
    }

    // 演示账号
    const DEMO_USERS: Record<string, { password: string; name: string; roles: string[]; avatar: string; permissions: string[] }> = {
      admin: { password: 'admin123', name: '管理员', roles: ['ROLE_ADMIN'], avatar: '👨‍💼', permissions: ['*'] },
      zhangming: { password: 'zm2026', name: '张明', roles: ['ROLE_MANAGER'], avatar: '👤', permissions: ['pipeline:create', 'pipeline:import', 'pipeline:batch-delete', 'pipeline:batch-modify', 'pipeline:edit', 'pipeline:delete'] },
    };

    // 检查演示账号
    const demoUser = DEMO_USERS[username];
    if (demoUser && demoUser.password === password) {
      const token = 'mock_' + Date.now();
      const user = { id: username, username, name: demoUser.name, avatar: demoUser.avatar, roles: demoUser.roles };
      localStorage.setItem('beike_token', token);
      localStorage.setItem('beike_user', JSON.stringify(user));
      set({ token, user, isLoggedIn: true, permissions: demoUser.permissions, menus: [] });
      return { success: true };
    }

    // 检查 localStorage 注册用户
    const registered = JSON.parse(localStorage.getItem('beike_registered_users') || '[]');
    const regUser = registered.find((u: { username: string; password: string }) => u.username === username && u.password === password);
    if (regUser) {
      const token = 'mock_' + Date.now();
      const user = { id: username, username, name: regUser.realName || username, avatar: '👤', roles: ['ROLE_USER'] };
      localStorage.setItem('beike_token', token);
      localStorage.setItem('beike_user', JSON.stringify(user));
      set({ token, user, isLoggedIn: true, permissions: [], menus: [] });
      return { success: true };
    }

    return { success: false, msg: '用户名或密码错误' };
  },

  fetchUserInfo: async () => {
    try {
      const res = await request.get('/api/auth/userinfo');
      const data = res.data;
      localStorage.setItem('beike_user', JSON.stringify(data.user));
      set({
        user: data.user, isLoggedIn: true,
        permissions: data.permissions || [], menus: data.menus || [],
      });
    } catch {
      get().logout();
    }
  },

  logout: () => {
    localStorage.removeItem('beike_token');
    localStorage.removeItem('beike_user');
    localStorage.removeItem('rm_user');
    localStorage.removeItem('rm_pass');
    set({ user: null, token: null, isLoggedIn: false, permissions: [], menus: [] });
  },

  hasPermission: (code) => get().permissions.includes(code) || get().user?.roles?.includes('ROLE_ADMIN') || false,
  hasRole: (role) => get().user?.roles?.includes(role) || false,
}));
