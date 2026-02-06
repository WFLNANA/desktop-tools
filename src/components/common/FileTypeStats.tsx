import { Empty } from 'antd';
import type { FileCategoryStats } from '../../stores/resourceStore';

interface FileTypeStatsProps {
  stats: FileCategoryStats[];
  formatFileSize: (bytes: number) => string;
}

export function FileTypeStats({ stats, formatFileSize }: FileTypeStatsProps) {
  return (
    <div className="file-type-stats">
      {stats.length === 0 ? (
        <Empty
          description="暂无文件统计"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ marginTop: '60px' }}
        />
      ) : (
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.category} className="stat-card">
              <div className="stat-icon-wrapper">
                <span className="stat-icon">{stat.icon}</span>
              </div>
              <div className="stat-content">
                <div className="stat-header">
                  <span className="stat-type">{stat.category}</span>
                  <span className="stat-percentage">{stat.percentage}%</span>
                </div>
                <div className="stat-info">
                  <span className="stat-count">{stat.count.toLocaleString()} 个文件</span>
                  <span className="stat-separator">·</span>
                  <span className="stat-size">{formatFileSize(stat.totalSize)}</span>
                </div>
                <div className="stat-progress">
                  <div
                    className="stat-progress-bar"
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
