import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Card, Form, Input, Select, DatePicker, Button, Row, Col, Table, Tag,
  Space, Tooltip, Popover, Checkbox, Progress, Typography, App, Dropdown, Drawer,
  Modal,
} from 'antd';
import { useAuth } from '../../../hooks/useAuth';
import { isMockTokenError } from '../../../utils/request';
import {
  SearchOutlined, ReloadOutlined, PlusOutlined, DownloadOutlined,
  SettingOutlined, DownOutlined, UpOutlined, ExpandOutlined, CompressOutlined,
} from '@ant-design/icons';
import {
  fetchPipelinePage, createPipeline, updatePipeline, deletePipeline,
  deletePipelineBatch, claimPipeline, moveToSea,
} from '../../../api/pipeline';
import type { PipelineVO, PipelineSaveDTO } from '../../../api/pipeline';
import {
  getPipelineStageColor,
  getPipelineStageLabel,
  normalizePipelineStage,
  PIPELINE_STAGE_OPTIONS,
} from '../../../utils/stageMapping';

const { Text, Link } = Typography;
const { RangePicker } = DatePicker;

// --- 业务常量 ---
const STAGES = PIPELINE_STAGE_OPTIONS;

const PipelineList: React.FC = () => {
  const { message } = App.useApp();
  const { isMockMode } = useAuth();
  const demoMode = isMockMode();
  const [form] = Form.useForm();
  const [drawerForm] = Form.useForm();
  const tableRef = useRef<HTMLDivElement>(null);

  // 数据状态
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<PipelineVO[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // UI 控制状态
  const [expandSearch, setExpandSearch] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // 列设置 (持久化到 localStorage)
  const allColumns = useMemo(() => [
    { title: '商机编号', dataIndex: 'id', width: 100, fixed: 'left' as const },
    { title: '商机名称', dataIndex: 'name', width: 220, ellipsis: true, render: (text: string) => <Link strong>{text}</Link> },
    { title: '客户名称', dataIndex: 'customer', width: 140 },
    {
      title: '当前阶段', dataIndex: 'stage', width: 120,
      render: (stage: string) => {
        const nextStage = normalizePipelineStage(stage);
        return <Tag color={getPipelineStageColor(nextStage)}>{getPipelineStageLabel(nextStage)}</Tag>;
      }
    },
    {
      title: '预计金额', dataIndex: 'amount', width: 130, align: 'right' as const,
      render: (val: number) => <Text strong>¥ {(val || 0).toLocaleString()}</Text>
    },
    {
      title: '赢率', dataIndex: 'winRate', width: 120,
      render: (val: number) => (
        <Progress
          percent={val || 0}
          size="small"
          strokeColor={val >= 80 ? '#52c41a' : val >= 50 ? '#1677ff' : '#faad14'}
        />
      )
    },
    { title: '负责人', dataIndex: 'ownerName', width: 100 },
    { title: '更新时间', dataIndex: 'updateTime', width: 160 },
    {
      title: '操作', key: 'action', width: 160, fixed: 'right' as const,
      render: (_: unknown, record: PipelineVO) => (
        <Space size="middle">
          <Link onClick={() => handleEdit(record)}>编辑</Link>
          {record.isSea === 1 ? (
            <Link onClick={() => handleClaim(record.id)}>认领</Link>
          ) : (
            <Dropdown menu={{
              items: [
                { key: 'sea', label: '移入公海', onClick: () => handleToSea(record.id) },
                { type: 'divider' },
                { key: 'delete', label: '删除', danger: true, onClick: () => handleDelete(record.id) },
              ]
            }}>
              <Link>更多 <DownOutlined /></Link>
            </Dropdown>
          )}
        </Space>
      )
    }
  ], []);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    () => {
      const saved = localStorage.getItem('pipeline_columns');
      return saved ? JSON.parse(saved) : allColumns.map(c => c.dataIndex || c.key!);
    }
  );

  // ========== 数据加载 ==========
  const loadData = async (page = pagination.current, size = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const params: any = { pageNum: page, pageSize: size };
      if (values.keyword) params.keyword = values.keyword;
      if (values.stage) params.stage = values.stage;
      if (values.owner) params.owner = values.owner;
      if (values.customer) params.customer = values.customer;
      if (values.dateRange?.[0]) params.dateFrom = values.dateRange[0].format('YYYY-MM-DD');
      if (values.dateRange?.[1]) params.dateTo = values.dateRange[1].format('YYYY-MM-DD');

      const res = await fetchPipelinePage(params);
      setDataSource(res.records || []);
      setTotal(res.total || 0);
      setPagination({ current: page, pageSize: size });
    } catch (err: unknown) {
      if (!isMockTokenError(err)) {
        message.error('加载数据失败');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(1); }, []);

  // ========== 新建 / 编辑 ==========
  const openCreate = () => {
    setEditId(null);
    drawerForm.resetFields();
    setDrawerOpen(true);
  };

  const handleEdit = (record: PipelineVO) => {
    setEditId(record.id);
    drawerForm.setFieldsValue({
      name: record.name,
      customer: record.customer,
      stage: normalizePipelineStage(record.stage),
      amount: record.amount,
      winRate: record.winRate,
      ownerId: record.ownerId,
      description: record.description,
      nextAction: record.nextAction,
      memberIds: record.members?.map(m => m.userId) || [],
    });
    setDrawerOpen(true);
  };

  const handleDrawerSubmit = async () => {
    try {
      const values = await drawerForm.validateFields();
      setDrawerLoading(true);
      const dto: PipelineSaveDTO = {
        name: values.name,
        customer: values.customer,
        stage: values.stage,
        amount: values.amount,
        winRate: values.winRate,
        ownerId: values.ownerId,
        description: values.description,
        nextAction: values.nextAction,
        memberIds: values.memberIds || [],
      };

      if (editId) {
        await updatePipeline(editId, dto);
        message.success('商机已更新');
      } else {
        await createPipeline(dto);
        message.success('商机已创建');
      }
      setDrawerOpen(false);
      loadData(1);
    } catch (err: unknown) {
      if ((err as { errorFields?: unknown })?.errorFields) return; // 表单校验失败
      message.error('操作失败');
    } finally {
      setDrawerLoading(false);
    }
  };

  // ========== 删除 ==========
  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后数据将进入回收站，确定要删除此商机吗？',
      okText: '删除',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deletePipeline(id);
          message.success('已删除');
          loadData(pagination.current);
        } catch { message.error('删除失败'); }
      },
    });
  };

  // ========== 公海操作 ==========
  const handleClaim = async (id: number) => {
    try {
      await claimPipeline(id);
      message.success('认领成功');
      loadData(pagination.current);
    } catch { message.error('认领失败'); }
  };

  const handleToSea = (id: number) => {
    Modal.confirm({
      title: '确认移入公海',
      content: '移入公海后，组内成员均可领取此商机。',
      okText: '确认',
      onOk: async () => {
        try {
          await moveToSea(id);
          message.success('已移入公海');
          setSelectedRowKeys([]);
          loadData(pagination.current);
        } catch { message.error('操作失败'); }
      },
    });
  };

  // ========== 过滤列 ==========
  const currentColumns = allColumns.filter(col =>
    visibleColumns.includes(col.dataIndex || col.key || '')
  );

  const handleColumnChange = (checkedValues: any[]) => {
    setVisibleColumns(checkedValues);
    localStorage.setItem('pipeline_columns', JSON.stringify(checkedValues));
  };

  // ========== 全屏 ==========
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      tableRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的商机');
      return;
    }
    Modal.confirm({
      title: `确认删除选中的 ${selectedRowKeys.length} 项？`,
      okText: '批量删除',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deletePipelineBatch(selectedRowKeys.map(Number));
          message.success(`已删除 ${selectedRowKeys.length} 项`);
          setSelectedRowKeys([]);
          loadData(1);
        } catch { message.error('批量删除失败'); }
      },
    });
  };

  return (
    <div ref={tableRef} style={{ padding: 24, background: 'inherit', minHeight: '100%' }}>
      {/* 1. 高级搜索区 */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }} styles={{ body: { padding: '24px 24px 0' } }}>
        <Form form={form} layout="horizontal" onFinish={() => loadData(1)}>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item name="keyword" label="商机名称">
                <Input placeholder="商机名称或编号" allowClear />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="stage" label="当前阶段">
                <Select placeholder="全部阶段" allowClear options={STAGES} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="owner" label="负责人">
                <Input placeholder="负责人ID" allowClear />
              </Form.Item>
            </Col>

            {expandSearch && (
              <>
                <Col span={8}>
                  <Form.Item name="customer" label="客户名称">
                    <Input placeholder="请输入" allowClear />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="dateRange" label="创建时间">
                    <RangePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </>
            )}

            <Col span={expandSearch ? 8 : 24} style={{ textAlign: expandSearch ? 'right' : 'left', marginBottom: 24 }}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
                <Button icon={<ReloadOutlined />} onClick={() => { form.resetFields(); loadData(1); }}>重置</Button>
                <Link onClick={() => setExpandSearch(!expandSearch)} style={{ fontSize: 13 }}>
                  {expandSearch ? '收起' : '展开'} {expandSearch ? <UpOutlined /> : <DownOutlined />}
                </Link>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 2. 数据表格区 */}
      <Card
        style={{ borderRadius: 8 }}
        title={
          <Space>
            <Text strong style={{ fontSize: 16 }}>线索列表</Text>
            <Tag color="blue">共 {total} 条商机</Tag>
          </Space>
        }
        extra={
          <Space size="middle">
            {selectedRowKeys.length > 0 && (
              <>
                <Text type="secondary">已选 {selectedRowKeys.length} 项</Text>
                <Button danger size="small" onClick={handleBatchDelete}>批量删除</Button>
              </>
            )}
            <Button icon={<PlusOutlined />} type="primary" onClick={openCreate}>新建商机</Button>
            <Tooltip title="导出数据">
              <Button icon={<DownloadOutlined />} />
            </Tooltip>
            <Popover
              trigger="click"
              title="自定义列"
              content={
                <Checkbox.Group
                  value={visibleColumns}
                  onChange={handleColumnChange}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}
                >
                  {allColumns.map(col => (
                    <Checkbox key={col.dataIndex || col.key} value={col.dataIndex || col.key}>
                      {col.title}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              }
            >
              <Tooltip title="列设置">
                <Button icon={<SettingOutlined />} />
              </Tooltip>
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
          scroll={{ x: 1300 }}
          locale={{
            emptyText: demoMode && !loading ? (
              <Space direction="vertical" size={8} style={{ padding: 24 }}>
                <Typography.Text type="secondary">演示模式下无法加载商机数据</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>请启动后端服务后使用真实账号重新登录</Typography.Text>
              </Space>
            ) : undefined,
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `第 ${pagination.current} 页 / 共 ${Math.ceil(total / pagination.pageSize)} 页`,
            onChange: (page, pageSize) => loadData(page, pageSize)
          }}
        />
      </Card>

      {/* 3. 新建/编辑 Drawer */}
      <Drawer
        title={editId ? '编辑商机' : '新建商机'}
        size="large"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" loading={drawerLoading} onClick={handleDrawerSubmit}>
              {editId ? '保存' : '创建'}
            </Button>
          </Space>
        }
      >
        <Form form={drawerForm} layout="vertical">
          <Form.Item name="name" label="商机名称" rules={[{ required: true, message: '请输入商机名称' }]}>
            <Input placeholder="如：腾讯云数据中台升级" />
          </Form.Item>
          <Form.Item name="customer" label="客户名称">
            <Input placeholder="甲方公司名称" />
          </Form.Item>
          <Form.Item name="ownerId" label="负责人" rules={[{ required: true, message: '请选择负责人' }]}>
            <Select placeholder="选择负责人" allowClear>
              {/* 实际项目：从 /api/user/list 获取 */}
              <Select.Option value={1}>管理员</Select.Option>
              <Select.Option value={2}>张明</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="stage" label="当前阶段" initialValue="lead">
            <Select options={STAGES} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label="预计金额（元）">
                <Input type="number" placeholder="0" prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="winRate" label="赢率（%）">
                <Input type="number" placeholder="0" min={0} max={100} suffix="%" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="nextAction" label="下一步行动">
            <Input.TextArea rows={2} placeholder="如：周五前完成方案报价" />
          </Form.Item>
          <Form.Item name="description" label="备注">
            <Input.TextArea rows={3} placeholder="其他需要说明的内容" />
          </Form.Item>
          <Form.Item name="memberIds" label="团队成员">
            <Select mode="multiple" placeholder="选择团队成员（多选）" allowClear>
              <Select.Option value={1}>管理员</Select.Option>
              <Select.Option value={2}>张明</Select.Option>
              <Select.Option value={3}>李四</Select.Option>
              <Select.Option value={4}>王五</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default PipelineList;
