import { useState } from 'react';
import { Input, Button, Checkbox, Progress, message } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import { registerApi } from '../../api/auth';

interface Props { onSuccess: () => void; }

const PWD_RULES = [
  { re: /.{6,}/, label: '至少 6 位' },
  { re: /[a-zA-Z]/, label: '含字母' },
  { re: /\d/, label: '含数字' },
  { re: /[!@#$%^&*]/, label: '含特殊字符' },
];

function getPwdStrength(pwd: string) {
  const score = PWD_RULES.filter(r => r.re.test(pwd)).length;
  if (score <= 1) return { level: '弱', color: '#ef4444', pct: 25 };
  if (score <= 2) return { level: '中', color: '#f59e0b', pct: 50 };
  if (score <= 3) return { level: '强', color: '#10b981', pct: 75 };
  return { level: '很强', color: '#10b981', pct: 100 };
}

export default function RegisterForm({ onSuccess }: Props) {
  const [username, setUsername] = useState('');
  const [realName, setRealName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState(0);

  const strength = getPwdStrength(password);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = '请输入用户名';
    else if (username.trim().length < 3) e.username = '用户名至少 3 位';
    if (!realName.trim()) e.realName = '请输入姓名';
    if (phone && !/^1\d{10}$/.test(phone)) e.phone = '手机号格式不正确';
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
      await registerApi({ username: username.trim(), password, realName: realName.trim() });
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(timer); onSuccess(); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const msg = (err as Error).message || '注册失败';
      message.error(msg);
    }
    setLoading(false);
  };

  if (countdown > 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>注册成功</div>
        <div style={{ color: '#999', marginTop: 8 }}>{countdown} 秒后跳转到登录</div>
      </div>
    );
  }

  return (
    <div style={{ opacity: 1, transition: 'opacity 0.2s' }}>
      <Input size="large" prefix={<UserOutlined />} placeholder="用户名（至少3位）" value={username}
        onChange={e => { setUsername(e.target.value); setErrors(p => ({ ...p, username: '' })); }}
        status={errors.username ? 'error' : undefined} style={{ marginBottom: 8 }} />
      {errors.username && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 8, marginTop: -4 }}>{errors.username}</div>}

      <Input size="large" prefix={<IdcardOutlined />} placeholder="真实姓名" value={realName}
        onChange={e => { setRealName(e.target.value); setErrors(p => ({ ...p, realName: '' })); }}
        status={errors.realName ? 'error' : undefined} style={{ marginBottom: 8 }} />
      {errors.realName && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 8, marginTop: -4 }}>{errors.realName}</div>}

      <Input size="large" prefix={<PhoneOutlined />} placeholder="手机号（选填）" value={phone}
        onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })); }}
        status={errors.phone ? 'error' : undefined} style={{ marginBottom: 8 }} />
      {errors.phone && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 8, marginTop: -4 }}>{errors.phone}</div>}

      <Input.Password size="large" prefix={<LockOutlined />} placeholder="密码（至少6位）" value={password}
        onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
        status={errors.password ? 'error' : undefined} style={{ marginBottom: password ? 8 : 16 }} />
      {errors.password && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 8, marginTop: -4 }}>{errors.password}</div>}
      {password && (
        <div style={{ marginBottom: 16 }}>
          <Progress percent={strength.pct} showInfo={false} strokeColor={strength.color} size="small" />
          <span style={{ fontSize: 12, color: strength.color }}>密码强度: {strength.level}</span>
        </div>
      )}

      <Input.Password size="large" prefix={<LockOutlined />} placeholder="确认密码" value={confirmPwd}
        onChange={e => { setConfirmPwd(e.target.value); setErrors(p => ({ ...p, confirmPwd: '' })); }}
        status={errors.confirmPwd ? 'error' : undefined} style={{ marginBottom: 8 }} />
      {errors.confirmPwd && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 8, marginTop: -4 }}>{errors.confirmPwd}</div>}

      <Checkbox checked={agreed} onChange={e => { setAgreed(e.target.checked); setErrors(p => ({ ...p, agreed: '' })); }}
        style={{ marginBottom: 8 }}>
        已阅读并同意<span style={{ color: '#6366f1' }}>《用户协议》</span>
      </Checkbox>
      {errors.agreed && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 8, marginTop: -4 }}>{errors.agreed}</div>}

      <Button type="primary" size="large" block loading={loading} onClick={handleRegister}>注 册</Button>
      <p style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: 16 }}>注册即默认绑定普通员工角色</p>
    </div>
  );
}
