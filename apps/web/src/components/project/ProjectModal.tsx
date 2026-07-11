/**
 * 新增/编辑项目 Modal (规范 §3.11)
 * 2列布局 + 自动补全 + Linear暗色设计
 */
import { useState, useEffect, useMemo } from 'react';
import { Modal, App } from 'antd';
import { createProject, updateProject, fetchProjectPage, type ProjectVO, type ProjectSaveDTO } from '../../api/project';

const T = { s1:'#0f1011', s2:'#141516', hl:'#23252a', hls:'#34343a', ink:'#f7f8f8', ink2:'#d0d6e0', ink3:'#8a8f98', ink4:'#757880', p:'#5e6ad2' };

const inputStyle: React.CSSProperties = {
  width:'100%', background:T.s2, border:`1px solid ${T.hl}`, borderRadius:6, padding:'7px 10px',
  fontSize:13, color:T.ink, fontFamily:'inherit', outline:'none',
};
const labelStyle: React.CSSProperties = { fontSize:11, fontWeight:500, color:T.ink3, textTransform:'uppercase', letterSpacing:'0.3px', marginBottom:4 };

interface Props { open: boolean; editProject?: ProjectVO | null; onClose: (saved?:boolean) => void; }

export default function ProjectModal({ open, editProject, onClose }: Props) {
  const { message } = App.useApp();
  const [name, setName] = useState('');
  const [manager, setManager] = useState('');
  const [deliveryMgr, setDeliveryMgr] = useState('');
  const [productMgr, setProductMgr] = useState('');
  const [dept, setDept] = useState('');
  const [rating, setRating] = useState('B');
  const [status, setStatus] = useState('进行中');
  const [month, setMonth] = useState(() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contact, setContact] = useState('');
  const [supplier, setSupplier] = useState('');
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState('');
  const [clientInfo, setClientInfo] = useState('');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [risk, setRisk] = useState('');
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);

  /* 自动补全人员列表 */
  const [peoplePool, setPeoplePool] = useState<string[]>([]);
  useEffect(() => {
    fetchProjectPage({pageNum:1,pageSize:200}).then(res => {
      const names = new Set<string>();
      (res.records||[]).forEach(p => { if(p.projectManager) names.add(p.projectManager); if(p.deliveryManager) names.add(p.deliveryManager); if(p.productManager) names.add(p.productManager); });
      setPeoplePool(Array.from(names).sort());
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!open) return;
    if (editProject) {
      const p = editProject;
      setName(p.projectName||''); setManager(p.projectManager||''); setDeliveryMgr(p.deliveryManager||'');
      setProductMgr(p.productManager||''); setDept(p.deptBelong||''); setRating(p.projectLevel||'B');
      setStatus(p.projectStatus||'进行中'); setContact(p.clientContact||''); setSupplier(p.supplier||'');
      setAmount(String(p.projectAmount||'')); setCode(p.projectNumber||''); setRisk(p.riskAssessment||'');
      setSummary(p.description||''); setStartDate(p.startDate||''); setEndDate(p.expectEndDate||'');
    } else {
      setName(''); setManager(''); setDeliveryMgr(''); setProductMgr(''); setDept(''); setRating('B');
      setStatus('进行中'); setContact(''); setSupplier(''); setAmount(''); setCode(''); setRisk('');
      setSummary(''); setClientInfo(''); setGoalName(''); setGoalTarget(''); setStartDate(''); setEndDate('');
      const d=new Date(); setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
    }
  }, [open, editProject]);

  const handleSave = async () => {
    if (!name.trim() || !manager.trim()) { message.error('项目名称和一条龙经理为必填'); return; }
    setSaving(true);
    try {
      const dto: any = { projectName:name, projectManager:manager, projectLevel:rating, projectStatus:status,
        deptBelong:dept, deliveryManager:deliveryMgr, productManager:productMgr,
        projectAmount: Number(amount)||0, projectNumber:code, clientContact:contact, supplier,
        startDate: startDate||undefined, expectEndDate: endDate||undefined,
        riskAssessment:risk, description:summary };
      if (editProject) { await updateProject(editProject.id, dto); message.success('已更新'); }
      else { await createProject(dto); message.success('已创建'); }
      onClose(true);
    } catch { message.error('保存失败'); }
    finally { setSaving(false); }
  };

  const acInput = (value: string, onChange: (v:string)=>void, placeholder: string) => (
    <AutocompleteInput value={value} onChange={onChange} placeholder={placeholder} pool={peoplePool} />
  );

  return (
    <Modal title={null} open={open} onCancel={() => onClose()} footer={null} width={640} closable={false} styles={{body:{padding:0},content:{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12}}}>
      <div style={{padding:'20px 24px',borderBottom:`1px solid ${T.hl}`,fontSize:16,fontWeight:600,color:T.ink}}>
        {editProject ? '编辑项目' : '新增项目'}
      </div>
      <div style={{padding:'20px 24px',maxHeight:'65vh',overflowY:'auto'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
          <FG label="项目名称 *"><input style={inputStyle} value={name} onChange={e=>setName(e.target.value)} placeholder="输入项目名称" /></FG>
          <FG label="项目编号"><input style={inputStyle} value={code} onChange={e=>setCode(e.target.value)} placeholder="自动生成" /></FG>
          <FG label="一条龙经理 *">{acInput(manager, setManager, '选择一条龙经理')}</FG>
          <FG label="评级"><select style={inputStyle} value={rating} onChange={e=>setRating(e.target.value)}><option>A</option><option>B</option><option>C</option></select></FG>
          <FG label="交付经理">{acInput(deliveryMgr, setDeliveryMgr, '选择交付经理')}</FG>
          <FG label="状态"><select style={inputStyle} value={status} onChange={e=>setStatus(e.target.value)}><option>进行中</option><option>正式执行</option><option>已完成</option><option>暂停</option><option>终止</option></select></FG>
          <FG label="产品经理">{acInput(productMgr, setProductMgr, '选择产品经理')}</FG>
          <FG label="部门"><input style={inputStyle} value={dept} onChange={e=>setDept(e.target.value)} placeholder="如 平台一部" /></FG>
          <FG label="甲方对接人"><input style={inputStyle} value={contact} onChange={e=>setContact(e.target.value)} placeholder="客户方联系人" /></FG>
          <FG label="开始日期"><input style={inputStyle} value={startDate} onChange={e=>setStartDate(e.target.value)} placeholder="YYYY-MM-DD" /></FG>
          <FG label="供应商"><input style={inputStyle} value={supplier} onChange={e=>setSupplier(e.target.value)} placeholder="供应商" /></FG>
          <FG label="结束日期"><input style={inputStyle} value={endDate} onChange={e=>setEndDate(e.target.value)} placeholder="YYYY-MM-DD" /></FG>
          <FG label="预计营收"><input style={inputStyle} value={amount} onChange={e=>setAmount(e.target.value)} placeholder="金额" type="number" /></FG>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:8,marginTop:12}}>
          <FG label="风险评估"><input style={inputStyle} value={risk} onChange={e=>setRisk(e.target.value)} placeholder="风险描述" /></FG>
          <FG label="进展解读"><input style={inputStyle} value={summary} onChange={e=>setSummary(e.target.value)} placeholder="项目进展" /></FG>
        </div>
      </div>
      <div style={{padding:'16px 24px',borderTop:`1px solid ${T.hl}`,display:'flex',gap:8,justifyContent:'flex-end'}}>
        <button onClick={() => onClose()} style={{padding:'7px 18px',borderRadius:6,border:`1px solid ${T.hl}`,background:'transparent',color:T.ink3,fontSize:13,fontFamily:'inherit',cursor:'pointer'}}>取消</button>
        <button onClick={handleSave} disabled={saving} style={{padding:'7px 18px',borderRadius:6,border:'none',background:T.p,color:'#fff',fontSize:13,fontFamily:'inherit',cursor:'pointer',fontWeight:500}}>{saving?'保存中...':editProject?'保存':'创建'}</button>
      </div>
    </Modal>
  );
}

