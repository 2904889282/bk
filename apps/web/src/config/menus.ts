/**
 * 统一菜单配置 — 所有用户看到相同菜单，无角色区分。
 */
export interface MenuItem {
  path?: string;
  name: string;
  icon?: string;
  permCode?: string;
  children?: MenuItem[];
}

/** 统一菜单（所有登录用户可见） */
export const UNIFIED_MENUS: MenuItem[] = [
  { path: '/', name: '工作台', icon: 'DashboardOutlined' },
  {
    name: '线索管理', icon: 'FundOutlined',
    children: [
      { path: '/ltc/kanban', name: '线索看板', icon: 'FundOutlined' },
      { path: '/ltc/leads', name: '线索列表', icon: 'UnorderedListOutlined' },
      { path: '/ltc/alerts', name: '预警中心', icon: 'AlertOutlined' },
      { path: '/ltc/analysis', name: '数据分析', icon: 'PieChartOutlined' },
    ],
  },
  {
    name: '系统管理', icon: 'SettingOutlined',
    children: [
      { path: '/admin/users', name: '用户管理', icon: 'UserOutlined', permCode: 'system:user:list' },
    ],
  },
];

// 向后兼容别名
export const FALLBACK_MENUS = UNIFIED_MENUS;
