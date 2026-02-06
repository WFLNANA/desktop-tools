/*
 * @Author       : wfl
 * @LastEditors  : wfl
 * @description  : 
 * @updateInfo   : 
 * @Date         : 2026-02-03 15:44:24
 * @LastEditTime : 2026-02-04 14:30:44
 */
import React from 'react';
import { Typography, Progress, Statistic, Row, Col } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { CardProps } from '../types';
import { useSystemMonitor } from '../../../hooks/useSystemMonitor';

const { Title, Text } = Typography;

export const MemoryCard = React.memo<CardProps>(() => {
  const { data } = useSystemMonitor();
  
  if (!data) return <div>加载中...</div>;

  const usedGB = (data.memory.used / 1024 / 1024 / 1024).toFixed(1);
  const totalGB = (data.memory.total / 1024 / 1024 / 1024).toFixed(1);

  return (
    <div style={{ padding: 10 }}>
      <Title level={5} style={{ color: 'inherit', fontSize: 'var(--card-font-size, 16px)', fontFamily: 'var(--card-font-family)' }}>内存监控</Title>
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <Progress type="dashboard" percent={Math.round(data.memory.usage)} size={80} format={(percent) => <span style={{ color: 'inherit', fontFamily: 'var(--card-font-family)' }}>{percent}%</span>} strokeColor="var(--ant-color-primary)" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Text style={{ color: 'inherit', opacity: 0.6, fontSize: 'calc(var(--card-font-size, 14px) * 0.9)', fontFamily: 'var(--card-font-family)' }}>已用: {usedGB} GB</Text>
        <Text style={{ color: 'inherit', opacity: 0.6, fontSize: 'calc(var(--card-font-size, 14px) * 0.9)', fontFamily: 'var(--card-font-family)' }}>总计: {totalGB} GB</Text>
      </div>
    </div>
  );
});

export const GpuCard = React.memo<CardProps>(() => {
  const { data } = useSystemMonitor();
  
  if (!data || !data.gpu || data.gpu.length === 0) return <div>未检测到GPU</div>;
  const gpu = data.gpu[0];

  return (
    <div style={{ padding: 10 }}>
       <Title level={5} style={{ color: 'inherit', fontSize: 'var(--card-font-size, 16px)', fontFamily: 'var(--card-font-family)' }}>GPU监控</Title>
       <Text strong style={{ color: 'inherit', fontSize: 'calc(var(--card-font-size, 14px) * 1.1)', fontFamily: 'var(--card-font-family)' }}>{gpu.name}</Text>
       <div style={{ marginTop: 10 }}>
         <Text style={{ color: 'inherit', fontSize: 'calc(var(--card-font-size, 14px) * 0.9)', fontFamily: 'var(--card-font-family)' }}>使用率</Text>
         <Progress percent={Math.round(gpu.usage || 0)} format={(percent) => <span style={{ color: 'inherit', fontFamily: 'var(--card-font-family)' }}>{percent}%</span>} strokeColor="var(--ant-color-primary)" />
       </div>
       <div style={{ marginTop: 5 }}>
         <Text style={{ color: 'inherit', fontSize: 'calc(var(--card-font-size, 14px) * 0.9)', fontFamily: 'var(--card-font-family)' }}>温度: {gpu.temperature || 'N/A'}°C</Text>
       </div>
    </div>
  );
});

export const NetworkCard = React.memo<CardProps>(({ size = 'medium' }) => {
  const { data, refresh } = useSystemMonitor(1000);
  
  if (!data || !data.networks) return <div>加载中...</div>;
  
  // Aggregate all interfaces or pick the active one
  // For simplicity, sum up
  const totalRx = data.networks.reduce((acc, net) => acc + net.received, 0);
  const totalTx = data.networks.reduce((acc, net) => acc + net.transmitted, 0);

  const formatSpeed = (bytes: number) => {
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB/s`;
    if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
    return `${bytes} B/s`;
  };

  const isSmall = size === 'small';

  return (
    <div style={{ padding: 10 }} onDoubleClick={refresh}>
      <Title level={5} style={{ color: 'inherit', fontSize: 'var(--card-font-size, 16px)', fontFamily: 'var(--card-font-family)' }}>网络速度</Title>
      <Row gutter={isSmall ? 0 : 16} style={{ marginTop: 20 }}>
        <Col span={isSmall ? 24 : 12} style={{ marginBottom: isSmall ? 10 : 0 }}>
          <Statistic 
            title="下载" 
            value={formatSpeed(totalRx)} 
            styles={{ 
              content: { color: '#3f8600', fontSize: 'var(--card-font-size, 18px)', fontFamily: 'var(--card-font-family)' },
              title: { color: 'inherit', opacity: 0.6, fontSize: 'calc(var(--card-font-size, 14px) * 0.9)', fontFamily: 'var(--card-font-family)' }
            }}
            prefix={<ArrowDownOutlined />} 
          />
        </Col>
        <Col span={isSmall ? 24 : 12}>
          <Statistic 
            title="上传" 
            value={formatSpeed(totalTx)} 
            styles={{ 
              content: { color: '#cf1322', fontSize: 'var(--card-font-size, 18px)', fontFamily: 'var(--card-font-family)' },
              title: { color: 'inherit', opacity: 0.6, fontSize: 'calc(var(--card-font-size, 14px) * 0.9)', fontFamily: 'var(--card-font-family)' }
            }}
            prefix={<ArrowUpOutlined />} 
          />
        </Col>
      </Row>
    </div>
  );
});
