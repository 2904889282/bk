const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat, TableOfContents } = require('docx');

const PAGE_W = 12240, MARGIN = 1440, CONTENT_W = PAGE_W - 2 * MARGIN;
const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

const colors = { primary: '2563EB', dark: '0F172A', light: 'F1F5F9', accent: 'EFF6FF' };

function heading(level, text) { return new Paragraph({ heading: level, children: [new TextRun(text)] }); }
function para(text, opts = {}) { return new Paragraph({ spacing: { after: 120 }, ...opts, children: [new TextRun({ text, size: 22, ...opts })] }); }
function boldPara(text) { return new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text, bold: true, size: 22 })] }); }

function infoRow(label, value) {
  return new TableRow({ children: [
    new TableCell({ borders, width: { size: 2800, type: WidthType.DXA }, margins: cellMargins, shading: { fill: colors.light, type: ShadingType.CLEAR },
      children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20 })] })] }),
    new TableCell({ borders, width: { size: 6560, type: WidthType.DXA }, margins: cellMargins,
      children: [new Paragraph({ children: [new TextRun({ text: value, size: 20 })] })] }),
  ]});
}

function featureCard(name, desc, features) {
  const header = new TableRow({ children: [
    new TableCell({ borders, width: { size: CONTENT_W, type: WidthType.DXA }, margins: cellMargins, shading: { fill: colors.accent, type: ShadingType.CLEAR },
      children: [
        new Paragraph({ children: [new TextRun({ text: name, bold: true, size: 24, color: colors.primary })] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: desc, size: 20, color: '475569' })] }),
      ] }),
  ]});
  const rows = features.map(f => new TableRow({ children: [
    new TableCell({ borders: { bottom: border }, width: { size: 1200, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 60 }, shading: { fill: 'FAFBFC', type: ShadingType.CLEAR },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '✓', bold: true, size: 20, color: colors.primary })] })] }),
    new TableCell({ borders: { bottom: border }, width: { size: 8160, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 60, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: f, size: 20 })] })] }),
  ]}));
  return [header, ...rows];
}

function simpleTable(headers, rows) {
  const colW = Math.floor(CONTENT_W / headers.length);
  const headerRow = new TableRow({ children: headers.map(h =>
    new TableCell({ borders, width: { size: colW, type: WidthType.DXA }, margins: cellMargins, shading: { fill: colors.dark, type: ShadingType.CLEAR },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: 'FFFFFF' })] })] })
  )});
  const dataRows = rows.map(row => new TableRow({ children: row.map(cell =>
    new TableCell({ borders, width: { size: colW, type: WidthType.DXA }, margins: cellMargins,
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })] })
  )}));
  return [headerRow, ...dataRows];
}

