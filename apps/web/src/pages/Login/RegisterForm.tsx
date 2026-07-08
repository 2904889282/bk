import { useState, useEffect } from 'react';
import { Input, Button, Checkbox, Progress, Select, Divider, Space, App } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import request from '../../utils/request';
import { fetchDeptList, type DeptOption } from '../../api/dept';
import AgreementModal from './AgreementModal';

interface Props { onSuccess: () => void; onBack: () => void; }

const PWD_RULES = [
  { re: /.{6,}/, label: '至少 6 位' },
  { re: /[a-zA-Z]/, label: '含字母' },
  { re: /\d/, label: '含数字' },
  { re: /[!@#$%^&*]/, label: '含特殊字符' },
];

// 默认部门（后端不可用时降级使用）
const DEFAULT_DEPTS: DeptOption[] = [
  { id: 1, name: '平台一部' },
  { id: 2, name: '平台二部' },
  { id: 3, name: '平台三部' },
];

const ERR_COLOR = '#fca5a5';
const SUB_COLOR = 'rgba(226,232,240,0.55)';

function getPwdStrength(pwd: string) {
  const score = PWD_RULES.filter(r => r.re.test(pwd)).length;
  if (score <= 1) return { level: '弱', color: '#f87171', pct: 25 };
  if (score <= 2) return { level: '中', color: '#fbbf24', pct: 50 };
  if (score <= 3) return { level: '强', color: '#34d399', pct: 75 };
  return { level: '很强', color: '#34d399', pct: 100 };
}

export default function RegisterForm({ onSuccess, onBack }: Props) {
  const { message } = App.useApp();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [depts, setDepts] = useState<DeptOption[]>(DEFAULT_DEPTS);
  const [deptId, setDeptId] = useState<number | undefined>(undefined);
  const [deptName, setDeptName] = useState<string>('');        // 自定义部门名（选中已有部门时为空）
  const [customInput, setCustomInput] = useState('');          // 下拉自定义输入框临时值
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState(0);
  const [agreementType, setAgreementType] = useState<'terms' | 'privacy' | null>(null);

  const strength = getPwdStrength(password);

  // 动态加载部门列表（后端不可用时降级默认 + localStorage 自定义部门）
  useEffect(() => {
    fetchDeptList()
      .then(list => {
        if (list && list.length) setDepts(list);
      })
      .catch(() => {
        try {
          const custom = JSON.parse(localStorage.getItem('beike_custom_depts') || '[]') as string[];
          if (custom.length) {
            setDepts(prev => {
              const names = new Set(prev.map(d => d.name));
              const merged = [...prev];
              custom.forEach((name, i) => {
                if (!names.has(name)) merged.push({ id: -1 - i, name });
              });
              return merged;
            });
          }
        } catch { /* ignore */ }
      });
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = '请输入用户名';
    else if (username.trim().length < 3) e.username = '用户名至少 3 位';
    if (!email.trim()) e.email = '请输入绑定邮箱';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = '邮箱格式不正确';
    if (password.length < 6) e.password = '密码至少 6 位';
    if (password !== confirmPwd) e.confirmPwd = '两次密码不一致';
    if (!agreed) e.agreed = '请同意用户协议';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      try {
        await request.post('/api/auth/register', {
          username: username.trim(),
          realName: username.trim(),
          email: email.trim(),
          password,
          confirmPassword: confirmPwd,
          deptId: deptId != null && deptId > 0 ? deptId : null,
          deptName: deptName.trim() || null,
        });
      } catch {
        // 后端不可用时降级
        const users = JSON.parse(localStorage.getItem('beike_registered_users') || '[]');
        if (users.find((u: { username: string }) => u.username === username.trim())) {
          message.error('用户名已存在'); setLoading(false); return;
        }
        const finalDept = deptName.trim() || depts.find(d => d.id === deptId)?.name || '';
        users.push({
          username: username.trim(), email: email.trim(), password,
          createdAt: new Date().toISOString(),
          deptId: deptId != null && deptId > 0 ? deptId : null,
          deptName: deptName.trim() || null,
          dept: finalDept,
        });
        localStorage.setItem('beike_registered_users', JSON.stringify(users));
        // 自定义部门降级保存，便于用户管理 / 人才池同步展示
        if (deptName.trim()) {
          try {
            const custom = JSON.parse(localStorage.getItem('beike_custom_depts') || '[]') as string[];
            if (!custom.includes(deptName.trim())) {
              custom.push(deptName.trim());
              localStorage.setItem('beike_custom_depts', JSON.stringify(custom));
            }
          } catch { /* ignore */ }
        }
      }
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(timer); onSuccess(); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg || '注册失败';
      message.error(msg);
    }
    setLoading(false);
  };

  if (countdown > 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: 44, marginBottom: 14, filter: 'drop-shadow(0 6px 18px rgba(52,211,153,0.4))' }}>✅</div>
        <div className="auth-title" style={{ fontSize: 18, color: '#f1f5f9' }}>注册成功</div>
        <div style={{ color: SUB_COLOR, marginTop: 8, fontSize: 13 }}>{countdown} 秒后跳转到登录</div>
      </div>
    );
  }

  // 部门下拉统一 value：已有部门用 id 字符串，自定义部门用 'custom:' 前缀
  const deptValue = deptName ? 'custom:' + deptName : (deptId != null ? String(deptId) : undefined);
  const deptOptions = [
    ...depts.map(d => ({ value: String(d.id), label: d.name })),
    ...(deptName ? [{ value: 'custom:' + deptName, label: deptName + '（新部门）' }] : []),
  ];

  const errStyle = { color: ERR_COLOR, fontSize: 12, marginBottom: 8, marginTop: -4 } as const;

  return (
    <div style={{ opacity: 1, transition: 'opacity 0.2s' }}>
      {/* 返回按钮 */}
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack}
        style={{ padding: 0, marginBottom: 18, color: 'rgba(226,232,240,0.6)', height: 32 }}>
        返回登录
      </Button>

      <Input prefix={<UserOutlined />} placeholder="用户名（至少3位）" value={username}
        onChange={e => { setUsername(e.target.value); setErrors(p => ({ ...p, username: '' })); }}
        status={errors.username ? 'error' : undefined} style={{ marginBottom: 16 }} />
      {errors.username && <div style={errStyle}>{errors.username}</div>}

      <Select
        placeholder="选择或自定义部门"
        value={deptValue}
        onChange={(v: string) => {
          if (typeof v === 'string' && v.startsWith('custom:')) {
            setDeptName(v.slice(7));
            setDeptId(undefined);
          } else {
            setDeptId(Number(v));
            setDeptName('');
          }
        }}
        options={deptOptions}
        style={{ width: '100%', marginBottom: 16 }}
        optionFilterProp="label"
        showSearch
        popupClassName="auth-dropdown"
        dropdownRender={(menu) => (
          <>
            {menu}
            <Divider style={{ margin: '8px 0' }} />
            <Space style={{ padding: '0 8px 4px', width: '100%' }}>
              <Input
                placeholder="输入新部门名称"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => e.stopPropagation()}
              />
              <Button
                type="text"
                icon={<PlusOutlined />}
                onClick={() => {
                  const v = customInput.trim();
                  if (!v) { message.warning('请输入部门名称'); return; }
                  setDeptName(v);
                  setDeptId(undefined);
                  setCustomInput('');
                }}
              >
                添加
              </Button>
            </Space>
          </>
        )}
      />

      <Input prefix={<MailOutlined />} placeholder="绑定邮箱（用于找回密码）" value={email}
        onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
        status={errors.email ? 'error' : undefined} style={{ marginBottom: 8 }} />
      {errors.email && <div style={errStyle}>{errors.email}</div>}

      <Input.Password prefix={<LockOutlined />} placeholder="密码（至少6位）" value={password}
        onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
        status={errors.password ? 'error' : undefined} style={{ marginBottom: 16 }} />
      {errors.password && <div style={errStyle}>{errors.password}</div>}
      {password && (
        <div style={{ marginBottom: 16 }}>
          <Progress percent={strength.pct} showInfo={false} strokeColor={strength.color} size="small" />
          <span style={{ fontSize: 12, color: strength.color }}>密码强度: {strength.level}</span>
        </div>
      )}

      <Input.Password prefix={<LockOutlined />} placeholder="确认密码" value={confirmPwd}
        onChange={e => { setConfirmPwd(e.target.value); setErrors(p => ({ ...p, confirmPwd: '' })); }}
        status={errors.confirmPwd ? 'error' : undefined} style={{ marginBottom: 16 }} />
      {errors.confirmPwd && <div style={errStyle}>{errors.confirmPwd}</div>}

      <Checkbox checked={agreed} onChange={e => { setAgreed(e.target.checked); setErrors(p => ({ ...p, agreed: '' })); }} style={{ marginBottom: 8 }}>
        已阅读并同意
        <a className="auth-link" onClick={() => setAgreementType('terms')}>《用户协议》</a>
      </Checkbox>
      {errors.agreed && <div style={errStyle}>{errors.agreed}</div>}

      <Button className="auth-btn" block loading={loading} onClick={handleRegister}>注 册</Button>
      <p style={{ textAlign: 'center', color: 'rgba(226,232,240,0.4)', fontSize: 12, marginTop: 16 }}>注册即默认绑定普通员工角色</p>

      <AgreementModal open={!!agreementType} type={agreementType!} onClose={() => setAgreementType(null)} />
    </div>
  );
}
