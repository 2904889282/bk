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
    name: 'LTC 管线管理', icon: 'FundOutlined',
    children: [
      { path: '/ltc/kanban', name: '管线看板', icon: 'FundOutlined', permCode: 'pipeline:list' },
      { path: '/ltc/pipeline', name: '管线列表', icon: 'UnorderedListOutlined', permCode: 'pipeline:list' },
      { path: '/ltc/alerts', name: '预警中心', icon: 'AlertOutlined', permCode: 'alert:list' },
      { path: '/ltc/analysis', name: '数据分析', icon: 'PieChartOutlined', permCode: 'pipeline:list' },
      { path: '/ltc/leads', name: '线索管理', icon: 'AlertOutlined', permCode: 'clue:list' },
    ],
  },
  {
    name: '项目管理', icon: 'ProjectOutlined',
    children: [
      { path: '/pm/kanban', name: '项目看板', icon: 'ProjectOutlined', permCode: 'project:list' },
      { path: '/pm/projects', name: '项目列表', icon: 'UnorderedListOutlined', permCode: 'project:list' },
      { path: '/pm/risks', name: '风险管理', icon: 'SafetyOutlined', permCode: 'risk:list' },
      { path: '/pm/talent', name: '人才池', icon: 'TeamOutlined', permCode: 'talent:list' },
      { path: '/pm/gantt', name: '项目甘特图', icon: 'BarChartOutlined', permCode: 'project:list' },
    ],
  },
  {
    name: '系统管理', icon: 'SettingOutlined',
    children: [
      { path: '/admin/users', name: '用户管理', icon: 'UserOutlined', permCode: 'system:user:list' },
      { path: '/admin/recycle', name: '数据回收站', icon: 'DeleteOutlined', permCode: 'recycle:list' },
      { path: '/resources', name: '资源库', icon: 'FolderOpenOutlined' },
    ],
  },
];
