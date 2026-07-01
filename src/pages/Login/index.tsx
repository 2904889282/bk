import { useState, useEffect } from 'react';
import { Input, Button, Checkbox, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import RegisterForm from './RegisterForm';

export default function LoginPage() {
  const [username, setUsername] = useState(localStorage.getItem('remembered_username') || '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(!!localStorage.getItem('remembered_username'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const login = useAuth(s => s.login);
  const isLoggedIn = useAuth(s => s.isLoggedIn);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { if (isLoggedIn) navigate('/', { replace: true }); }, [isLoggedIn, navigate]);

  const doLogin = async () => {
    setError('');
    if (!username.trim()) { setError('请输入用户名'); triggerShake(); return; }
    if (password.length < 6) { setError('密码至少 6 位'); triggerShake(); return; }
    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);
    if (result.success) {
      if (remember) localStorage.setItem('remembered_username', username);
      else localStorage.removeItem('remembered_username');
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
      children: (
        <div style={{ opacity: activeTab === 'login' ? 1 : 0, transition: 'opacity 0.2s' }}>
          {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: 8, borderRadius: 8, marginBottom: 16, fontSize: 13, textAlign: 'center' }}>{error}</div>}
          <div className={shake ? 'shake' : ''}>
            <Input size="large" prefix={<UserOutlined />} placeholder="用户名" value={username}
              onChange={e => setUsername(e.target.value)} style={{ marginBottom: 16 }}
              onPressEnter={doLogin} autoComplete="username" />
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="密码（至少6位）" value={password}
              onChange={e => setPassword(e.target.value)} style={{ marginBottom: 16 }}
              onPressEnter={doLogin} autoComplete="current-password" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Checkbox checked={remember} onChange={e => setRemember(e.target.checked)}>记住用户名</Checkbox>
            <a style={{ fontSize: 13, color: '#6366f1' }} onClick={() => message.info('请联系管理员重置密码')}>忘记密码？</a>
          </div>
          <Button type="primary" size="large" block loading={loading} onClick={doLogin}>登 录</Button>
          <p style={{ textAlign: 'center', marginTop: 20, color: '#999', fontSize: 12, lineHeight: 1.8 }}>
            管理员: admin / 123456<br />部门经理: zhangming / 123456<br />普通员工: employee / 123456
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
