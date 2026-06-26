import { create } from 'zustand';
import type { Pipeline, Project, Risk, Talent, Alert, User, AppSettings } from '../types';
import { loadAppData, saveAppData } from '../utils/storage';
import { getDefaultData } from './defaultData';

interface DataStore {
  // Data
  pipelines: Pipeline[];
  projects: Project[];
  risks: Risk[];
  talent: Talent[];
  alerts: Alert[];
  settings: AppSettings;
  
  // Auth
  user: User | null;
  isLoggedIn: boolean;
  
  // Stats
  stats: {
    activePipelines: number;
    totalAmount: number;
    weightedAmount: number;
    projectsTotal: number;
    talentTotal: number;
    openAlerts: number;
    openRisks: number;
  };
  
  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  save: () => void;
  
  // Pipeline CRUD
  addPipeline: (p: Omit<Pipeline, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePipeline: (id: string, p: Partial<Pipeline>) => void;
  deletePipeline: (id: string) => void;
  
  // Project CRUD
  addProject: (p: Omit<Project, 'id'>) => void;
  updateProject: (id: string, p: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  // Risk CRUD
  addRisk: (r: Omit<Risk, 'id' | 'createdAt' | 'status'>) => void;
  resolveRisk: (id: string) => void;
  
  // Talent
  addTalent: (t: Omit<Talent, 'id'>) => void;
  
  // Alert
  resolveAlert: (id: string) => void;
  
  // Settings
  setSettings: (s: Partial<AppSettings>) => void;
  
  // Helpers
  genId: (prefix: string) => string;
  recomputeStats: () => void;
}

function computeStats(state: Pick<DataStore, 'pipelines' | 'projects' | 'talent' | 'alerts' | 'risks'>) {
  const active = state.pipelines.filter(p => !['closed'].includes(p.stage)).length;
  const totalAmount = state.pipelines
    .filter(p => !['lead', 'verify', 'closed'].includes(p.stage))
    .reduce((s, p) => s + (p.amount || 0), 0);
  const weighted = state.pipelines
    .filter(p => ['opportunity', 'contract', 'delivery'].includes(p.stage))
    .reduce((s, p) => s + Math.round((p.amount || 0) * (p.winRate || 0) / 100), 0);
  return {
    activePipelines: active,
    totalAmount,
    weightedAmount: weighted,
    projectsTotal: state.projects.length,
    talentTotal: state.talent.length,
    openAlerts: state.alerts.filter(a => a.status === 'open').length,
    openRisks: state.risks.filter(r => r.status === 'open').length,
  };
}

export const useDataStore = create<DataStore>((set, get) => {
  const raw = loadAppData(getDefaultData());
  const savedUser = (() => {
    const u = localStorage.getItem('beike_user');
    return u ? JSON.parse(u) : null;
  })();
  
  const initState = {
    ...raw,
    user: savedUser,
    isLoggedIn: !!savedUser,
    stats: computeStats({ pipelines: raw.pipelines, projects: raw.projects, talent: raw.talent, alerts: raw.alerts, risks: raw.risks }),
  };

  return {
    ...initState,
    
    login: async (username, password) => {
      const users: Record<string, User> = {
        admin: { name: '管理员', role: 'admin', avatar: '👨‍💼', password: 'admin123' },
        zhangming: { name: '张明', role: 'manager', avatar: '👤', password: 'zm2026' },
      };
      await new Promise(r => setTimeout(r, 300));
      const u = users[username];
      if (!u || u.password !== password) return false;
      set({ user: u, isLoggedIn: true });
      localStorage.setItem('beike_user', JSON.stringify(u));
      return true;
    },
    
    logout: () => {
      localStorage.removeItem('beike_user');
      set({ user: null, isLoggedIn: false });
    },
    
    save: () => {
      const { pipelines, projects, risks, talent, alerts, settings } = get();
      saveAppData({ pipelines, projects, risks, talent, alerts, settings });
    },

    addPipeline: (p) => {
      const id = get().genId('P');
      const now = new Date().toISOString().slice(0, 10);
      const newP: Pipeline = { ...p, id, createdAt: now, updatedAt: now };
      set(s => {
        const pipelines = [...s.pipelines, newP];
        return { pipelines, stats: computeStats({ ...s, pipelines }) };
      });
      get().save();
    },

    updatePipeline: (id, p) => {
      set(s => {
        const pipelines = s.pipelines.map(x => x.id === id ? { ...x, ...p, updatedAt: new Date().toISOString().slice(0, 10) } : x);
        return { pipelines, stats: computeStats({ ...s, pipelines }) };
      });
      get().save();
    },

    deletePipeline: (id) => {
      set(s => {
        const pipelines = s.pipelines.filter(x => x.id !== id);
        return { pipelines, stats: computeStats({ ...s, pipelines }) };
      });
      get().save();
    },

    addProject: (p) => {
      const id = get().genId('PR');
      set(s => {
        const projects = [...s.projects, { ...p, id }];
        return { projects, stats: computeStats({ ...s, projects }) };
      });
      get().save();
    },

    updateProject: (id, p) => {
      set(s => {
        const projects = s.projects.map(x => x.id === id ? { ...x, ...p } : x);
        return { projects, stats: computeStats({ ...s, projects }) };
      });
      get().save();
    },

    deleteProject: (id) => {
      set(s => {
        const projects = s.projects.filter(x => x.id !== id);
        return { projects, stats: computeStats({ ...s, projects }) };
      });
      get().save();
    },

    addRisk: (r) => {
      const id = get().genId('R');
      set(s => {
        const risks = [...s.risks, { ...r, id, status: 'open' as const, createdAt: new Date().toISOString().slice(0, 10) }];
        return { risks, stats: computeStats({ ...s, risks }) };
      });
      get().save();
    },

    resolveRisk: (id) => {
      set(s => {
        const risks = s.risks.map(r => r.id === id ? { ...r, status: 'resolved' as const } : r);
        return { risks, stats: computeStats({ ...s, risks }) };
      });
      get().save();
    },

    addTalent: (t) => {
      const id = get().genId('T');
      set(s => ({ talent: [...s.talent, { ...t, id }] }));
      get().save();
    },

    resolveAlert: (id) => {
      set(s => ({ alerts: s.alerts.map(a => a.id === id ? { ...a, status: 'resolved' as const } : a) }));
      get().save();
    },

    setSettings: (s) => {
      set(state => ({ settings: { ...state.settings, ...s } }));
      get().save();
    },

    genId: (prefix: string) => {
      const collections: Record<string, { id: string }[]> = {
        P: get().pipelines, PR: get().projects, R: get().risks, T: get().talent, A: get().alerts,
      };
      const items = collections[prefix] || [];
      const max = items.reduce((m, item) => Math.max(m, parseInt(item.id.replace(/[A-Z]+/, '')) || 0), 0);
      return prefix + String(max + 1).padStart(3, '0');
    },

    recomputeStats: () => {
      const s = get();
      set({ stats: computeStats(s) });
    },
  };
});
