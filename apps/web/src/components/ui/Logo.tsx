import { useTheme } from '../../store/useTheme';

interface Props {
  size?: number;
  showText?: boolean;
  onClick?: () => void;
  /** 强制亮色主题（用于登录页左侧蓝色背景） */
  forceLight?: boolean;
}

export default function Logo({ size = 32, showText = true, onClick, forceLight = false }: Props) {
  const isDark = useTheme(s => s.isDark);
  const textColor = forceLight ? '#ffffff' : (isDark ? '#f1f5f9' : '#0f172a');
  const accent = forceLight ? '#93c5fd' : (isDark ? '#60a5fa' : '#2563eb');
  const shell = forceLight ? '#7dd3fc' : (isDark ? '#38bdf8' : '#3b82f6');
  const gradientStart = forceLight ? 'rgba(255,255,255,0.15)' : (isDark ? '#1e3a5f' : '#dbeafe');
  const gradientEnd = forceLight ? 'rgba(255,255,255,0.05)' : (isDark ? '#0f2744' : '#eff6ff');
  const gradId = `shell-gradient-${size}-${forceLight ? 'light' : 'dark'}`;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: size * 0.375,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <path
          d="M24 4C14.5 4 7 10.5 5.5 18C4.2 24.5 8 30 12 33L12 34C12 38.5 15.5 42 20 42C23.5 42 26.5 40 28.5 37C30.5 40 33.5 42 37 42C41.5 42 45 38.5 44.5 34L44 33C48 30 46 24 43 18C39 12 32.5 4 24 4Z"
          fill={`url(#${gradId})`}
          stroke={shell}
          strokeWidth="2.5"
        />
        <path d="M12 18C13 15 15 12 24 12" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <path d="M10 26C12 22 17 19 24 19" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.45" />
        <path d="M14 22C15 20.5 19 18 24 18" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
        <circle cx="24" cy="24" r="5" fill={accent} opacity="0.7" />
        <circle cx="24" cy="24" r="3" fill="white" opacity={forceLight ? 0.95 : 0.8} />
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradientStart} />
            <stop offset="100%" stopColor={gradientEnd} />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span style={{ fontSize: size * 0.5, fontWeight: 700, letterSpacing: '-0.01em', color: textColor, whiteSpace: 'nowrap' }}>
          贝壳管理平台
        </span>
      )}
    </div>
  );
}
