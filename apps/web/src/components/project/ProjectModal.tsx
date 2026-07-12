/**
 * 新增/编辑项目 Modal — 独立暗色设计系统
 * 与页面背景区分，表单字段层次分明
 */
import { useState, useEffect, useMemo } from 'react';
import { Modal, App } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { createProject, updateProject, fetchProjectPage, saveMilestones, saveTeam, type ProjectVO } from '../../api/project';

/* ──── Modal 专用色板（比页面背景更亮的暗色，形成层次感） ──── */
const C = {
  modalBg:  '#15171a',   // 内容区背景 — 比页面 s1 稍亮
  inputBg:  '#1b1d21',   // 输入框背景 — 比内容区更亮
  border:   '#2d3139',   // 边框 — 更可见
  borderF:  '#454a55',   // 聚焦边框
  text:     '#eaecf0',   // 主文字
  sub:      '#99a0ad',   // 辅助文字/标签
  muted:    '#6b7280',   // placeholder
  accent:   '#6c75db',   // 主色
  accentBg: 'rgba(108,117,219,0.12)',
  green:    '#3aaf5c',
  red:      '#e05050',
  warn:     '#d4a030',
};

/* ──── 输入框基础样式 ──── */
const inpBase: React.CSSProperties = {
  width: '100%', background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 7,
  padding: '8px 11px', fontSize: 13, color: C.text, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
};
const inpFocus = { borderColor: C.borderF, boxShadow: `0 0 0 2px ${C.accentBg}` };
const selStyle: React.CSSProperties = {
  ...inpBase, cursor: 'pointer', appearance: 'auto',
  paddingRight: 28, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5l3 3 3-3' stroke='%2399a0ad' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
};

/* ──── 行容器 ──── */
const Row2 = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', alignItems: 'start', marginBottom: 14 }}>
    {children}
  </div>
);

/* ──── 字段组 ──── */
const FG = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={{ fontSize: 12, fontWeight: 500, color: C.sub }}>
      {label}{required && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
    </label>
    {children}
  </div>
);

/* ──── 折叠面板 ──── */
const Section = ({ icon, title, count, defaultOpen, children }: {
  icon: string; title: string; count: number; defaultOpen?: boolean; children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div style={{
      marginTop: 14, background: C.inputBg, borderRadius: 8,
      border: `1px solid ${C.border}`, overflow: 'hidden',
    }}>
      <div onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
        cursor: 'pointer', userSelect: 'none', fontSize: 13, fontWeight: 500, color: C.sub,
      }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ flex: 1 }}>{title}</span>
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>{count}{count === 1 ? '项' : '项'}</span>
        <span style={{ fontSize: 10, color: C.muted, transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
      </div>
      {open && <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ paddingTop: 12 }}>{children}</div>
      </div>}
    </div>
  );
};

/* ──── 焦点管理 Hook ──── */
const useFocusStyle = () => {
  const [focus, setFocus] = useState(false);
  return {
    focused: focus,
    handlers: {
      onFocus: () => setFocus(true),
      onBlur: () => setFocus(false),
    },
    style: { ...inpBase, ...(focus ? inpFocus : {}) },
  };
};

interface Props { open: boolean; editProject?: ProjectVO | null; onClose: (saved?: boolean) => void; }

