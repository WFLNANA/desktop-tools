
// 格式化字节
export function formatBytes(bytes?: number): string {
  if (!bytes && bytes !== 0) return '--';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(1)} ${units[index]}`;
}

// 格式化频率
export function formatFrequency(mhz?: number): string {
  if (!mhz && mhz !== 0) return '--';
  if (mhz >= 1000) {
    return `${(mhz / 1000).toFixed(2)} GHz`;
  }
  return `${mhz.toFixed(0)} MHz`;
}

// 格式化时间 (秒 -> X天X小时X分)
export function formatUptime(seconds?: number): string {
  if (!seconds && seconds !== 0) return '--';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}天 ${hours}小时 ${minutes}分`;
  if (hours > 0) return `${hours}小时 ${minutes}分`;
  return `${minutes}分`;
}
