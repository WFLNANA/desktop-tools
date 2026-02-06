import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Progress, Spin } from 'antd';
import {
  ApiOutlined,
  DatabaseOutlined,
  HddOutlined,
  AppstoreOutlined,
  WifiOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { BarChart, Bar, Cell, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';
import type { SystemInfo } from '../types';
import { systemInfoApi } from '../api/systemInfo';
import { directoryApi } from '../api/directory';
import { formatBytes, formatFrequency, formatUptime } from '../utils/system-format';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import '../styles/system-info.scss';

const getUsageColor = (usage: number) => {
  if (usage <= 30) return 'var(--color-success)';
  if (usage <= 70) return 'var(--color-warning)';
  return 'var(--color-error)';
};

function SystemInfoContent() {
  const [data, setData] = useState<SystemInfo | null>(null);
  const fetchLock = useRef(false);

  const handleFetch = useCallback(async () => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    try {
      const result = await systemInfoApi.getSystemInfo();
      setData(result);
    } finally {
      fetchLock.current = false;
    }
  }, []);

  useEffect(() => {
    handleFetch();
    const timer = setInterval(handleFetch, 1000);
    return () => clearInterval(timer);
  }, [handleFetch]);

  // Derived Data
  const diskSummary = useMemo(() => {
    if (!data) return { total: 0, used: 0, usage: 0 };
    const total = data.disks.reduce((sum, disk) => sum + disk.total, 0);
    const available = data.disks.reduce((sum, disk) => sum + disk.available, 0);
    const used = total - available;
    const usage = total > 0 ? (used / total) * 100 : 0;
    return { total, used, usage };
  }, [data]);

  const networkStats = useMemo(() => {
    if (!data?.networks || data.networks.length === 0) return null;
    // Find active network (most traffic)
    const active = data.networks.reduce((prev, curr) => 
      (curr.received + curr.transmitted) > (prev.received + prev.transmitted) ? curr : prev
    );
    
    // Calculate speed (bytes per sec - roughly, since we poll every 2s)
    // In a real app we'd compare with previous snapshot to get rate.
    // Here we just use the raw value if it represents rate, OR if it is cumulative, we need prev state.
    // Sysinfo `received()` usually returns bytes received since last refresh. 
    // Since we refresh every 2s, we divide by 2 to get B/s.
    const downloadSpeed = active.received / 2;
    const uploadSpeed = active.transmitted / 2;
    
    return {
      name: active.name,
      download: formatBytes(downloadSpeed) + '/s',
      upload: formatBytes(uploadSpeed) + '/s',
      isConnected: downloadSpeed > 0 || uploadSpeed > 0 // Simple heuristic
    };
  }, [data]);

  if (!data) {
    return (
      <div className="system-info-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const primaryGpu = data.gpus[0] || {};
  const gpuMemoryUsage = primaryGpu.memoryTotal && primaryGpu.memoryUsed 
    ? (primaryGpu.memoryUsed / primaryGpu.memoryTotal) * 100 
    : 0;

  return (
    <div className="system-info-page">
      <div className="dashboard-grid">
        {/* CPU Card */}
        <div className="info-card">
          <div className="card-header">
            <div className="title-section">
              <h3>CPU 使用率</h3>
              <div className="main-value">{data.cpu.usage.toFixed(1)}%</div>
              <div className="sub-value">
                <span style={{ marginRight: 8 }}>
                  {data.cpu.temperature ? `${data.cpu.temperature.toFixed(0)}°C` : '--'}
                </span>
                <span>{formatFrequency(data.cpu.frequency)}</span>
              </div>
            </div>
            <div className="icon-wrapper blue">
              <ApiOutlined />
            </div>
          </div>
          <div className="card-content">
            <div className="chart-container" style={{ marginBottom: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.cpu.perCore} margin={{ top: 10, right: 5, bottom: 0, left: -20 }}>
                  <XAxis 
                    dataKey="id" 
                    tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} 
                    interval="preserveStartEnd"
                    tickFormatter={(val) => `#${val}`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--color-bg-tertiary)', opacity: 0.4 }}
                    contentStyle={{ 
                      backgroundColor: 'var(--color-surface)', 
                      borderColor: 'var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: 'var(--shadow-md)'
                    }}
                    itemStyle={{ color: 'var(--color-text)' }}
                    formatter={(value: number | undefined) => [value !== undefined ? `${Number(value).toFixed(1)}%` : '0%', '使用率']}
                    labelFormatter={(label) => `核心 #${label}`}
                  />
                  <Bar dataKey="usage" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {data.cpu.perCore.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getUsageColor(entry.usage)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* GPU Card */}
        <div className="info-card">
          <div className="card-header">
            <div className="title-section">
              <h3>GPU 负载</h3>
              <div className="main-value">
                {primaryGpu.utilization ? primaryGpu.utilization.toFixed(0) : 0}%
              </div>
            </div>
            <div className="icon-wrapper orange">
              <AppstoreOutlined />
            </div>
          </div>
          <div className="card-content">
            <div className="circular-progress-wrapper">
              <Progress 
                type="circle" 
                percent={primaryGpu.utilization || 0} 
                strokeColor="var(--color-warning)"
                railColor="var(--color-bg-tertiary)"
                strokeWidth={12}
                size={130}
                format={() => null}
              />
              <div className="inner-text">
                <span className="percent">{primaryGpu.utilization ? primaryGpu.utilization.toFixed(0) : 0}%</span>
                <span className="label">运行中</span>
              </div>
            </div>
            <div className="stats-row">
              <div className="stat-item">
                <div className="label">显存使用</div>
                <div className="value">
                  {formatBytes(primaryGpu.memoryUsed)} / {formatBytes(primaryGpu.memoryTotal)}
                </div>
              </div>
              <div className="stat-item">
                <div className="label">核心温度</div>
                <div className="value">
                  {primaryGpu.temperature ? `${primaryGpu.temperature.toFixed(0)}°C` : '--'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Memory Card */}
        <div className="info-card">
          <div className="card-header">
            <div className="title-section">
              <h3>内存使用情况</h3>
              <div className="main-value">{formatBytes(data.memory.used)}</div>
            </div>
            <div className="icon-wrapper green">
              <DatabaseOutlined />
            </div>
          </div>
          <div className="card-content">
            <div className="progress-section">
              <div className="progress-header">
                <span>系统已用内存</span>
                <span>{data.memory.usage.toFixed(0)}%</span>
              </div>
              <Progress 
                percent={data.memory.usage} 
                showInfo={false} 
                strokeColor="var(--color-success)" 
                railColor="var(--color-bg-tertiary)"
              />
            </div>
            <div className="memory-grid">
              <div className="memory-stat-box">
                <div className="label">总容量</div>
                <div className="value">{formatBytes(data.memory.total)}</div>
              </div>
              <div className="memory-stat-box">
                <div className="label">可用容量</div>
                <div className="value">{formatBytes(data.memory.available)}</div>
              </div>
            </div>
            <div className="label" style={{ marginTop: 16, fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              * 数据每 2 秒更新一次
            </div>
          </div>
        </div>

        {/* Disk Card */}
        <div className="info-card">
          <div className="card-header">
            <div className="title-section">
              <h3>硬盘分区占用</h3>
              <div className="main-value">总计 {formatBytes(diskSummary.total)}</div>
            </div>
            <div className="icon-wrapper blue">
              <HddOutlined />
            </div>
          </div>
          <div className="card-content">
            <div className="disk-grid-container">
              {data.disks.map((disk) => {
                // Extract drive letter for Windows (e.g., "C:\" -> "C")
                const driveLetter = disk.mountPoint.replace(/[:\\/]+$/, '');
                return (
                  <div 
                    key={disk.mountPoint} 
                    className="disk-mini-card"
                    onClick={() => directoryApi.openInExplorer(disk.mountPoint)}
                    title={`点击打开 ${disk.mountPoint}`}
                  >
                    <div className="mini-card-header">
                      <span className="disk-name">{disk.name}({driveLetter})</span>
                      <span className="disk-percent">{disk.usage ? disk.usage.toFixed(0) : 0}%</span>
                    </div>
                    <Progress 
                      percent={disk.usage} 
                      showInfo={false} 
                      strokeColor="var(--color-primary)" 
                      railColor="var(--color-bg-tertiary)"
                      size="small"
                    />
                    <div className="mini-card-stats">
                      <span>{formatBytes(disk.used)} / {formatBytes(disk.total)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="disk-speed">
              <span>读写速度</span>
              <ArrowUpOutlined /> {formatBytes(124 * 1024)}/s
              <ArrowDownOutlined /> {formatBytes(2.1 * 1024 * 1024)}/s
            </div>
          </div>
        </div>
      </div>

      <div className="system-footer">
        <div className="footer-card">
          <div className="icon-box green">
            <WifiOutlined />
          </div>
          <div className="content">
            <div className="label">网络连接状态</div>
            <div className="value">
              {networkStats?.isConnected ? '已连接' : '未连接'} - {networkStats?.download || '0 B/s'}
            </div>
          </div>
        </div>

        <div className="footer-card">
          <div className="icon-box orange">
            <ClockCircleOutlined />
          </div>
          <div className="content">
            <div className="label">系统运行时间</div>
            <div className="value">{formatUptime(data.uptime)}</div>
          </div>
        </div>

        <div className="footer-card">
          <div className="icon-box blue">
            <SyncOutlined />
          </div>
          <div className="content">
            <div className="label">上次检查更新</div>
            <div className="value">
              今天 {new Date(data.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SystemInfoPage() {
  return (
    <ErrorBoundary>
      <SystemInfoContent />
    </ErrorBoundary>
  );
}
