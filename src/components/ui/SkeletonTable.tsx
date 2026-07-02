import { Skeleton } from 'antd';

/** 表格骨架屏 - 列数、行数可配 */
export default function SkeletonTable({ columns = 6, rows = 8 }: { columns?: number; rows?: number }) {
  return (
    <div style={{ padding: '0 1px' }}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton
          key={i}
          active
          paragraph={{ rows: 1, width: ['100%'] }}
          title={{ width: `${Math.floor(60 + Math.random() * 30)}%` }}
          style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}
        />
      ))}
    </div>
  );
}