function FG({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:10}}><span style={labelStyle}>{label}</span>{children}</div>;
}

function AutocompleteInput({ value, onChange, placeholder, pool }: { value:string; onChange:(v:string)=>void; placeholder:string; pool:string[] }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const filtered = useMemo(() => pool.filter(n => n.toLowerCase().includes(value.toLowerCase())).slice(0,6), [value, pool]);

  return (
    <div style={{position:'relative'}} onFocus={() => {setFocused(true);setShow(true);}} onBlur={e => { if(!(e.relatedTarget as HTMLElement)?.closest('.ac-drop')) { setFocused(false);setShow(false); }}}>
      <input style={{...inputStyle, borderColor: focused?T.hls:T.hl}} value={value} onChange={e => {onChange(e.target.value);setShow(true);}} placeholder={placeholder} />
      {show && filtered.length > 0 && (
        <div className="ac-drop" style={{position:'absolute',top:'100%',left:0,right:0,zIndex:200,background:T.s1,border:`1px solid ${T.hls}`,borderRadius:6,maxHeight:180,overflowY:'auto',boxShadow:'0 8px 24px rgba(0,0,0,0.35)'}}>
          {filtered.map(n => (
            <div key={n} onMouseDown={() => {onChange(n);setShow(false);}} style={{padding:'8px 12px',fontSize:12,color:T.ink2,cursor:'pointer',borderBottom:`1px solid ${T.hl}`}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(94,106,210,0.12)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>{n}</div>
          ))}
        </div>
      )}
    </div>
  );
}
