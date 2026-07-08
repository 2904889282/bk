import { Card, Col, Form, Input, Row, Select } from 'antd';
import type { CampaignItem } from '../../api/clue';
import type { UserOption, DeptOption } from '../../api/dept';
import {
  BUDGET_OPTIONS,
  CLIENT_CIRCLE_LABELS,
  CLIENT_CIRCLE_OPTIONS,
  CLUE_LEVEL_OPTIONS,
  CLUE_STATUS_OPTIONS,
  DEPT_OPTIONS,
  HEALTH_LABELS,
  HEALTH_OPTIONS,
  INDUSTRY_OPTIONS,
  MAINTENANCE_METHOD_OPTIONS,
  PRODUCT_OPTIONS,
  SOURCE_TYPE_OPTIONS,
  VALUE_QUADRANT_OPTIONS,
  toSelectOptions,
} from './clueFormConfig';

type Props = {
  campaigns?: CampaignItem[];
  users?: UserOption[];
  depts?: DeptOption[];
  compact?: boolean;
};

export default function ClueFormFields({ campaigns = [], users = [], depts = [], compact = false }: Props) {
  const form = Form.useFormInstance();

  const userOptions = users.map(u => ({ value: u.realName, label: u.label }));
  const deptOptions = depts.length > 0
    ? depts.map(d => ({ value: d.name, label: d.name }))
    : toSelectOptions(DEPT_OPTIONS);

  /** 选择承接人后自动填充承接部门 */
  const handleOwnerChange = (realName: string) => {
    const user = users.find(u => u.realName === realName);
    if (user && user.deptId) {
      const dept = depts.find(d => d.id === user.deptId);
      if (dept) form.setFieldValue('deptBelong', dept.name);
    }
  };
  return (
    <>
      <Card size="small" title="客户与线索基础">
        <Form.Item name="clueName" label="线索名称" rules={[{ required: true, message: '请输入线索名称' }]}>
          <Input placeholder="如：腾讯云数据中台项目" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="clientCompany" label="甲方公司" rules={[{ required: true, message: '请输入甲方公司' }]}>
              <Input placeholder="公司全称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="clientDept" label="甲方部门">
              <Input placeholder="如：技术部/采购部" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="clientContact" label="甲方对接人">
              <Input placeholder="联系人姓名/角色" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="beikeOwner" label="责任人(AR)" rules={[{ required: true, message: '请选择承接人' }]}>
              <Select showSearch placeholder="选择承接人" options={userOptions}
                filterOption={(input, option) => (option?.label as string || '').includes(input)}
                onChange={handleOwnerChange} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="deptBelong" label="承接部门" rules={[{ required: true, message: '请选择承接部门' }]}>
              <Select options={deptOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="clientCircle" label="客户圈层">
              <Select allowClear options={toSelectOptions(CLIENT_CIRCLE_OPTIONS, CLIENT_CIRCLE_LABELS)} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card size="small" title="分级、来源与金额" style={{ marginTop: 12 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="clueStatus" label="线索状态" rules={[{ required: true, message: '请选择线索状态' }]}>
              <Select options={toSelectOptions(CLUE_STATUS_OPTIONS)} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="clueLevel" label="线索等级" rules={[{ required: true, message: '请选择线索等级' }]}>
              <Select options={CLUE_LEVEL_OPTIONS.map(value => ({ value, label: `${value}级` }))} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="healthStatus" label="健康度">
              <Select options={HEALTH_OPTIONS.map(value => ({ value, label: HEALTH_LABELS[value] }))} />
            </Form.Item>
          </Col>
        </Row>
        {!compact && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="businessConfirmed" label="确认商机">
                <Select allowClear options={['未确认', '评审中', '已确认', '暂不确认'].map(value => ({ value, label: value }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="proposalDate" label="提案日期">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
        )}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="sourceType" label="线索来源">
              <Select allowClear options={toSelectOptions(SOURCE_TYPE_OPTIONS)} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="sourceActivityName" label="来源活动名称">
              <Input placeholder="活动、会议或转介绍来源" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="industry" label="所属行业">
              <Select allowClear options={toSelectOptions(INDUSTRY_OPTIONS)} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="valueQuadrant" label="价值象限">
              <Select allowClear options={toSelectOptions(VALUE_QUADRANT_OPTIONS)} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="budget" label="预算量级">
              <Select allowClear options={toSelectOptions(BUDGET_OPTIONS)} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="budgetAmount" label="预算金额（万）">
              <Input type="number" placeholder="如：300" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="opportunityAmount" label="预计商机金额（万）">
              <Input type="number" placeholder="如：500" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {!compact && (
        <Card size="small" title="产品匹配与维护计划" style={{ marginTop: 12 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="matchedProducts" label="匹配产品等级">
                <Select mode="multiple" allowClear options={toSelectOptions(PRODUCT_OPTIONS)} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="recommendedProducts" label="推荐核心产品">
                <Select mode="multiple" allowClear options={toSelectOptions(PRODUCT_OPTIONS)} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="maintenanceFreq" label="维护频率（天）">
                <Input type="number" placeholder="如：14" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="nextMaintenanceDate" label="下次维护日期">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maintenanceMethods" label="维护方式">
                <Select mode="multiple" allowClear options={toSelectOptions(MAINTENANCE_METHOD_OPTIONS)} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="campaignId" label="归属战役">
                <Select allowClear placeholder="选择战役" options={campaigns.map(c => ({ value: c.id, label: c.name }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contactDate" label="接触日期">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      )}

      <Card size="small" title="需求与判断" style={{ marginTop: 12 }}>
        <Form.Item name="requirementDesc" label="需求概要">
          <Input.TextArea rows={compact ? 3 : 2} placeholder="核心需求一句话摘要" />
        </Form.Item>
        <Form.Item name="painPoint" label="客户痛点">
          <Input.TextArea rows={2} placeholder="客户当前面临的问题和痛点" />
        </Form.Item>
        {!compact && (
          <>
            <Form.Item name="expectedTarget" label="预期目标">
              <Input.TextArea rows={2} placeholder="客户期望达成的业务目标" />
            </Form.Item>
            <Form.Item name="clueEvaluation" label="线索评价">
              <Input.TextArea rows={2} placeholder="价值判断、进入评审理由、推进难点" />
            </Form.Item>
          </>
        )}
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} placeholder="其他补充信息" />
        </Form.Item>
      </Card>

      {!compact && (
        <Card size="small" title="沟通记录与关系链" style={{ marginTop: 12 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="commRecord1" label="沟通记录 1">
                <Input.TextArea rows={2} placeholder="首次接触要点" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="commRecord2" label="沟通记录 2">
                <Input.TextArea rows={2} placeholder="二次沟通要点" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="commRecord3" label="沟通记录 3">
                <Input.TextArea rows={2} placeholder="提案/评审沟通要点" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="commRecord4" label="沟通记录 4">
                <Input.TextArea rows={2} placeholder="后续推进要点" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="relation1" label="关系链 1">
                <Input placeholder="关键关系人/推荐人" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="relation2" label="关系链 2">
                <Input placeholder="影响人/协同人" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="relation3" label="关系链 3">
                <Input placeholder="决策人/背书人" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      )}
    </>
  );
}
