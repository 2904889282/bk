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
  isLoggedIn: !!localStorage.getItem('beike_token'),

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
      get().logout();
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
