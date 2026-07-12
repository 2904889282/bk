/**
 * 项目详情 — 独立暗色页面（脱离 BasicLayout 白底限制）
 * 全字段内联编辑 + 铁三角 + 里程碑 + 周进度
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { fetchDashboard, updateProject, type ProjectDashboard } from '../../../api/project';

const T = { s1:'#0f1011', s2:'#141516', hl:'#23252a', hls:'#34343a', ink:'#f7f8f8', ink2:'#d0d6e0', ink3:'#8a8f98', ink4:'#757880', p:'#5e6ad2', ok:'#27a644', warn:'#d4a030', err:'#e05050', bg:'#010102' };
const RATING: Record<string,string> = { A:'#e5484d', B:'#f5a623', C:'#6b7280' };

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dash, setDash] = useState<ProjectDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    fetchDashboard(Number(id))
      .then(d => setDash(d))
      .catch(() => setDash(null))
      .finally(() => setLoading(false));
  }, [id]);

  const save = async (field: string, value: any) => {
    try {
      await updateProject(dash!.project.id, { [field]: value } as any);
      setSaveMsg('已保存'); setTimeout(() => setSaveMsg(''), 2000);
    } catch { setSaveMsg('保存失败'); }
  };

  /* 暗色全页容器 */
  const wrapper: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: T.bg, color: T.ink, fontFamily: 'inherit',
    overflowY: 'auto', padding: '24px 32px 80px',
  };

  if (loading) return (
    <div style={wrapper}>
      <div style={{ textAlign: 'center', paddingTop: '30vh', color: T.ink4 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, fontSize: 13 }}>加载项目数据...</div>
      </div>
    </div>
  );

  if (!dash?.project) return (
    <div style={wrapper}>
      <div style={{ textAlign: 'center', paddingTop: '30vh', color: T.ink4 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
        <div style={{ fontSize: 16, marginBottom: 8, color: T.ink2 }}>项目不存在或无权限</div>
        <div style={{ fontSize: 13, marginBottom: 20 }}>请确认项目ID正确，或联系管理员</div>
        <button onClick={() => navigate('/pm/projects')} style={{
          padding: '8px 20px', borderRadius: 8, border: `1px solid ${T.p}`, background: 'transparent',
          color: T.p, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
        }}>返回项目列表</button>
      </div>
    </div>
  );

  const p = dash.project;
  const milestones = dash.milestones || [];
  const periods = dash.periods || [];

  return (
    <div style={wrapper}>
      {/* 保存提示 */}
      {saveMsg && (
        <div style={{
          position: 'fixed', top: 16, right: 24, zIndex: 2000,
          background: T.s2, border: `1px solid ${T.hl}`, borderRadius: 8,
          padding: '8px 16px', fontSize: 13, color: T.ink,
        }}>{saveMsg}</div>
      )}

      {/* 顶部 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, maxWidth: 900 }}>
        <button onClick={() => navigate('/pm/projects')} style={{
          padding: '6px 14px', borderRadius: 8, border: `1px solid ${T.hl}`, background: 'transparent',
          color: T.ink3, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <ArrowLeftOutlined /> 返回
        </button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: T.ink, flex: 1 }}>{p.projectName}</h2>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 5, fontSize: 11, fontWeight: 700, background: RATING[p.projectLevel] || T.ink4, color: '#fff' }}>{p.projectLevel || '-'}</span>
        <span style={{ padding: '3px 12px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(94,106,210,0.15)', color: T.p }}>{p.projectStatus || '-'}</span>
      </div>

      <div style={{ maxWidth: 900 }}>
        {/* 基本信息 */}
        <Section title="基本信息">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
            <Field label="项目名称" val={p.projectName} onChange={v => save('projectName', v)} />
            <Field label="项目编号" val={p.projectNumber || ''} onChange={v => save('projectNumber', v)} />
            <Field label="客户公司" val={p.clientName || ''} onChange={v => save('clientName', v)} />
            <Field label="甲方对接人" val={p.clientContact || ''} onChange={v => save('clientContact', v)} />
            <Field label="开始日期" val={p.startDate || ''} onChange={v => save('startDate', v)} />
            <Field label="结束日期" val={p.expectEndDate || ''} onChange={v => save('expectEndDate', v)} />
            <Field label="预计营收" val={String(p.projectAmount || '')} onChange={v => save('projectAmount', Number(v))} />
            <Field label="供应商" val={p.supplier || ''} onChange={v => save('supplier', v)} />
          </div>
        </Section>

        {/* 铁三角 */}
        <Section title="铁三角 · 核心团队">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="一条龙经理" val={p.projectManager || ''} onChange={v => save('projectManager', v)} />
            <Field label="交付经理" val={p.deliveryManager || ''} onChange={v => save('deliveryManager', v)} />
            <Field label="产品经理" val={p.productManager || ''} onChange={v => save('productManager', v)} />
          </div>
        </Section>

        {/* 里程碑 */}
        <Section title={`里程碑 ${milestones.filter((m:any) => m.status === 'done' || m.status === '已完成').length}/${milestones.length} 完成`}>
          {milestones.length === 0 && <div style={{ color: T.ink4, fontSize: 12, padding: '12px 0' }}>暂无里程碑</div>}
          {milestones.map((m: any, i: number) => (
            <div key={i} style={{ background: T.s2, border: `1px solid ${T.hl}`, borderRadius: 8, padding: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 16 }}>{m.status === 'done' || m.status === '已完成' ? '●' : '○'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>{m.name || '新里程碑'}</div>
                <div style={{ fontSize: 11, color: T.ink4 }}>
                  {m.deadline ? `截止 ${m.deadline}` : ''}
                  {m.reward ? ` · 奖励 ¥${m.reward}` : ''}
                </div>
              </div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: m.status === 'done' ? 'rgba(39,166,68,0.15)' : 'rgba(138,143,152,0.1)', color: m.status === 'done' ? T.ok : T.ink3 }}>
                {m.status === 'done' ? '已完成' : '未完成'}
              </span>
            </div>
          ))}
        </Section>

        {/* 周进度 */}
        {periods.length > 0 && (
          <Section title="W1-W4 周进度">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[1,2,3,4].map(w => {
                const pp = periods[0] as any;
                const prog = pp[`w${w}Progress`] || '';
                const target = pp[`w${w}Target`] || '';
                return (
                  <div key={w} style={{ background: T.s2, borderRadius: 8, padding: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: T.ink4 }}>W{w}</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: prog ? T.p : T.ink4 }}>{prog || '--'}</div>
                    {target && <div style={{ fontSize: 10, color: T.ink4, marginTop: 2 }}>目标 {target}</div>}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* 进展与风险 */}
        <Section title="进展与风险">
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: T.ink4, marginBottom: 4 }}>进展解读</div>
            <InlineInput value={p.description || ''} onChange={v => save('description', v)} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.ink4, marginBottom: 4 }}>风险评估</div>
            <InlineInput value={p.riskAssessment || ''} onChange={v => save('riskAssessment', v)} />
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: T.ink4, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, val, onChange }: { label: string; val: string; onChange: (v:string)=>void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
      <span style={{ width: 85, fontSize: 12, color: T.ink4, flexShrink: 0 }}>{label}</span>
      <InlineInput value={val} onChange={onChange} />
    </div>
  );
}

function InlineInput({ value, onChange }: { value: string; onChange: (v:string)=>void }) {
  return (
    <input defaultValue={value}
      onBlur={e => { if(e.target.value !== value) onChange(e.target.value); e.target.style.borderColor = T.hl; }}
      style={{ background: T.s2, border: `1px solid ${T.hl}`, borderRadius: 6, padding: '5px 8px', fontSize: 13, color: T.ink, fontFamily: 'inherit', outline: 'none', width: '100%' }}
      onFocus={e => e.target.style.borderColor = T.hls}
    />
  );
}
