/**
 * 项目右键上下文菜单 (规范 §3.10)
 * 用于项目列表 / 看板中右键操作
 */
import { useEffect, useRef } from 'react';

const T = { s2: '#141516', hl: '#23252a', ink: '#f7f8f8', ink3: '#8a8f98', err: '#e05050' };

export interface ContextMenuAction {
  label: string; icon?: string; danger?: boolean; dividerAfter?: boolean;
  onClick: () => void;
}

interface Props {
  x: number; y: number; open: boolean; actions: ContextMenuAction[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, open, actions, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={ref} style={{
      position: 'fixed', zIndex: 500, left: x, top: y,
      minWidth: 170, background: T.s2, border: `1px solid ${T.hl}`, borderRadius: 8, padding: 4,
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    }}>
      {actions.map((a, i) => (
        <div key={i}>
          {a.dividerAfter && i > 0 && <div style={{ height: 1, background: T.hl, margin: '3px 8px' }} />}
          <div onClick={() => { a.onClick(); onClose(); }} style={{
            padding: '7px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
            color: a.danger ? T.err : T.ink3, display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.1s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = a.danger ? 'rgba(200,60,60,0.1)' : 'rgba(94,106,210,0.1)'; e.currentTarget.style.color = a.danger ? T.err : T.ink; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = a.danger ? T.err : T.ink3; }}>
            {a.icon && <span>{a.icon}</span>}
            {a.label}
          </div>
        </div>
      ))}
    </div>
  );
}
