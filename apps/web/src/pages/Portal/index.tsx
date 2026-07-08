import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../store/useTheme';
import { Button, Typography, Space, App, Tooltip } from 'antd';
import { LogoutOutlined, SunOutlined, MoonOutlined, ThunderboltOutlined, ProjectOutlined } from '@ant-design/icons';
import Logo from '../../components/ui/Logo';
import { useEffect, useState } from 'react';

const { Title, Text } = Typography;

export default function PortalPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { modal } = App.useApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  return (
    <div style={{
      minHeight: '100dvh',
      background: isDark
        ? 'linear-gradient(135deg, #0a0f1a 0%, #0f1b2d 30%, #111d32 60%, #0d1117 100%)'
        : 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 30%, #f5f7fb 60%, #eef2ff 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'inherit',
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: '-20%', left: '-10%',
          width: '60%', height: '80%',
          background: 'radial-gradient(ellipse, rgba(37,99,235,0.08) 0%, transparent 70%)',
          animation: 'portalFloat1 12s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-15%', right: '-5%',
          width: '50%', height: '70%',
          background: 'radial-gradient(ellipse, rgba(16,185,129,0.06) 0%, transparent 70%)',
          animation: 'portalFloat2 14s ease-in-out infinite',
        }} />
      </div>

      {/* 顶部工具栏 */}
      <div style={{
        position: 'absolute', top: 24, right: 28, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 13 }}>
          {user?.name}
        </Text>
        <Tooltip title={isDark ? '亮色模式' : '暗色模式'}>
          <Button type="text" icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            style={{ color: isDark ? '#94a3b8' : '#64748b' }} />
        </Tooltip>
        <Tooltip title="退出登录">
          <Button type="text" icon={<LogoutOutlined />}
            onClick={() => modal.confirm({
              title: '确认退出', content: '退出后需要重新登录',
              okText: '退出', cancelText: '取消', okButtonProps: { danger: true },
              onOk: () => { logout(); navigate('/login', { replace: true }); },
            })}
            style={{ color: isDark ? '#94a3b8' : '#64748b' }} />
        </Tooltip>
      </div>

      {/* 标题 */}
      <div style={{
        textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <Logo size={44} />
        </div>
        <Text style={{
          fontSize: 16, color: isDark ? '#64748b' : '#94a3b8',
          display: 'block', marginTop: 8,
        }}>
          选择进入业务模块
        </Text>
      </div>

      {/* 双卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 32,
        maxWidth: 960,
        width: '100%',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* 线索板块 */}
        <CardEntry
          visible={visible}
          delay={0}
          icon={<ThunderboltOutlined style={{ fontSize: 40 }} />}
          title="线索板块"
          subtitle="LTC · Lead to Cash"
          description="线索登记、跟进评审、商机转化全流程管理"
          accent="#3b82f6"
          accentLabel="线索攻坚战"
          isDark={isDark}
          onClick={() => navigate('/ltc/kanban')}
        />

        {/* 项目板块 */}
        <CardEntry
          visible={visible}
          delay={150}
          icon={<ProjectOutlined style={{ fontSize: 40 }} />}
          title="项目板块"
          subtitle="PM · Project Management"
          description="项目进度、风险管理、人才协同与交付追踪"
          accent="#10b981"
          accentLabel="项目一体化"
          isDark={isDark}
          onClick={() => navigate('/pm/kanban')}
        />
      </div>

      {/* 动效 keyframes */}
      <style>{`
        @keyframes portalFloat1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px,-20px) scale(1.05); }
          66% { transform: translate(-15px,10px) scale(0.98); }
        }
        @keyframes portalFloat2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-25px,-15px) scale(1.04); }
        }
      `}</style>
    </div>
  );
}

/** 入口卡片 */
function CardEntry({
  visible, delay, icon, title, subtitle, description, accent, accentLabel, isDark, onClick,
}: {
  visible: boolean; delay: number; icon: React.ReactNode;
  title: string; subtitle: string; description: string;
  accent: string; accentLabel: string; isDark: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        padding: '40px 36px',
        borderRadius: 20,
        cursor: 'pointer',
        overflow: 'hidden',
        boxShadow: isDark
          ? '0 4px 24px rgba(0,0,0,0.3)'
          : '0 4px 24px rgba(0,0,0,0.06)',
        background: isDark
          ? 'linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)'
          : 'linear-gradient(160deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
        backdropFilter: 'blur(12px)',
        border: isDark
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid rgba(0,0,0,0.06)',
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translateY(0) scale(1)'
          : `translateY(24px) scale(0.97)`,
        transition: `
          opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms,
          transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms,
          box-shadow 0.35s ease,
          transform 0.35s ease,
          border-color 0.35s ease
        `,
        transitionProperty: 'opacity, transform, box-shadow, border-color',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
        e.currentTarget.style.boxShadow = `0 8px 40px ${accent}20, 0 0 60px ${accent}10`;
        e.currentTarget.style.borderColor = `${accent}40`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = isDark
          ? '0 4px 24px rgba(0,0,0,0.3)'
          : '0 4px 24px rgba(0,0,0,0.06)';
        e.currentTarget.style.borderColor = isDark
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(0,0,0,0.06)';
      }}
    >
      {/* 发光条 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 3,
        background: `linear-gradient(90deg, ${accent}, ${accent}80)`,
        borderRadius: '3px 3px 0 0',
      }} />

      {/* 图标 */}
      <div style={{
        width: 64, height: 64,
        borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${accent}14`,
        color: accent,
        marginBottom: 24,
      }}>
        {icon}
      </div>

      {/* 标签 */}
      <div style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        background: `${accent}18`,
        color: accent,
        marginBottom: 12,
      }}>
        {accentLabel}
      </div>

      {/* 标题 */}
      <Title level={2} style={{
        fontSize: 24, fontWeight: 700, margin: '0 0 4px',
        color: isDark ? '#f1f5f9' : '#0f172a',
      }}>
        {title}
      </Title>

      {/* 副标题 */}
      <Text style={{
        fontSize: 13, fontWeight: 600, letterSpacing: '0.05em',
        color: accent, display: 'block', marginBottom: 12,
      }}>
        {subtitle}
      </Text>

      {/* 描述 */}
      <Text style={{
        fontSize: 14, lineHeight: 1.7,
        color: isDark ? '#94a3b8' : '#64748b',
      }}>
        {description}
      </Text>

      {/* 进入按钮 */}
      <div style={{ marginTop: 28 }}>
        <Space>
          <span style={{
            fontSize: 14, fontWeight: 600, color: accent,
          }}>
            进入模块
          </span>
          <span style={{
            fontSize: 16, color: accent,
            transition: 'transform 0.3s ease',
            display: 'inline-block' as const,
          }}>
            →
          </span>
        </Space>
      </div>
    </div>
  );
}
