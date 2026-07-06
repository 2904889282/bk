import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Card, Form, Input, Select, DatePicker, Button, Row, Col, Table, Tag,
  Space, Tooltip, Popover, Checkbox, Typography, App, Drawer, Modal,
  Statistic, Dropdown,
  Progress,
  Segmented,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, PlusOutlined, DownloadOutlined,
  SettingOutlined, DownOutlined, UpOutlined, ExpandOutlined, CompressOutlined,
  EyeOutlined, UserSwitchOutlined, TagOutlined, FlagOutlined,
  AuditOutlined, AimOutlined, WarningOutlined,
} from '@ant-design/icons';
import {
  fetchCluePage, createClue, updateClue, deleteClue, batchDeleteClue,
  fetchCampaignDashboard, fetchCampaigns,
  batchAssignClues, batchUpdateLevel, batchMoveToCampaign,
  exportWeekReport,
} from '../../../../api/clue';
import type {
  ClueVO, ClueSaveDTO, CampaignDashboardVO, CampaignItem,
} from '../../../../api/clue';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Text, Link } = Typography;
const { RangePicker } = DatePicker;

// --- 业务常量 ---
const STATUS_OPTIONS = ['接触', '沟通', '提案', '承接', '延期', '丢失'];
const STATUS_COLORS: Record<string, string> = {
  '接触': 'blue', '沟通': 'orange', '提案': 'purple', '承接': 'green',
  '延期': 'warning', '丢失': 'default',
};
const LEVEL_OPTIONS = ['S', 'A', 'B', 'C'];
const LEVEL_COLORS: Record<string, string> = { S: '#ff4d4f', A: '#fa8c16', B: '#1677ff', C: '#8c8c8c' };
const HEALTH_OPTIONS = ['normal', 'yellow', 'red'];
const HEALTH_LABELS: Record<string, string> = { normal: '正常', yellow: '黄灯', red: '红灯' };
const HEALTH_COLORS: Record<string, string> = { normal: 'green', yellow: 'gold', red: 'red' };
const CIRCLE_OPTIONS = ['第一圈层', '第二圈层', '第三圈层', '第四圈层'];
const CIRCLE_COLORS: Record<string, string> = {
  '第一圈层': '#ff4d4f', '第二圈层': '#fa8c16', '第三圈层': '#1677ff', '第四圈层': '#8c8c8c',
};
const CIRCLE_LABELS: Record<string, string> = {
  '第一圈层': '传统大厂', '第二圈层': 'AI大厂', '第三圈层': '腰部中厂', '第四圈层': '大G',
};
const QUICK_FILTERS = [
  { key: 'mine', label: '我的待处理', values: { owner: '张明', status: '接触' } },
  { key: 'review', label: '本周上会清单', values: { status: '提案' } },
  { key: 'red', label: '红灯督办池', values: { healthStatus: 'red' } },
  { key: 'potential', label: '高潜商机', values: { clueLevel: 'S' } },
] as const;