function section(title, tableFn) {
  return [
    heading(HeadingLevel.HEADING_2, title),
    new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: tableFn().colWidths || [CONTENT_W],
      rows: tableFn().rows || tableFn() }),
    new Paragraph({ spacing: { after: 200 }, children: [] }),
  ];
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: colors.dark },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: colors.primary },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: '334155' },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [
    // ===== COVER PAGE =====
    {
      properties: {
        page: { size: { width: PAGE_W, height: 15840 }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } },
      },
      children: [
        new Paragraph({ spacing: { before: 3000 }, children: [] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
          new TextRun({ text: '贝壳统一管理平台', bold: true, size: 56, color: colors.primary }),
        ] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
          new TextRun({ text: 'v5.0', size: 36, color: '64748B' }),
        ] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
          new TextRun({ text: 'LTC 线索管理 · 项目一体化管理 · 数据驱动决策', size: 24, color: '475569' }),
        ] }),
        new Paragraph({ spacing: { before: 600 }, border: { top: { style: BorderStyle.SINGLE, size: 6, color: colors.primary, space: 8 } }, children: [] }),
        new Paragraph({ spacing: { before: 200 }, children: [] }),
        new Table({ width: { size: 5600, type: WidthType.DXA }, columnWidths: [2800, 2800],
          rows: [
            infoRow('产品版本', 'v5.0'),
            infoRow('文档版本', 'v1.0'),
            infoRow('编制日期', '2026年7月3日'),
            infoRow('技术架构', 'React 19 + Spring Boot 3.3'),
          ] }),
        new Paragraph({ spacing: { before: 1600 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: '贝 壳 科 技', size: 28, color: '94A3B8' }),
        ] }),
      ],
    },

    // ===== TOC =====
    {
      properties: {
        page: { size: { width: PAGE_W, height: 15840 }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } },
      },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0', space: 4 } }, children: [new TextRun({ text: '贝壳统一管理平台  |  产品文档 v1.0', size: 16, color: '94A3B8' })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0', space: 4 } }, children: [new TextRun({ text: 'Page ', size: 16, color: '94A3B8' }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '94A3B8' })] })] }) },
      children: [
        heading(HeadingLevel.HEADING_1, '目录'),
        new TableOfContents('目录', { hyperlink: true, headingStyleRange: '1-3' }),
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 1. 产品概述 =====
        heading(HeadingLevel.HEADING_1, '1. 产品概述'),
        para('贝壳统一管理平台（以下简称"本系统"）是一套面向企业级客户的全流程业务管理系统，覆盖从线索获取、线索追踪、项目交付到数据洞察的完整业务链路。系统采用前后端分离架构，支持暗色模式、动态权限路由、演示数据降级等多种高级特性。'),
        para('本系统旨在帮助企业实现销售线索的透明化管理、项目执行的高效协同、以及业务数据的实时洞察，从而提升决策效率与经营质量。'),

        boldPara('核心价值'),
        ...featureCard('全流程覆盖', '从线索到交付的一体化管 理', [
          '线索创建、分发、跟进全流程管 理',
          '线索阶段可视化追踪与预警',
          '项目全生命周期管理 与风险评估',
          '人才资源池管理与 调度',
        ]),
        new Paragraph({ spacing: { after: 200 }, children: [] }),
        ...featureCard('智能化决策', '数据驱动的业务洞察', [
          'Dashboard 实时 KPI 仪表盘',
          'ECharts 趋势图、漏斗图、饼图',
          '预警自动生成与分级管 理',
          '操作日志全量追溯',
        ]),
        new Paragraph({ spacing: { after: 200 }, children: [] }),
        ...featureCard('企业级体验', '安全可靠的专业后台', [
          'JWT 双 Token 无感刷新认证',
          '动态权限路由 + 菜单权限过滤',
          '暗色模式 + CSS 变量设计 Token',
          '后端离线自动演示数据降级',
        ]),

        new Paragraph({ children: [new PageBreak()] }),

        // ===== 2. 系统架构 =====
        heading(HeadingLevel.HEADING_1, '2. 系统架构'),
        boldPara('技术栈'),
        new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [2400, 3400, 3560],
          rows: simpleTable(['层级', '技术选型', '版本'], [
            ['前端', 'React + TypeScript', '19'],
            ['UI 组件', 'Ant Design + ProComponents', '6.x'],
            ['状态管理', 'Zustand', '5.x'],
            ['图表', 'ECharts (echarts-for-react)', '5.x'],
            ['构建工具', 'Vite', '8.x'],
            ['后端框架', 'Spring Boot', '3.3'],
            ['ORM', 'MyBatis-Plus', '3.5'],
            ['数据库', 'MySQL', '8.0'],
            ['认证', 'JWT + Refresh Token', '0.12'],
          ]) }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        boldPara('目录结构'),
        new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [3600, 5760],
          rows: [
            new TableRow({ children: [
              new TableCell({ borders, width: { size: 3600, type: WidthType.DXA }, margins: cellMargins, shading: { fill: colors.dark, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: '目录', bold: true, size: 20, color: 'FFFFFF' })] })] }),
              new TableCell({ borders, width: { size: 5760, type: WidthType.DXA }, margins: cellMargins, shading: { fill: colors.dark, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: '说明', bold: true, size: 20, color: 'FFFFFF' })] })] }),
            ] }),
            ...[
              ['src/pages/', '页面组件（登录、Portal、LTC、PM、Admin）'],
              ['src/layouts/', '布局组件（BasicLayout）'],
              ['src/hooks/', '自定义 Hook（useAuth、useTable、useDashboard）'],
              ['src/store/', 'Zustand 状态（useAuth、useTheme）'],
              ['src/api/', 'API 调用层（clue、pipeline、project 等）'],
              ['src/utils/', '工具函数（request、demoData、menuIcon）'],
              ['src/components/', '通用组件（PermissionGuard、NotificationBell）'],
              ['backend-monolith/', 'Spring Boot 单体后端'],
              ['docs/', '文档（SQL 脚本、规范文档）'],
            ].map(([dir, desc]) => new TableRow({ children: [
              new TableCell({ borders, width: { size: 3600, type: WidthType.DXA }, margins: cellMargins,
                children: [new Paragraph({ children: [new TextRun({ text: dir, size: 20, font: 'Consolas' })] })] }),
              new TableCell({ borders, width: { size: 5760, type: WidthType.DXA }, margins: cellMargins,
                children: [new Paragraph({ children: [new TextRun({ text: desc, size: 20 })] })] }),
            ]})),
          ] }),

        new Paragraph({ children: [new PageBreak()] }),

        // ===== 3. 功能模块 =====
        heading(HeadingLevel.HEADING_1, '3. 功能模块'),

        heading(HeadingLevel.HEADING_2, '3.1 登录与认证'),
        para('系统支持两种登录方式：账号密码登录和邮箱验证码登录。具备双 Token 无感刷新机制（Access Token + Refresh Token），支持30天"保持登录"模式。'),
        para('暗色模式切换按钮位于登录页右上角，主题偏好持久化到 localStorage。登录成功后触发 800ms 退场动画（左侧滑出 + 右侧缩放淡出）。'),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '账号密码登录：校验用户名和密码，支持记住密码和自动登录', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '邮箱验证码登录：发送 6 位验证码到注册邮箱，60 秒倒计时', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '忘记密码：三步流程（验证邮箱 → 重置密码 → 完成）', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '注册：仅需用户名、邮箱、密码，带密码强度指示器', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '权限认证：JWT Token 校验 + 动态权限码过滤', size: 22 })] }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        heading(HeadingLevel.HEADING_2, '3.2 工作台 Dashboard'),
        para('工作台是系统的首页仪表盘，提供全局数据概览和快捷操作入口。数据采用聚合请求模式（Promise.allSettled），后端离线时自动降级为演示数据。'),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: 'KPI 卡片：线索总数、活跃项目、待处理预警、人才池，支持今日新增标记', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '补充指标：本月成交数、本月成交额、预警分布', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '趋势图：30 天线索/项目/转化折柱混合图（ECharts）', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '线索漏斗图：阶段分布可视化', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '数据饼图：线索/项目/人才/预警占比', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '最近动态：操作日志 Timeline', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '快捷入口：6 宫格快捷操作 + 线索快速录入 Modal', size: 22 })] }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        heading(HeadingLevel.HEADING_2, '3.3 LTC 线索管理'),
        para('LTC（Lead to Cash）线索管理模块覆盖从线索获取到成交转化的完整流程。'),
        heading(HeadingLevel.HEADING_3, '线索管理'),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '线索列表：支持搜索、状态筛选、批量删除', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '线索详情：编辑模式（Inline Form）、删除操作', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '线索看板：状态分布饼图 + 最近创建列表', size: 22 })] }),
        heading(HeadingLevel.HEADING_3, '线索管理'),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '线索列表：多条件筛选（产品/行业/阶段）、搜索', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '线索看板：阶段卡片拖拽式视图 + 进度条', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '导入导出：Excel 模板下载/上传、错误明细下载', size: 22 })] }),
        heading(HeadingLevel.HEADING_3, '预警中心'),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '预警列表：分级管理（高/中/低）、处理状态跟踪', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '预警处理：标记已处理、批量操作', size: 22 })] }),
        heading(HeadingLevel.HEADING_3, '数据分析'),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '数据看板：柱状图、饼图、趋势分析', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '统计卡片：关键指标一目了然', size: 22 })] }),

        new Paragraph({ children: [new PageBreak()] }),

        heading(HeadingLevel.HEADING_2, '3.4 项目管理'),
        para('项目管理模块覆盖项目从启动到交付的全生命周期。'),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '项目看板：阶段卡片视图 + 进度可视化', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '项目列表：搜索、状态筛选、批量删除、新建/编辑', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '风险管理：风险登记、等级评估、处理跟踪', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '人才池：人员信息管理、技能标签、状态监控', size: 22 })] }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        heading(HeadingLevel.HEADING_2, '3.5 系统管理'),
        para('仅管理员可访问的系统管理模块。'),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '用户管理：用户列表、新增/编辑、状态启用/禁用', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '数据回收站：软删除数据恢复与物理删除', size: 22 })] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: '设备管理：登录设备监控、远程踢下线', size: 22 })] }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // ===== 4. 设计系统 =====
        heading(HeadingLevel.HEADING_1, '4. 设计系统'),

        boldPara('设计 Token'),
        new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [2200, 7160],
          rows: [
            new TableRow({ children: [
              new TableCell({ borders, width: { size: 2200, type: WidthType.DXA }, margins: cellMargins, shading: { fill: colors.dark, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: 'Token 类别', bold: true, size: 20, color: 'FFFFFF' })] })] }),
              new TableCell({ borders, width: { size: 7160, type: WidthType.DXA }, margins: cellMargins, shading: { fill: colors.dark, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: '设计值', bold: true, size: 20, color: 'FFFFFF' })] })] }),
            ] }),
            ...[
              ['品牌色', '#2563EB (slate-blue)，辅色：#3B82F6 / #1D4ED8'],
              ['表面', '#FFFFFF (亮) / #0F172A (暗)，Raised：#F8FAFC / #1E293B'],
              ['文字', 'Primary #0F172A，Secondary #475569，Tertiary #94A3B8'],
              ['间距', '4px / 8px / 12px / 16px / 24px / 32px / 48px'],
              ['圆角', 'SM 6px / MD 8px / LG 12px / XL 16px'],
              ['阴影', 'Tinted shadows (hue-matched)，4 个层级 (xs-xl)'],
              ['字体', '系统字体栈 (PingFang SC / Microsoft YaHei)'],
              ['字阶', '12px - 30px (5 个层级)，行高 16px - 36px'],
              ['动效', 'cubic-bezier(0.16, 1, 0.3, 1)，150ms-400ms'],
            ].map(([name, val]) => new TableRow({ children: [
              new TableCell({ borders, width: { size: 2200, type: WidthType.DXA }, margins: cellMargins,
                children: [new Paragraph({ children: [new TextRun({ text: name, size: 20, bold: true })] })] }),
              new TableCell({ borders, width: { size: 7160, type: WidthType.DXA }, margins: cellMargins,
                children: [new Paragraph({ children: [new TextRun({ text: val, size: 20 })] })] }),
            ]})),
          ] }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        boldPara('暗色模式'),
        para('通过 CSS 变量 (html.dark) 实现完整的双主题映射。点击右上角切换按钮，所有 Ant Design 组件通过 ConfigProvider 自动适配暗色算法，品牌色、间距、阴影等设计 Token 同步切换。'),

        new Paragraph({ children: [new PageBreak()] }),

        // ===== 5. 权限体系 =====
        heading(HeadingLevel.HEADING_1, '5. 权限体系'),
        para('系统采用 RBAC（基于角色的访问控制）模型，通过权限码实现菜单和路由的双层过滤。'),
        new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [1800, 2000, 1800, 3760],
          rows: simpleTable(['角色', '用户名', '密码', '权限范围'], [
            ['管理员', 'admin', 'admin123', '全部功能 (*)'],
            ['经理', 'zhangming', 'zm2026', '线索管理：pipeline:create, edit, delete, import, batch'],
            ['普通用户', '注册用户', '自定义', '基础权限：clue:list, pipeline:create'],
          ]) }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        para('权限码示例：pipeline:create（线索新建）、alert:list（预警查看）、project:list（项目查看）、risk:list（风险查看）、talent:list（人才查看）、system:user:list（用户管理）、clue:list（线索查看）。管理员（ROLE_ADMIN 角色）拥有所有权限，不受权限码限制。'),

        // ===== 6. 部署说明 =====
        heading(HeadingLevel.HEADING_1, '6. 部署说明'),

        heading(HeadingLevel.HEADING_2, '6.1 本地开发'),
        para('环境要求：Node.js 20+ / JDK 17+ / MySQL 8.0 / Maven 3.9'),
        boldPara('前端启动'),
        new Paragraph({ children: [new TextRun({ text: 'cd 项目目录\npnpm install\npnpm dev\n// 访问 http://localhost:5173', size: 20, font: 'Consolas' })] }),
        new Paragraph({ spacing: { after: 120 }, children: [] }),
        boldPara('后端启动'),
        new Paragraph({ children: [new TextRun({ text: 'cd backend-monolith\nmvn spring-boot:run\n// 服务端口 8080', size: 20, font: 'Consolas' })] }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        heading(HeadingLevel.HEADING_2, '6.2 CloudStudio 沙箱'),
        para('项目已部署至 CloudStudio 沙箱环境，可直接预览：'),
        new Paragraph({ children: [new TextRun({ text: 'http://f25ac8741af34c369d98dc98aa06bfb4.codebuddy.cloudstudio.run', size: 20, color: colors.primary })] }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),
        para('演示账号：admin / admin123（管理员）、zhangming / zm2026（经理）'),

        // ===== 7. 变更记录 =====
        heading(HeadingLevel.HEADING_1, '7. 变更记录'),
        new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [1200, 1400, 2600, 4160],
          rows: simpleTable(['版本', '日期', '变更内容', '负责人'], [
            ['v5.0', '2026-07-03', '设计 Token 体系重构、动态权限路由、演示数据降级', '开发团队'],
            ['v4.1', '2026-06-30', '登录体系全链路闭环、Dashboard 首页、antd v6 兼容', '开发团队'],
            ['v4.0', '2026-06-20', 'LTC 线索管理 + 项目管理核心模块', '开发团队'],
            ['v3.0', '2026-06-10', '后端 Spring Boot 单体架构、39 个 API 接口', '开发团队'],
            ['v1.0', '2026-05-15', '项目初始化、技术选型、数据库设计', '开发团队'],
          ]) }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('c:/Users/EDY/CodeBuddy/20260630145325/docs/产品文档-贝壳统一管理平台-v5.0.docx', buf);
  console.log('Done: 产品文档-贝壳统一管理平台-v5.0.docx');
});
