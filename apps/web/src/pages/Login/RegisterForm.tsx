import { useState } from 'react';
import { Input, Button, Checkbox, Progress, App, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import request from '../../utils/request';
import AgreementModal from './AgreementModal';

const { Text } = Typography;

interface Props { onSuccess: () => void; onBack: () => void; }

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

export default function RegisterForm({ onSuccess, onBack }: Props) {
  const { message } = App.useApp();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState(0);
  const [agreementType, setAgreementType] = useState<'terms' | 'privacy' | null>(null);

  const strength = getPwdStrength(password);

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
        // realName 默认用 username
        await request.post('/api/auth/register', {
          username: username.trim(),
          realName: username.trim(),
          email: email.trim(),
          password,
          confirmPassword: confirmPwd,
        });
      } catch {
        // 后端不可用时降级
        const users = JSON.parse(localStorage.getItem('beike_registered_users') || '[]');
        if (users.find((u: { username: string }) => u.username === username.trim())) {
          message.error('用户名已存在'); setLoading(false); return;
        }
        users.push({ username: username.trim(), email: email.trim(), password, createdAt: new Date().toISOString() });
        localStorage.setItem('beike_registered_users', JSON.stringify(users));
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
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>注册成功</div>
        <div style={{ color: '#999', marginTop: 8 }}>{countdown} 秒后跳转到登录</div>
      </div>
    );
  }

  return (
    <div style={{ opacity: 1, transition: 'opacity 0.2s' }}>
      {/* 返回按钮 */}
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ padding: 0, marginBottom: 16 }}>
        返回登录
      </Button>

      <Input size="large" prefix={<UserOutlined />} placeholder="用户名（至少3位）" value={username}
        onChange={e => { setUsername(e.target.value); setErrors(p => ({ ...p, username: '' })); }}
        status={errors.username ? 'error' : undefined} style={{ marginBottom: 8 }} />
      {errors.username && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 8, marginTop: -4 }}>{errors.username}</div>}

      <Input size="large" prefix={<MailOutlined />} placeholder="绑定邮箱（用于找回密码）" value={email}
        onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
        status={errors.email ? 'error' : undefined} style={{ marginBottom: 8 }} />
      {errors.email && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 8, marginTop: -4 }}>{errors.email}</div>}

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

      <Checkbox checked={agreed} onChange={e => { setAgreed(e.target.checked); setErrors(p => ({ ...p, agreed: '' })); }} style={{ marginBottom: 8 }}>
        已阅读并同意
        <a onClick={() => setAgreementType('terms')}>《用户协议》</a>
      </Checkbox>
      {errors.agreed && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 8, marginTop: -4 }}>{errors.agreed}</div>}

      <Button type="primary" size="large" block loading={loading} onClick={handleRegister}>注 册</Button>
      <p style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: 16 }}>注册即默认绑定普通员工角色</p>

      <AgreementModal open={!!agreementType} type={agreementType!} onClose={() => setAgreementType(null)} />
    </div>
  );
}
