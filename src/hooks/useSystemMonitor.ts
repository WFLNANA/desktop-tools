import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSmartInterval } from './useSmartInterval';

export interface SystemInfo {
  cpu: {
    usage: number;
    // ... other fields
  };
  memory: {
    usage: number;
    used: number;
    total: number;
  };
  gpu: {
    name: string;
    usage: number;
    temperature: number;
  }[];
  networks: {
    name: string;
    received: number;
    transmitted: number;
  }[];
}

export const useSystemMonitor = (interval = 2000) => {
  const [data, setData] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const info = await invoke<SystemInfo>('get_system_info');
      setData(info);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch system info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useSmartInterval(fetchData, interval);

  return { data, loading, refresh: async () => {
    try {
        const info = await invoke<SystemInfo>('get_system_info');
        setData(info);
    } catch (error) {
        console.error('Failed to fetch system info:', error);
    }
  }};
};
