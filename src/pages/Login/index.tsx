import { useState, useEffect } from 'react';
import { Input, Button, Checkbox, message, Tabs, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import RegisterForm from './RegisterForm';

// 简单的本地编码（非加密，仅防止明文存储）
const encode = (s: string) => btoa(encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, (_m, p) => String.fromCharCode(parseInt(p, 16))));
const decode = (s: string) => { try { return decodeURIComponent(Array.from(atob(s), c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')); } catch { return ''; } };

export default function LoginPage() {
  const savedUser = localStorage.getItem('rm_user') || '';
  const savedPass = localStorage.getItem('rm_pass') || '';
  const [username, setUsername] = useState(savedUser);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(!!savedUser);
  const [loading, setLoading] = useState(false);
  const [autoLogging, setAutoLogging] = useState(!!savedUser);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const login = useAuth(s => s.login);
  const isLoggedIn = useAuth(s => s.isLoggedIn);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { if (isLoggedIn) navigate('/', { replace: true }); }, [isLoggedIn, navigate]);

  // 自动登录
  useEffect(() => {
    if (!savedUser || !savedPass) { setAutoLogging(false); return; }
    (async () => {
      const result = await login(savedUser, decode(savedPass));
      if (result.success) {
        message.success('已自动登录');
      } else {
        setAutoLogging(false);
        setError('自动登录失败，请重新输入密码');
        setPassword('');
      }
    })();
  }, []);

  const doLogin = async () => {
    setError('');
    if (!username.trim()) { setError('请输入用户名'); triggerShake(); return; }
    if (password.length < 6) { setError('密码至少 6 位'); triggerShake(); return; }
    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);
    if (result.success) {
      if (remember) {
        localStorage.setItem('rm_user', username.trim());
        localStorage.setItem('rm_pass', encode(password));
      } else {
        localStorage.removeItem('rm_user');
        localStorage.removeItem('rm_pass');
      }
      message.success('登录成功');
      navigate((location.state as { from?: { pathname: string } })?.from?.pathname || '/', { replace: true });
    } else {
      setError(result.msg || '登录失败');
      triggerShake();
    }
  };

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const tabItems = [
    {
      key: 'login', label: '登录',
      children: autoLogging ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16, color: '#999' }}>正在自动登录...</p>
          <p style={{ marginTop: 12 }}>
            <Button type="link" size="small" onClick={() => { localStorage.removeItem('rm_user'); localStorage.removeItem('rm_pass'); setAutoLogging(false); setUsername(''); setPassword(''); }}>
              取消自动登录
            </Button>
          </p>
        </div>
      ) : (
        <div style={{ opacity: activeTab === 'login' ? 1 : 0, transition: 'opacity 0.2s' }}>
          {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: 8, borderRadius: 8, marginBottom: 16, fontSize: 13, textAlign: 'center' }}>{error}</div>}
          <div className={shake ? 'shake' : ''}>
            <Input size="large" prefix={<UserOutlined />} placeholder="用户名" value={username}
              onChange={e => setUsername(e.target.value)} style={{ marginBottom: 16 }}
              onPressEnter={doLogin} autoComplete="username" />
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="密码" value={password}
              onChange={e => setPassword(e.target.value)} style={{ marginBottom: 16 }}
              onPressEnter={doLogin} autoComplete="current-password" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Checkbox checked={remember} onChange={e => setRemember(e.target.checked)}>记住密码，下次自动登录</Checkbox>
            <a style={{ fontSize: 13, color: '#6366f1' }} onClick={() => message.info('请联系管理员重置密码')}>忘记密码？</a>
          </div>
          <Button type="primary" size="large" block loading={loading} onClick={doLogin}>登 录</Button>
          <p style={{ textAlign: 'center', marginTop: 20, color: '#999', fontSize: 12, lineHeight: 1.8 }}>
            管理员: admin / admin123<br />部门经理: zhangming / zm2026
          </p>
        </div>
      ),
    },
    {
      key: 'register', label: '注册',
      children: (
        <RegisterForm onSuccess={() => { setActiveTab('login'); message.success('注册成功，请登录'); }} />
      ),
    },
  ];

  return (
    <div className="login-container">
      <div className="login-card" style={{ minHeight: activeTab === 'register' ? 520 : 380, transition: 'min-height 0.3s ease' }}>
        <h1>贝壳统一管理平台 v4.0</h1>
        <p className="sub">LTC管线 · 重点项目一体化管理</p>
        <Tabs activeKey={activeTab} onChange={setActiveTab} centered size="large"
          items={tabItems}
          tabBarStyle={{ marginBottom: 8 }}
          style={{ transition: 'opacity 0.2s' }}
        />
      </div>
    </div>
  );
}