export default function LeadsList() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [drawerForm] = Form.useForm();
  const tableRef = useRef<HTMLDivElement>(null);

  // 数据
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<ClueVO[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // 战役
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [activeCampaignId, setActiveCampaignId] = useState<number | null>(null);
  const [dashboard, setDashboard] = useState<CampaignDashboardVO | null>(null);

  // UI
  const [expandSearch, setExpandSearch] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('all');

  // 批量模态框
  const [batchAssignVisible, setBatchAssignVisible] = useState(false);
  const [batchLevelVisible, setBatchLevelVisible] = useState(false);
  const [batchCampaignVisible, setBatchCampaignVisible] = useState(false);
  const [batchForm] = Form.useForm();

  // 列设置
  const allColumns = useMemo(() => [
    { title: '线索编号', dataIndex: 'clueNumber', width: 150, fixed: 'left' as const },
    {
      title: '客户名称', dataIndex: 'clientCompany', width: 160,
      render: (_: string, r: ClueVO) => (
        <Space>
          <Link strong onClick={() => navigate(`/ltc/leads/${r.id}`)}>{r.clientCompany}</Link>
          {r.clientCircle && (
            <Tag color={CIRCLE_COLORS[r.clientCircle]} style={{ fontSize: 11 }}>
              {CIRCLE_LABELS[r.clientCircle] || r.clientCircle}
            </Tag>
          )}
        </Space>
      ),
    },
    { title: '需求概要', dataIndex: 'requirementDesc', width: 200, ellipsis: true,
      render: (v: string) => v ? <Text ellipsis style={{ maxWidth: 180 }}>{v}</Text> : '-' },
    { title: '所属战役', dataIndex: 'campaignId', width: 120,
      render: (v: number) => {
        const c = campaigns.find(c => c.id === v);
        return c ? <Tag color="purple">{c.name}</Tag> : '-';
      }},
    {
      title: '线索等级', dataIndex: 'clueLevel', width: 80,
      render: (v: string) => v ? <Tag color={LEVEL_COLORS[v]}>{v}级</Tag> : '-',
    },
    {
      title: '当前状态', dataIndex: 'clueStatus', width: 90,
      render: (v: string) => <Tag color={STATUS_COLORS[v] || 'default'}>{v}</Tag>,
    },
    { title: '责任人', dataIndex: 'beikeOwner', width: 100 },
    {
      title: '上次跟进', dataIndex: 'lastFollowTime', width: 110,
      render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : <Text type="secondary">未跟进</Text>,
    },
    {
      title: '健康度', dataIndex: 'healthStatus', width: 80,
      render: (v: string) => {
        if (!v) return '-';
        return (
          <Space size={4}>
            <Tag color={HEALTH_COLORS[v] || 'default'}>{HEALTH_LABELS[v] || v}</Tag>
          </Space>
        );
      },
    },
    { title: '预计商机金额', dataIndex: 'opportunityAmount', width: 130,
      render: (v: number) => v ? <Text strong>{v.toLocaleString()} 元</Text> : '-' },
    { title: '甲方部门', dataIndex: 'clientDept', width: 100 },
    { title: '甲方对接人', dataIndex: 'clientContact', width: 100 },
    { title: '来源', dataIndex: 'sourceType', width: 100,
      render: (v: string) => v ? <Tag>{v}</Tag> : '-' },
    {
      title: '操作', key: 'action', width: 160, fixed: 'right' as const,
      render: (_: unknown, r: ClueVO) => (
        <Space size="small">
          <Button size="small" type="link" icon={<EyeOutlined />}
            onClick={() => navigate(`/ltc/leads/${r.id}`)}>详情</Button>
          <Button size="small" type="link" onClick={() => handleEdit(r)}>编辑</Button>
          <Button size="small" type="link" danger onClick={() => handleDelete(r)}>删除</Button>
        </Space>
      ),
    },
  ], [campaigns]);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    () => JSON.parse(localStorage.getItem('leads_columns_v2') || 'null')
      || allColumns.map(c => c.dataIndex || c.key!)
  );

  // ========== 数据加载 ==========
  const loadData = async (page = pagination.current, size = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const params: any = { pageNum: page, pageSize: size };
      if (values.keyword) params.keyword = values.keyword;
      if (values.status) params.status = values.status;
      if (values.level) params.level = values.level;
      if (values.clueLevel) params.clueLevel = values.clueLevel;
      if (values.owner) params.owner = values.owner;
      if (values.clientCircle) params.clientCircle = values.clientCircle;
      if (values.campaignId) params.campaignId = values.campaignId;
      if (values.healthStatus) params.healthStatus = values.healthStatus;
      if (values.deptBelong) params.deptBelong = values.deptBelong;
      if (values.dateRange?.[0]) params.dateFrom = values.dateRange[0].format('YYYY-MM-DD');
      if (values.dateRange?.[1]) params.dateTo = values.dateRange[1].format('YYYY-MM-DD');

      const res = await fetchCluePage(params);
      setDataSource(res.records || []);
      setTotal(res.total || 0);
      setPagination({ current: page, pageSize: size });
    } catch {
      message.error('加载数据失败');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchCampaigns().then((list) => {
      setCampaigns(list || []);
      if (list?.length) {
        const active = list.find(c => c.status === 'ACTIVE');
        if (active) {
          setActiveCampaignId(active.id);
          fetchCampaignDashboard(active.id).then(setDashboard).catch(() => {});
        }
      }
    }).catch(() => {});
    loadData(1);
  }, []);

  const applyQuickFilter = (key: string) => {
    setActiveQuickFilter(key);
    if (key === 'all') {
      form.resetFields();
      loadData(1);
      return;
    }
    const item = QUICK_FILTERS.find(f => f.key === key);
    if (item) {
      form.setFieldsValue(item.values);
      loadData(1);
    }
  };

  const toggleReviewMode = () => {
    const next = !reviewMode;
    setReviewMode(next);
    if (next) {
      setActiveQuickFilter('review-mode');
      form.setFieldsValue({ status: undefined, healthStatus: undefined, clueLevel: undefined });
      fetchCluePage({ pageNum: 1, pageSize: pagination.pageSize })
        .then(res => {
          const records = (res.records || [])
            .filter(item => ['提案', '沟通'].includes(item.clueStatus) || ['yellow', 'red'].includes(item.healthStatus || '') || ['待评审', '评审中'].includes(item.reviewStatus || ''))
            .sort((a, b) => {
              const weight = (x: ClueVO) => (x.healthStatus === 'red' ? 0 : x.healthStatus === 'yellow' ? 1 : x.reviewStatus === '评审中' ? 2 : 3);
              return weight(a) - weight(b);
            });
          setDataSource(records);
          setTotal(records.length);
          setPagination({ current: 1, pageSize: pagination.pageSize });
        })
        .catch(() => message.error('评审清单加载失败'));
    } else {
      setActiveQuickFilter('all');
      loadData(1);
    }
  };

  // ========== 新建/编辑 ==========
  const openCreate = () => {
    setEditId(null);
    drawerForm.resetFields();
    drawerForm.setFieldsValue({ clueStatus: '接触', clueLevel: 'B', deptBelong: '销售一部' });
    setDrawerOpen(true);
  };

  const handleEdit = (r: ClueVO) => {
    setEditId(r.id);
    drawerForm.setFieldsValue({
      clueName: r.clueName,
      clientCompany: r.clientCompany,
      clientDept: r.clientDept,
      clientContact: r.clientContact,
      beikeOwner: r.beikeOwner,
      budget: r.budget,
      budgetAmount: r.budgetAmount,
      clueLevel: r.clueLevel,
      clueStatus: r.clueStatus,
      deptBelong: r.deptBelong,
      clientCircle: r.clientCircle,
      campaignId: r.campaignId,
      sourceType: r.sourceType,
      sourceActivityName: r.sourceActivityName,
      industry: r.industry,
      contactDate: r.contactDate,
      requirementDesc: r.requirementDesc,
      painPoint: r.painPoint,
      expectedTarget: r.expectedTarget,
      remark: r.remark,
    });
    setDrawerOpen(true);
  };

  const handleDrawerSubmit = async () => {
    try {
      const values = await drawerForm.validateFields();
      setDrawerLoading(true);
      const dto: ClueSaveDTO = {
        ...values,
        contactDate: values.contactDate,
      };
      if (editId) {
        await updateClue(editId, dto);
        message.success('线索已更新');
      } else {
        await createClue(dto);
        message.success('线索已创建');
      }
      setDrawerOpen(false);
      loadData(1);
      if (activeCampaignId) {
        fetchCampaignDashboard(activeCampaignId).then(setDashboard).catch(() => {});
      }
    } catch (err: unknown) {
      if ((err as { errorFields?: unknown })?.errorFields) return;
      message.error('操作失败');
    } finally { setDrawerLoading(false); }
  };

  // ========== 删除 ==========
  const handleDelete = (r: ClueVO) => {
    Modal.confirm({
      title: '确认删除',
      content: `删除后数据将进入回收站，确定删除线索「${r.clueName}」吗？`,
      okText: '删除',
      okButtonProps: { danger: true },
      onOk: async () => {
        try { await deleteClue(r.id); message.success('已移入回收站'); loadData(pagination.current); }
        catch { message.error('删除失败'); }
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) { message.warning('请先选择'); return; }
    Modal.confirm({
      title: `确认批量删除 ${selectedRowKeys.length} 项？`,
      okText: '批量删除',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await batchDeleteClue(selectedRowKeys.map(Number));
          message.success(`已删除 ${selectedRowKeys.length} 项`);
          setSelectedRowKeys([]);
          loadData(1);
        } catch { message.error('批量删除失败'); }
      },
    });
  };

  // ========== 批量操作 ==========
  const handleBatchAssign = async () => {
    try {
      const vals = await batchForm.validateFields();
      await batchAssignClues(selectedRowKeys.map(Number), vals.assignee);
      message.success(`已为 ${selectedRowKeys.length} 条线索分配责任人`);
      setBatchAssignVisible(false); setSelectedRowKeys([]); loadData(1);
    } catch (e: unknown) {
      if ((e as { errorFields?: unknown })?.errorFields) return;
      message.error('分配失败');
    }
  };

  const handleBatchLevel = async () => {
    try {
      const vals = await batchForm.validateFields();
      await batchUpdateLevel(selectedRowKeys.map(Number), vals.level);
      message.success(`已调整等级为: ${vals.level}`);
      setBatchLevelVisible(false); setSelectedRowKeys([]); loadData(1);
    } catch (e: unknown) {
      if ((e as { errorFields?: unknown })?.errorFields) return;
      message.error('调整失败');
    }
  };

  const handleBatchCampaign = async () => {
    try {
      const vals = await batchForm.validateFields();
      await batchMoveToCampaign(selectedRowKeys.map(Number), vals.campaignId);
      message.success(`已将 ${selectedRowKeys.length} 条线索划入战役`);
      setBatchCampaignVisible(false); setSelectedRowKeys([]); loadData(1);
    } catch (e: unknown) {
      if ((e as { errorFields?: unknown })?.errorFields) return;
      message.error('划入失败');
    }
  };

  const handleExport = async () => {
    if (selectedRowKeys.length === 0) { message.warning('请先勾选要导出的线索'); return; }
    try {
      const data = await exportWeekReport(selectedRowKeys.map(Number));
      message.success(`已导出 ${data.length} 条线索数据`);
    } catch { message.error('导出失败'); }
  };

  // ========== 列过滤 ==========
  const currentColumns = allColumns.filter(col =>
    visibleColumns.includes(col.dataIndex || col.key || '')
  );

  const handleColumnChange = (checkedValues: any[]) => {
    setVisibleColumns(checkedValues);
    localStorage.setItem('leads_columns_v2', JSON.stringify(checkedValues));
  };

  // ========== 全屏 ==========
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      tableRef.current?.requestFullscreen(); setIsFullscreen(true);
    } else {
      document.exitFullscreen(); setIsFullscreen(false);
    }
  };

  return (
    <div ref={tableRef} style={{ padding: 24, background: '#f5f5f5', minHeight: '100%' }}>
      {/* ===== 战役作战看板 ===== */}
      {dashboard && (
        <Card
          style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #e8e8e8' }}
          styles={{ body: { padding: '20px 24px' } }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Space>
              <div style={{
                width: 4, height: 20, background: 'linear-gradient(180deg, #1677ff, #69b1ff)',
                borderRadius: 2, marginRight: 8,
              }} />
              <Text strong style={{ fontSize: 17 }}>
                5-6月线索攻坚战 · 作战看板
                {campaigns.find(c => c.id === activeCampaignId) && (
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    {campaigns.find(c => c.id === activeCampaignId)?.name}
                  </Tag>
                )}
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {campaigns.find(c => c.id === activeCampaignId)?.startDate} ~ {campaigns.find(c => c.id === activeCampaignId)?.endDate}
              </Text>
            </Space>
            <Space>
              <Button type={reviewMode ? 'primary' : 'default'} icon={<AuditOutlined />} onClick={toggleReviewMode}>
                {reviewMode ? '退出评审模式' : '评审模式'}
              </Button>
              <Select
                size="small" style={{ width: 200 }}
                value={activeCampaignId}
                onChange={(v) => { setActiveCampaignId(v); fetchCampaignDashboard(v!).then(setDashboard).catch(() => {}); }}
                options={campaigns.map(c => ({ value: c.id, label: c.name }))}
              />
            </Space>
          </div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={16}>
              <Card size="small" styles={{ body: { padding: '14px 16px' } }}>
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text strong>战役总目标</Text>
                    <Text type="secondary">
                      新增有效线索 {dashboard.addedCount}/{dashboard.targetCount} · 转化率 {dashboard.conversionRate.toFixed(1)}%
                    </Text>
                  </Space>
                  <Progress
                    percent={Math.min(100, Math.round((dashboard.addedCount / Math.max(dashboard.targetCount, 1)) * 100))}
                    status={dashboard.addedCount >= dashboard.targetCount ? 'success' : dashboard.redWarningCount > 0 ? 'exception' : 'active'}
                  />
                  <Text type="secondary">红灯线索会自动进入督办池，点击红灯卡片可一键穿透到列表。</Text>
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" styles={{ body: { padding: '14px 16px' } }}>
                <Space direction="vertical" size={4}>
                  <Text strong>今日战报提示</Text>
                  <Text type="secondary">18:00 自动生成战役日报：新增、转化、风险、明日重点。</Text>
                  <Button size="small" icon={<DownloadOutlined />} onClick={handleExport}>导出选中周报</Button>
                </Space>
              </Card>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" styles={{ body: { padding: '12px 16px' } }}>
                <Statistic title="战役目标" value={dashboard.targetCount} suffix="条" valueStyle={{ fontSize: 24, fontWeight: 700 }} />
                <div style={{ marginTop: 4 }}><Text type="secondary" style={{ fontSize: 12 }}>目标金额: {dashboard.targetAmount || '-'} 万</Text></div>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" styles={{ body: { padding: '12px 16px' } }}>
                <Statistic title="已新增线索" value={dashboard.addedCount} suffix="条" valueStyle={{ color: '#1677ff', fontSize: 24, fontWeight: 700 }} />
                <div style={{ marginTop: 4 }}><Tag color="blue">完成率 {((dashboard.addedCount / Math.max(dashboard.targetCount, 1)) * 100).toFixed(0)}%</Tag></div>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" styles={{ body: { padding: '12px 16px' } }}>
                <Statistic title="有效线索率" value={dashboard.validRate} suffix="%" precision={1} valueStyle={{ color: '#52c41a', fontSize: 24, fontWeight: 700 }} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" styles={{ body: { padding: '12px 16px' } }}>
                <Statistic title="商机转化率" value={dashboard.conversionRate} suffix="%" precision={1} valueStyle={{ color: '#722ed1', fontSize: 24, fontWeight: 700 }} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" styles={{ body: { padding: '12px 16px' } }}>
                <Statistic title="待评审" value={dashboard.pendingReviewCount} suffix="条" valueStyle={{ color: '#fa8c16', fontSize: 24, fontWeight: 700 }} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" hoverable styles={{ body: { padding: '12px 16px' } }}>
                <Statistic
                  title="超期预警" value={dashboard.yellowWarningCount + (dashboard.redWarningCount || 0)}
                  suffix="条" valueStyle={{ color: '#ff4d4f', fontSize: 24, fontWeight: 700 }}
                />
                <div style={{ marginTop: 4 }}>
                  <Tag color="gold" onClick={() => { form.setFieldsValue({ healthStatus: 'yellow' }); loadData(1); }}>黄灯 {dashboard.yellowWarningCount}</Tag>
                  <Tag color="red" onClick={() => { form.setFieldsValue({ healthStatus: 'red' }); loadData(1); }}>红灯 {dashboard.redWarningCount || 0}</Tag>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {/* ===== 筛选区 ===== */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }} styles={{ body: { padding: '24px 24px 8px' } }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Text type="secondary">快捷筛选</Text>
          <Segmented
            size="small"
            value={activeQuickFilter}
            onChange={(value) => applyQuickFilter(String(value))}
            options={[
              { label: '全部', value: 'all' },
              ...QUICK_FILTERS.map(item => ({ label: item.label, value: item.key })),
            ]}
          />
          {reviewMode && <Tag color="purple" icon={<AuditOutlined />}>周度评审工作台已开启</Tag>}
        </Space>
        <Form form={form} layout="horizontal" onFinish={() => loadData(1)}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="keyword" label="关键词"><Input placeholder="线索名称/公司" allowClear prefix={<SearchOutlined />} /></Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="status" label="线索状态"><Select placeholder="全部状态" allowClear options={STATUS_OPTIONS.map(v => ({ value: v, label: v }))} /></Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="healthStatus" label="健康度"><Select placeholder="全部" allowClear options={HEALTH_OPTIONS.map(v => ({ value: v, label: HEALTH_LABELS[v] }))} /></Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="clientCircle" label="客户圈层"><Select placeholder="全部圈层" allowClear options={CIRCLE_OPTIONS.map(v => ({ value: v, label: `${v}(${CIRCLE_LABELS[v]})` }))} /></Form.Item>
            </Col>

            {expandSearch && (
              <>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="owner" label="责任人"><Input placeholder="请输入" allowClear /></Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="clueLevel" label="线索等级"><Select placeholder="全部等级" allowClear options={LEVEL_OPTIONS.map(v => ({ value: v, label: v + '级' }))} /></Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="campaignId" label="所属战役"><Select placeholder="全部战役" allowClear options={campaigns.map(c => ({ value: c.id, label: c.name }))} /></Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="dateRange" label="留痕日期"><RangePicker style={{ width: '100%' }} /></Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="deptBelong" label="承接部门"><Input placeholder="请输入" allowClear /></Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="level" label="等级(别名)"><Select placeholder="全部" allowClear options={LEVEL_OPTIONS.map(v => ({ value: v, label: v }))} /></Form.Item>
                </Col>
              </>
            )}

            <Col flex="auto" style={{ textAlign: 'right', paddingBottom: 16 }}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
                <Button icon={<ReloadOutlined />} onClick={() => { form.resetFields(); setActiveQuickFilter('all'); setReviewMode(false); loadData(1); }}>重置</Button>
                <Link onClick={() => setExpandSearch(!expandSearch)} style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                  {expandSearch ? <><UpOutlined /> 收起</> : <><DownOutlined /> 展开</>}
                </Link>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* ===== 表格区 ===== */}
      <Card
        style={{ borderRadius: 8 }}
        title={<Space><Text strong style={{ fontSize: 16 }}>线索管理</Text><Tag color="blue">共 {total} 条线索</Tag></Space>}
        extra={
          <Space size="middle" wrap>
            {selectedRowKeys.length > 0 && (
              <>
                <Text type="secondary">已选 {selectedRowKeys.length} 项</Text>
                <Dropdown menu={{ items: [
                  { key: 'assign', icon: <UserSwitchOutlined />, label: '批量分配责任人', onClick: () => { batchForm.resetFields(); setBatchAssignVisible(true); } },
                  { key: 'level', icon: <TagOutlined />, label: '批量调整等级', onClick: () => { batchForm.resetFields(); setBatchLevelVisible(true); } },
                  { key: 'campaign', icon: <FlagOutlined />, label: '批量划入战役', onClick: () => { batchForm.resetFields(); setBatchCampaignVisible(true); } },
                  { key: 'export', icon: <DownloadOutlined />, label: '导出周报数据', onClick: handleExport },
                  { type: 'divider' },
                  { key: 'delete', icon: <span style={{ color: '#ff4d4f' }}>🗑</span>, label: <span style={{ color: '#ff4d4f' }}>批量删除</span>, onClick: handleBatchDelete, danger: true },
                ] }}>
                  <Button>批量操作 <DownOutlined /></Button>
                </Dropdown>
              </>
            )}
            <Button icon={<PlusOutlined />} type="primary" onClick={openCreate}>新建线索</Button>
            <Popover
              trigger="click"
              title="自定义显示列"
              content={
                <Checkbox.Group value={visibleColumns} onChange={handleColumnChange}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                  {allColumns.map(col => (
                    <Checkbox key={col.dataIndex || col.key} value={col.dataIndex || col.key}>{col.title}</Checkbox>
                  ))}
                </Checkbox.Group>
              }
            >
              <Tooltip title="列设置"><Button icon={<SettingOutlined />} /></Tooltip>
            </Popover>
            <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
              <Button icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />} onClick={toggleFullscreen} />
            </Tooltip>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={currentColumns}
          dataSource={dataSource}
          loading={loading}
          scroll={{ x: 1600 }}
          size="middle"
          rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }}
          pagination={{
            ...pagination, total, showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => loadData(page, pageSize),
          }}
        />
      </Card>

      {/* ===== 新建/编辑 Drawer ===== */}
      <Drawer
        title={editId ? '编辑线索' : '新建线索'}
        width={600}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={<Space><Button onClick={() => setDrawerOpen(false)}>取消</Button><Button type="primary" loading={drawerLoading} onClick={handleDrawerSubmit}>{editId ? '保存' : '创建'}</Button></Space>}
      >
        <Form form={drawerForm} layout="vertical" scrollToFirstError>
          <Form.Item name="clueName" label="线索名称" rules={[{ required: true }]}><Input placeholder="如：腾讯云数据中台项目" /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="clientCompany" label="甲方公司" rules={[{ required: true }]}><Input placeholder="公司全称" /></Form.Item></Col>
            <Col span={12}><Form.Item name="clientDept" label="甲方部门"><Input placeholder="如：技术部" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="beikeOwner" label="责任人(AR)" rules={[{ required: true }]}><Input placeholder="负责人姓名" /></Form.Item></Col>
            <Col span={12}><Form.Item name="clientContact" label="甲方对接人"><Input placeholder="联系人姓名" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="clueStatus" label="线索状态" rules={[{ required: true }]}><Select options={STATUS_OPTIONS.map(v => ({ value: v, label: v }))} /></Form.Item></Col>
            <Col span={8}><Form.Item name="clueLevel" label="线索等级" rules={[{ required: true }]}><Select options={LEVEL_OPTIONS.map(v => ({ value: v, label: v + '级' }))} /></Form.Item></Col>
            <Col span={8}><Form.Item name="deptBelong" label="承接部门" rules={[{ required: true }]}><Select options={['销售一部', '销售二部', '大客户组', '政府事业部'].map(v => ({ value: v, label: v }))} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="clientCircle" label="客户圈层"><Select placeholder="选择圈层" options={CIRCLE_OPTIONS.map(v => ({ value: v, label: `${v}(${CIRCLE_LABELS[v]})` }))} /></Form.Item></Col>
            <Col span={12}><Form.Item name="campaignId" label="归属战役"><Select placeholder="选择战役" allowClear options={campaigns.map(c => ({ value: c.id, label: c.name }))} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="sourceType" label="线索来源"><Select placeholder="选择来源" options={['产品发布会', '技术交流会', '客户走访', '市场活动', '其他'].map(v => ({ value: v, label: v }))} /></Form.Item></Col>
            <Col span={12}><Form.Item name="sourceActivityName" label="来源活动名称"><Input placeholder="活动名称" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="budget" label="预算量级"><Input placeholder="如：100-500万" /></Form.Item></Col>
            <Col span={12}><Form.Item name="contactDate" label="接触日期"><Input type="date" /></Form.Item></Col>
          </Row>
          <Form.Item name="requirementDesc" label="需求概要"><Input.TextArea rows={2} placeholder="核心需求一句话摘要" /></Form.Item>
          <Form.Item name="painPoint" label="客户痛点"><Input.TextArea rows={2} placeholder="客户当前面临的问题和痛点" /></Form.Item>
          <Form.Item name="expectedTarget" label="预期目标"><Input.TextArea rows={2} placeholder="客户期望达到的目标" /></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} placeholder="其他补充信息" /></Form.Item>
        </Form>
      </Drawer>

      {/* ===== 批量操作 Modals ===== */}
      <Modal title="批量分配责任人" open={batchAssignVisible} onCancel={() => setBatchAssignVisible(false)} onOk={handleBatchAssign} okText="确认分配">
        <Form form={batchForm} layout="vertical">
          <Form.Item name="assignee" label="责任人" rules={[{ required: true }]}><Input placeholder="如：张明" /></Form.Item>
          <Text type="secondary">将为选中的 {selectedRowKeys.length} 条线索统一分配责任人</Text>
        </Form>
      </Modal>

      <Modal title="批量调整线索等级" open={batchLevelVisible} onCancel={() => setBatchLevelVisible(false)} onOk={handleBatchLevel} okText="确认调整">
        <Form form={batchForm} layout="vertical">
          <Form.Item name="level" label="线索等级" rules={[{ required: true }]}><Select options={LEVEL_OPTIONS.map(v => ({ value: v, label: v + '级' }))} /></Form.Item>
          <Text type="secondary">将为选中的 {selectedRowKeys.length} 条线索统一调整等级</Text>
        </Form>
      </Modal>

      <Modal title="批量划入战役" open={batchCampaignVisible} onCancel={() => setBatchCampaignVisible(false)} onOk={handleBatchCampaign} okText="确认划入">
        <Form form={batchForm} layout="vertical">
          <Form.Item name="campaignId" label="目标战役" rules={[{ required: true }]}><Select placeholder="选择战役" options={campaigns.map(c => ({ value: c.id, label: c.name }))} /></Form.Item>
          <Text type="secondary">将为选中的 {selectedRowKeys.length} 条线索划入同一战役</Text>
        </Form>
      </Modal>
    </div>
  );
}
