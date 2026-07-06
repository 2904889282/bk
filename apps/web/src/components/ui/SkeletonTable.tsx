import { Skeleton } from 'antd';

/** 表格骨架屏 - 列数、行数可配 */
export default function SkeletonTable({ columns = 6, rows = 8 }: { columns?: number; rows?: number }) {
  return (
    <div style={{ padding: '0 1px' }}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 12, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
          {Array.from({ length: columns }, (_, col) => (
            <Skeleton
              key={col}
              active
              paragraph={false}
              title={{ width: `${Math.floor(55 + Math.random() * 35)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
