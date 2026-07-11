/** 项目看板 — 三列拖拽(正式执行/暂停/已完成) + 分组切换(按状态/按评级/按部门) */
export default function PMBoard() {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 16px', letterSpacing: '-0.3px' }}>项目看板</h2>
      <div style={{ textAlign: 'center', padding: 80, color: '#757880', fontSize: 13 }}>
        ▦ 项目看板 — 即将实现<br />
        <span style={{ fontSize: 11, opacity: 0.5 }}>三列拖拽 / 分组切换(状态/评级/部门) / 卡片进度条+W1-W4指示器</span>
      </div>
    </div>
  );
}
