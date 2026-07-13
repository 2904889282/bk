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
      { path: '/ltc/dashboard', name: '数据看板', icon: 'DashboardOutlined' },
      { path: '/ltc/kanban', name: '线索看板', icon: 'FundOutlined' },
      { path: '/ltc/leads', name: '线索列表', icon: 'UnorderedListOutlined' },
      { path: '/ltc/pipeline', name: '商机管道', icon: 'RiseOutlined' },
      { path: '/ltc/alerts', name: '预警中心', icon: 'AlertOutlined' },
      { path: '/ltc/analysis', name: '数据分析', icon: 'PieChartOutlined' },
    ],
  },
  {
    name: '项目管理', icon: 'ProjectOutlined',
    children: [
      { path: '/pm/dashboard', name: '数据看板', icon: 'DashboardOutlined' },
      { path: '/pm/board', name: '多视图看板', icon: 'ProjectOutlined' },
      { path: '/pm/projects', name: '项目列表', icon: 'UnorderedListOutlined' },
      { path: '/pm/kanban', name: '项目看板', icon: 'AppstoreOutlined' },
      { path: '/pm/goals', name: '关键目标', icon: 'AimOutlined' },
      { path: '/pm/revenue', name: '营收分析', icon: 'RiseOutlined' },
      { path: '/pm/team', name: '团队总览', icon: 'TeamOutlined' },
      { path: '/pm/staff', name: '人员分配', icon: 'UserSwitchOutlined' },
      { path: '/pm/gantt', name: '项目甘特图', icon: 'BarChartOutlined' },
    ],
  },
  {
    name: '系统管理', icon: 'SettingOutlined',
    children: [
      { path: '/admin/users', name: '用户管理', icon: 'UserOutlined' },
      { path: '/admin/depts', name: '部门管理', icon: 'ClusterOutlined' },
      { path: '/admin/positions', name: '职位管理', icon: 'IdcardOutlined' },
      { path: '/admin/recycle', name: '数据回收站', icon: 'DeleteOutlined' },
      { path: '/resources', name: '资源库', icon: 'FolderOpenOutlined' },
    ],
  },
];

// 向后兼容别名
export const FALLBACK_MENUS = UNIFIED_MENUS;
