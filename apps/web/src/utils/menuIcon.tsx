/**
 * 菜单图标映射 — 将后端返回的 icon 字符串映射为 React 组件
 * 后端 menus[].icon 字段值如 "DashboardOutlined", "FundOutlined"
 */

import {
  DashboardOutlined,
  FundOutlined,
  AlertOutlined,
  PieChartOutlined,
  ProjectOutlined,
  SafetyOutlined,
  TeamOutlined,
  SettingOutlined,
  UserOutlined,
  DeleteOutlined,
  UnorderedListOutlined,
  DesktopOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  LineChartOutlined,
  TableOutlined,
  FileTextOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import type { ComponentType } from 'react';

const iconMap: Record<string, ComponentType<{ style?: React.CSSProperties }>> = {
  DashboardOutlined,
  FundOutlined,
  AlertOutlined,
  PieChartOutlined,
  ProjectOutlined,
  SafetyOutlined,
  TeamOutlined,
  SettingOutlined,
  UserOutlined,
  DeleteOutlined,
  UnorderedListOutlined,
  DesktopOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  LineChartOutlined,
  TableOutlined,
  FileTextOutlined,
  FolderOutlined,
};

/** 将后端返回的菜单项中的 icon 字符串转为 React 元素 */
export function resolveMenuIcon(iconName?: string): React.ReactNode {
  if (!iconName) return <AppstoreOutlined />;
  const Component = iconMap[iconName];
  return Component ? <Component /> : <AppstoreOutlined />;
}
