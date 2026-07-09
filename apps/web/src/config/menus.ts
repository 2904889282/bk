/**
 * 全局菜单配置 — BasicLayout、useAuth 等都从这里 import，避免维护多份。
 */
export interface MenuItem {
  path?: string;
  name: string;
  icon?: string;
  permCode?: string;
  children?: MenuItem[];
}

export const FALLBACK_MENUS: MenuItem[] = [
  { path: '/', name: '工作台', icon: 'DashboardOutlined' },
  {
    name: '线索管理', icon: 'FundOutlined',
    children: [
      { path: '/ltc/leads', name: '线索列表', icon: 'UnorderedListOutlined', permCode: 'clue:list' },
      { path: '/ltc/kanban', name: '线索看板', icon: 'FundOutlined', permCode: 'pipeline:list' },
      { path: '/ltc/pipeline', name: '商机管道', icon: 'RiseOutlined', permCode: 'pipeline:list' },
      { path: '/ltc/alerts', name: '预警中心', icon: 'AlertOutlined', permCode: 'alert:list' },
      { path: '/ltc/analysis', name: '数据分析', icon: 'PieChartOutlined', permCode: 'pipeline:list' },
    ],
  },
  {
    name: '项目管理', icon: 'ProjectOutlined',
    children: [
      { path: '/pm/projects', name: '项目列表', icon: 'UnorderedListOutlined', permCode: 'project:list' },
      { path: '/pm/kanban', name: '项目看板', icon: 'ProjectOutlined', permCode: 'project:list' },
      { path: '/pm/gantt', name: '项目甘特图', icon: 'BarChartOutlined', permCode: 'project:list' },
    ],
  },
  {
    name: '系统管理', icon: 'SettingOutlined',
    children: [
      { path: '/admin/users', name: '用户管理', icon: 'UserOutlined', permCode: 'system:user:list' },
      { path: '/admin/depts', name: '部门管理', icon: 'ClusterOutlined', permCode: 'system:user:list' },
      { path: '/admin/positions', name: '职位管理', icon: 'IdcardOutlined', permCode: 'system:user:list' },
      { path: '/admin/recycle', name: '数据回收站', icon: 'DeleteOutlined', permCode: 'recycle:list' },
      { path: '/resources', name: '资源库', icon: 'FolderOpenOutlined' },
    ],
  },
];

/** 普通用户菜单：无系统管理、无风险管理、无人才池 */
export const REGULAR_USER_MENUS: MenuItem[] = [
  { path: '/', name: '工作台', icon: 'DashboardOutlined' },
  {
    name: '线索管理', icon: 'FundOutlined',
    children: [
      { path: '/ltc/leads', name: '线索列表', icon: 'UnorderedListOutlined', permCode: 'clue:list' },
    ],
  },
  {
    name: '项目管理', icon: 'ProjectOutlined',
    children: [
      { path: '/pm/projects', name: '项目列表', icon: 'UnorderedListOutlined', permCode: 'project:list' },
    ],
  },
  { path: '/account/devices', name: '设备管理', icon: 'DesktopOutlined' },
];
