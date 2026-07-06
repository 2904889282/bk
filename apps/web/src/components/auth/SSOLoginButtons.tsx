import React, { useEffect, useState } from 'react';
import { Button, Divider, Space, message } from 'antd';
import { WechatOutlined, DingdingOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';

interface Props { onLoginStart?: () => void; }

export default function SSOLoginButtons({ onLoginStart }: Props) {
  const [ssoUrls, setSsoUrls] = useState<{ wecom?: string; dingtalk?: string }>({});

  useEffect(() => {
    fetch('/api/auth/sso/urls')
      .then(r => r.json())
      .then(setSsoUrls)
      .catch(() => {});
  }, []);

  const handleSSO = (url: string | undefined, provider: string) => {
    if (!url) { message.warning(`${provider} 未配置`); return; }
    onLoginStart?.();
    // 新窗口打开 SSO 授权页面
    const popup = window.open(url, `${provider}-login`, 'width=600,height=700');
    // 监听回调
    const interval = setInterval(() => {
      try {
        if (!popup || popup.closed) { clearInterval(interval); return; }
        const popupUrl = popup.location.href;
        if (popupUrl.includes('code=')) {
          const params = new URLSearchParams(popupUrl.split('?')[1]);
          const code = params.get('code');
          if (code) {
            clearInterval(interval);
            popup.close();
            handleCallback(provider, code);
          }
        }
      } catch { /* cross-origin, skip */ }
    }, 500);
  };

  const handleCallback = async (provider: string, code: string) => {
    try {
      const endpoint = provider === 'wecom' ? '/api/auth/sso/wecom/callback' : '/api/auth/sso/dingtalk/callback';
      const res = await fetch(`${endpoint}?code=${encodeURIComponent(code)}`);
      if (!res.ok) throw new Error('SSO 登录失败');
      const data = await res.json();
      localStorage.setItem('beike_token', data.token);
      window.location.href = '/';
    } catch {
      message.error(`${provider} 登录失败`);
    }
  };

  const hasAny = ssoUrls.wecom || ssoUrls.dingtalk;
  if (!hasAny) return null;

  return (
    <>
      <Divider plain style={{ fontSize: 13, color: '#999' }}>第三方登录</Divider>
      <Space orientation="vertical" style={{ width: '100%' }} size={12}>
        {ssoUrls.wecom && (
          <Button icon={<WechatOutlined />} size="large" block
            style={{ background: '#07c160', color: '#fff', borderColor: '#07c160' }}
            onClick={() => handleSSO(ssoUrls.wecom, 'wecom')}>
            企业微信登录
          </Button>
        )}
        {ssoUrls.dingtalk && (
          <Button icon={<DingdingOutlined />} size="large" block
            style={{ background: '#1677ff', color: '#fff', borderColor: '#1677ff' }}
            onClick={() => handleSSO(ssoUrls.dingtalk, 'dingtalk')}>
            钉钉登录
          </Button>
        )}
      </Space>
    </>
  );
}