export default function ProjectModal({ open, editProject, onClose }: Props) {
  const { message } = App.useApp();

  /* 基础字段 */
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [manager, setManager] = useState('');
  const [deliveryMgr, setDeliveryMgr] = useState('');
  const [productMgr, setProductMgr] = useState('');
  const [dept, setDept] = useState('');
  const [rating, setRating] = useState('B');
  const [status, setStatus] = useState('进行中');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contact, setContact] = useState('');
  const [supplier, setSupplier] = useState('');
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState('');
  const [risk, setRisk] = useState('');
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);

  /* 里程碑 */
  interface Ms { stage: string; milestone: string; plannedDate: string; status: string; }
  const [mss, setMss] = useState<Ms[]>([]);
  const addMs = () => setMss(p => [...p, { stage: '', milestone: '', plannedDate: '', status: '未完成' }]);
  const rmMs = (i: number) => setMss(p => p.filter((_, j) => j !== i));
  const upMs = (i: number, f: keyof Ms, v: string) => setMss(p => p.map((m, j) => j === i ? { ...m, [f]: v } : m));

  /* 团队 */
  interface Tm { name: string; role: string; dept: string; responsibility: string; }
  const [tms, setTms] = useState<Tm[]>([]);
  const addTm = () => setTms(p => [...p, { name: '', role: '', dept: '', responsibility: '' }]);
  const rmTm = (i: number) => setTms(p => p.filter((_, j) => j !== i));
  const upTm = (i: number, f: keyof Tm, v: string) => setTms(p => p.map((t, j) => j === i ? { ...t, [f]: v } : t));

  /* 自动补全人员池 */
  const [pool, setPool] = useState<string[]>([]);
  useEffect(() => {
    fetchProjectPage({ pageNum: 1, pageSize: 200 }).then(res => {
      const s = new Set<string>();
      (res.records || []).forEach(p => { if (p.projectManager) s.add(p.projectManager); if (p.deliveryManager) s.add(p.deliveryManager); if (p.productManager) s.add(p.productManager); });
      setPool(Array.from(s).sort());
    }).catch(() => { });
  }, []);

  /* 初始化 */
  useEffect(() => {
    if (!open) return;
    if (editProject) {
      const p = editProject;
      setName(p.projectName || ''); setClientName(p.clientName || '');
      setManager(p.projectManager || ''); setDeliveryMgr(p.deliveryManager || '');
      setProductMgr(p.productManager || ''); setDept(p.deptBelong || '');
      setRating(p.projectLevel || 'B'); setStatus(p.projectStatus || '进行中');
      setContact(p.clientContact || ''); setSupplier(p.supplier || '');
      setAmount(String(p.projectAmount || '')); setCode(p.projectNumber || '');
      setRisk(p.riskAssessment || ''); setSummary(p.description || '');
      setStartDate(p.startDate || ''); setEndDate(p.expectEndDate || '');
      setMss([]); setTms([]);
    } else {
      setName(''); setClientName(''); setManager(''); setDeliveryMgr(''); setProductMgr('');
      setDept(''); setRating('B'); setStatus('进行中'); setContact(''); setSupplier('');
      setAmount(''); setCode(''); setRisk(''); setSummary(''); setStartDate(''); setEndDate('');
      setMss([]); setTms([]);
    }
  }, [open, editProject]);

  /* 保存 */
  const save = async () => {
    if (!name.trim() || !clientName.trim() || !manager.trim()) { message.error('项目名称、客户公司和一条龙经理为必填'); return; }
    setSaving(true);
    try {
      const dto: any = {
        projectName: name, clientName, projectManager: manager, projectLevel: rating,
        projectStatus: status, deptBelong: dept, deliveryManager: deliveryMgr,
        productManager: productMgr, projectAmount: Number(amount) || 0,
        projectNumber: code, clientContact: contact, supplier,
        startDate: startDate || undefined, expectEndDate: endDate || undefined,
        riskAssessment: risk, description: summary,
      };
      let pid: number | undefined;
      if (editProject) { await updateProject(editProject.id, dto); pid = editProject.id; }
      else { const r = await createProject(dto); pid = r?.id; }
      if (pid && mss.length > 0) try { await saveMilestones(pid, mss); } catch { }
      if (pid && tms.length > 0) try { await saveTeam(pid, tms); } catch { }
      message.success(editProject ? '已更新' : '已创建');
      onClose(true);
    } catch { message.error('保存失败'); }
    finally { setSaving(false); }
  };

  const ac = (v: string, onChange: (v: string) => void, ph: string) => (
    <AutocompleteInput value={v} onChange={onChange} placeholder={ph} pool={pool} />
  );

  /* 内联输入（带焦点高亮） */
  const Inp = ({ value, onChange, placeholder, type }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => {
    const { focused, handlers, style } = useFocusStyle();
    return <input {...handlers} type={type || 'text'} style={style} value={value}
      onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
  };

  return (
    <Modal
      title={null} open={open} onCancel={() => onClose()}
      footer={null} width={700} closable={false} destroyOnHidden
      maskClosable={false}
      styles={{
        body: { padding: 0 },
        content: { padding: 0, background: C.modalBg, borderRadius: 14, overflow: 'hidden' },
      }}
      style={{ top: 30 }}
    >
      {/* ── Header ── */}
      <div style={{ padding: '18px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 17, fontWeight: 600, color: C.text }}>
          {editProject ? '编辑项目' : '新建项目'}
        </span>
        <button onClick={() => onClose()}
          style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent',
            color: C.muted, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.inputBg; e.currentTarget.style.color = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}>
          ✕
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '24px 28px 8px', maxHeight: '60vh', overflowY: 'auto' }}>

        {/* ══ 基本信息 ══ */}
        <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          基本信息
        </div>

        <Row2>
          <FG label="项目名称" required><Inp value={name} onChange={setName} placeholder="例如：夸克图文生产-7月" /></FG>
          <FG label="客户公司" required><Inp value={clientName} onChange={setClientName} placeholder="客户公司名称" /></FG>
        </Row2>
        <Row2>
          <FG label="一条龙经理" required>{ac(manager, setManager, '选择一条龙经理')}</FG>
          <FG label="项目编号"><Inp value={code} onChange={setCode} placeholder="自动生成" /></FG>
        </Row2>
        <Row2>
          <FG label="交付经理">{ac(deliveryMgr, setDeliveryMgr, '选择交付经理')}</FG>
          <FG label="产品经理">{ac(productMgr, setProductMgr, '选择产品经理')}</FG>
        </Row2>
        <Row2>
          <FG label="所属部门"><Inp value={dept} onChange={setDept} placeholder="例如：平台一部" /></FG>
          <FG label="评级">
            <select style={selStyle} value={rating} onChange={e => setRating(e.target.value)}>
              <option value="">-- 无 --</option>
              <option value="S">S 级</option>
              <option value="A">A 级</option>
              <option value="B">B 级</option>
              <option value="C">C 级</option>
            </select>
          </FG>
        </Row2>
        <Row2>
          <FG label="甲方对接人"><Inp value={contact} onChange={setContact} placeholder="客户方联系人" /></FG>
          <FG label="项目状态">
            <select style={selStyle} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="进行中">进行中</option>
              <option value="正式执行">正式执行</option>
              <option value="已完成">已完成</option>
              <option value="已暂停">已暂停</option>
              <option value="终止">终止</option>
            </select>
          </FG>
        </Row2>
        <Row2>
          <FG label="开始日期"><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            style={inpBase} onFocus={e => Object.assign(e.target.style, inpFocus)}
            onBlur={e => Object.assign(e.target.style, { borderColor: C.border, boxShadow: 'none' })} /></FG>
          <FG label="预计结束日期"><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            style={inpBase} onFocus={e => Object.assign(e.target.style, inpFocus)}
            onBlur={e => Object.assign(e.target.style, { borderColor: C.border, boxShadow: 'none' })} /></FG>
        </Row2>
        <Row2>
          <FG label="供应商"><Inp value={supplier} onChange={setSupplier} placeholder="供应商名称" /></FG>
          <FG label="预计营收"><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="金额（元）"
            style={inpBase} onFocus={e => Object.assign(e.target.style, inpFocus)}
            onBlur={e => Object.assign(e.target.style, { borderColor: C.border, boxShadow: 'none' })} /></FG>
        </Row2>

        {/* ══ 补充信息 ══ */}
        <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginTop: 6, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          补充信息
        </div>
        <Row2>
          <FG label="风险评估"><Inp value={risk} onChange={setRisk} placeholder="风险描述（可选）" /></FG>
          <FG label="进展解读"><Inp value={summary} onChange={setSummary} placeholder="项目进展（可选）" /></FG>
        </Row2>

        {/* ══ 里程碑 ══ */}
        <Section icon="🎯" title="里程碑计划（可选）" count={mss.length}>
          {mss.map((m, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 110px 62px 24px', gap: 8,
              marginBottom: 6, alignItems: 'center' }}>
              <Inp value={m.stage} onChange={v => upMs(i, 'stage', v)} placeholder="阶段" />
              <Inp value={m.milestone} onChange={v => upMs(i, 'milestone', v)} placeholder="里程碑名称" />
              <input type="date" value={m.plannedDate} onChange={e => upMs(i, 'plannedDate', e.target.value)}
                style={inpBase} onFocus={e => Object.assign(e.target.style, inpFocus)}
                onBlur={e => Object.assign(e.target.style, { borderColor: C.border, boxShadow: 'none' })} />
              <select style={{ ...selStyle, fontSize: 11, padding: '4px 4px' }} value={m.status}
                onChange={e => upMs(i, 'status', e.target.value)}>
                <option value="未完成">未完成</option>
                <option value="已完成">已完成</option>
              </select>
              <DeleteOutlined onClick={() => rmMs(i)}
                style={{ color: C.red, cursor: 'pointer', fontSize: 14, justifySelf: 'center' }} />
            </div>
          ))}
          {mss.length < 6 && (
            <button onClick={addMs} style={{ width: '100%', padding: '7px', borderRadius: 6,
              border: `1px dashed ${C.border}`, background: 'transparent', color: C.muted,
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
              <PlusOutlined /> 添加里程碑
            </button>
          )}
        </Section>

        {/* ══ 团队 ══ */}
        <Section icon="👥" title="项目团队（可选）" count={tms.length}>
          {tms.map((t, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 90px 80px 24px', gap: 8,
              marginBottom: 6, alignItems: 'center' }}>
              <Inp value={t.name} onChange={v => upTm(i, 'name', v)} placeholder="姓名" />
              <Inp value={t.role} onChange={v => upTm(i, 'role', v)} placeholder="职务" />
              <Inp value={t.dept} onChange={v => upTm(i, 'dept', v)} placeholder="部门" />
              <select style={{ ...selStyle, fontSize: 11, padding: '4px 4px' }} value={t.responsibility}
                onChange={e => upTm(i, 'responsibility', e.target.value)}>
                <option value="">--</option>
                <option value="R">R 负责</option>
                <option value="As">As 辅助</option>
                <option value="I">I 通知</option>
                <option value="Ap">Ap 审批</option>
              </select>
              <DeleteOutlined onClick={() => rmTm(i)}
                style={{ color: C.red, cursor: 'pointer', fontSize: 14, justifySelf: 'center' }} />
            </div>
          ))}
          <button onClick={addTm} style={{ width: '100%', padding: '7px', borderRadius: 6,
            border: `1px dashed ${C.border}`, background: 'transparent', color: C.muted,
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
            <PlusOutlined /> 添加成员
          </button>
        </Section>
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '14px 28px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={() => onClose()}
          style={{ padding: '8px 22px', borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent',
            color: C.sub, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
          取消
        </button>
        <button onClick={save} disabled={saving}
          style={{ padding: '8px 28px', borderRadius: 7, border: 'none', background: C.accent, color: '#fff',
            fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 500 }}>
          {saving ? '保存中...' : editProject ? '保存修改' : '创建项目'}
        </button>
      </div>
    </Modal>
  );
}

/* ──── 自动补全输入 ──── */
function AutocompleteInput({ value, onChange, placeholder, pool }: {
  value: string; onChange: (v: string) => void; placeholder: string; pool: string[];
}) {
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState(false);
  const list = useMemo(
    () => pool.filter(n => n.toLowerCase().includes(value.toLowerCase())).slice(0, 6),
    [value, pool],
  );

  return (
    <div style={{ position: 'relative' }}
      onFocus={() => { setFocus(true); setShow(true); }}
      onBlur={e => {
        if (!(e.relatedTarget as HTMLElement)?.closest('.ac-dd')) { setFocus(false); setShow(false); }
      }}>
      <input
        style={{ ...inpBase, ...(focus ? inpFocus : {}) }}
        value={value}
        onChange={e => { onChange(e.target.value); setShow(true); }}
        placeholder={placeholder}
      />
      {show && list.length > 0 && (
        <div className="ac-dd" style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1100,
          background: C.inputBg, border: `1px solid ${C.borderF}`, borderRadius: '0 0 7px 7px',
          maxHeight: 180, overflowY: 'auto', boxShadow: '0 8px 28px rgba(0,0,0,0.6)',
        }}>
          {list.map(n => (
            <div key={n} onMouseDown={() => { onChange(n); setShow(false); }}
              style={{ padding: '8px 12px', fontSize: 13, color: C.text, cursor: 'pointer',
                borderBottom: `1px solid ${C.border}` }}
              onMouseEnter={e => e.currentTarget.style.background = C.accentBg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {n}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
