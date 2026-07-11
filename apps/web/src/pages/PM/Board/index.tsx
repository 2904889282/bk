/**
 * 项目看板 — 三列拖拽 + 分组切换(状态/评级/部门)
 * 参考: 项目管理系统_完整规范文档.md §3.2
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProjectPage, updateProject, type ProjectVO } from '../../../api/project';
import { T, RATING, fmtMoney } from '../tokens';

const STATUS_COLORS: Record<string, string> = {
  '进行中': T.p, '正式执行': T.p, '已完成': T.ok, '暂停': T.warn, '终止': T.err,
};
const BOARD_STATUSES = ['进行中', '正式执行', '暂停', '已完成'];

export default function PMBoard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const [groupMode, setGroupMode] = useState<'status' | 'rating' | 'dept'>('status');
  const [draggedId, setDraggedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchProjectPage({ pageNum: 1, pageSize: 200 });
      setProjects(res.records || []);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  /* 拖拽 */
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    (e.currentTarget as HTMLElement).style.opacity = '0.35';
  };
  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDraggedId(null);
  };
  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedId) return;
    const p = projects.find(x => x.id === draggedId);
    if (!p || p.projectStatus === newStatus) return;
    try {
      await updateProject(draggedId, { projectStatus: newStatus } as any);
      setProjects(prev => prev.map(x => x.id === draggedId ? { ...x, projectStatus: newStatus } : x));
    } catch { /* ignore */ }
  };

  /* 分组 */
  const groups = useMemo(() => {
    const map = new Map<string, ProjectVO[]>();
    projects.forEach(p => {
      let key: string;
      switch (groupMode) {
        case 'rating': key = (p.projectLevel || 'C') + '级'; break;
        case 'dept': key = p.deptBelong || '未分配'; break;
        default: key = p.projectStatus || '其他'; break;
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    if (groupMode === 'status') {
      return BOARD_STATUSES.map(s => ({ key: s, items: map.get(s) || [] }));
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
  }, [projects, groupMode]);

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px', letterSpacing: '-0.3px', color: T.ink }}>项目看板</h2>
      <div style={{ fontSize: 12, color: T.ink4, marginBottom: 16 }}>
        拖拽卡片可改变项目状态 · 点击卡片查看详情
      </div>

      {/* 分组切换药丸 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[
          { k: 'status' as const, l: '按状态' },
          { k: 'rating' as const, l: '按评级' },
          { k: 'dept' as const, l: '按部门' },
        ].map(item => (
          <button key={item.k} onClick={() => setGroupMode(item.k)} style={{
            padding: '5px 14px', borderRadius: 999, border: 'none', fontFamily: 'inherit',
            fontSize: 12, cursor: 'pointer',
            background: groupMode === item.k ? T.s2 : T.s1,
            color: groupMode === item.k ? T.ink : T.ink3,
            fontWeight: groupMode === item.k ? 500 : 400,
          }}>
            {item.l}
          </button>
        ))}
      </div>

      {/* 看板列 */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 24, minHeight: 'calc(100vh - 280px)', paddingRight: 8 }}>
        {groups.map(group => (
          <div key={group.key} style={{ minWidth: 298, maxWidth: 298, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.outline = `1px dashed ${T.p}`; }}
            onDragLeave={e => { (e.currentTarget as HTMLElement).style.outline = 'none'; }}
            onDrop={e => {
              (e.currentTarget as HTMLElement).style.outline = 'none';
              if (groupMode === 'status') handleDrop(e, group.key);
            }}
          >
            {/* 列头 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
              background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 8,
              fontSize: 13, fontWeight: 600, color: T.ink,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[group.key] || T.p }} />
              {group.key}
              <span style={{ marginLeft: 'auto', fontSize: 10, color: T.ink4, background: T.s2, padding: '1px 7px', borderRadius: 999 }}>
                {group.items.length}
              </span>
            </div>

            {/* 卡片 */}
            {group.items.map(p => {
              const amount = Number(p.projectAmount);
              const progress = p.progress || 0;
              return (
                <div key={p.id} draggable
                  onDragStart={e => handleDragStart(e, p.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  style={{
                    background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 8, padding: 12,
                    borderLeft: `3px solid ${RATING[p.projectLevel] || T.ink4}`,
                    cursor: 'grab', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = T.hls;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = T.hl;
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  {/* 名称 */}
                  <div style={{ fontSize: 13, fontWeight: 500, color: T.ink, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.projectName}
                  </div>
                  {/* 元信息 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 11, color: T.ink4, flexWrap: 'wrap' }}>
                    <span>{p.projectManager || '-'}</span>
                    <span>·</span>
                    <span>{p.deptBelong || '-'}</span>
                    {amount > 0 && <span style={{ marginLeft: 'auto', color: T.ink2, fontWeight: 500 }}>{fmtMoney(amount)}</span>}
                  </div>
                  {/* 底部栏: 进度条 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 3, background: T.s2, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 2, width: `${progress}%`, background: T.p, transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 10, color: T.ink3 }}>{progress}%</span>
                  </div>
                </div>
              );
            })}
            {group.items.length === 0 && (
              <div style={{ padding: '20px 12px', textAlign: 'center', color: T.ink4, fontSize: 12, border: `1px dashed ${T.hl}`, borderRadius: 8, opacity: 0.6 }}>
                暂无项目
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
