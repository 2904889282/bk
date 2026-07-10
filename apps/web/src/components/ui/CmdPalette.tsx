import { useState, useEffect, useCallback } from 'react';
import { Input, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export interface CmdAction {
  id: string;
  label: string;
  desc: string;
  keywords?: string;
  action: () => void;
}

interface CmdPaletteProps {
  actions: CmdAction[];
  open: boolean;
  onClose: () => void;
  onSearchChange?: (q: string) => void;
}

export default function CmdPalette({ actions, open, onClose, onSearchChange }: CmdPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = query
    ? actions.filter(a =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.desc.toLowerCase().includes(query.toLowerCase()) ||
        (a.keywords || '').toLowerCase().includes(query.toLowerCase())
      )
    : actions;

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, filtered.length - 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); return; }
    if (e.key === 'Enter' && filtered[activeIndex]) {
      e.preventDefault();
      filtered[activeIndex].action();
      onClose();
    }
  }, [filtered, activeIndex, onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else onClose(); // toggle via parent
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '15vh',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 520, maxWidth: '90vw',
          background: 'var(--color-surface)', borderRadius: 12,
          border: '1px solid var(--color-border-el)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
        }}
      >
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--color-text-tertiary)' }} />}
          placeholder="搜索命令、页面或线索..."
          value={query}
          onChange={e => { setQuery(e.target.value); onSearchChange?.(e.target.value); }}
          onKeyDown={handleKey}
          autoFocus
          bordered={false}
          size="large"
          style={{
            fontSize: 15, padding: '14px 16px',
            borderBottom: '1px solid var(--color-border-light)',
            color: 'var(--color-text-primary)',
          }}
        />
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: 4 }}>
          {filtered.map((a, i) => (
            <div
              key={a.id}
              onClick={() => { a.action(); onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 16px', borderRadius: 8,
                cursor: 'pointer', fontSize: 13,
                background: i === activeIndex ? 'var(--color-brand-soft)' : 'transparent',
                color: i === activeIndex ? 'var(--color-brand)' : 'var(--color-text-primary)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span style={{ flex: 1 }}>{a.label}</span>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>{a.desc}</Typography.Text>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
              无匹配结果
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** 生成导航类命令 */
export function useCmdActions(overrides?: Partial<Record<string, () => void>>): CmdAction[] {
  const navigate = useNavigate();
  return [
    { id: 'dashboard', label: '工作台', desc: '首页门户', action: () => navigate('/') },
    { id: 'leads-list', label: '线索列表', desc: '全部线索', action: () => navigate('/ltc/leads') },
    { id: 'ltc-kanban', label: '线索看板', desc: 'Kanban 视图', action: () => navigate('/ltc/kanban') },
    { id: 'ltc-analysis', label: '统计分析', desc: '线索分析', action: () => navigate('/ltc/analysis') },
    { id: 'ltc-alerts', label: '预警中心', desc: '预警与评审', action: () => navigate('/ltc/alerts') },
    { id: 'pm-projects', label: '项目管理', desc: '项目列表', action: () => navigate('/pm/projects') },
    ...(overrides?.new ? [{ id: 'new-lead', label: '新建线索', desc: '创建线索', action: overrides.new }] : []),
  ];
}
