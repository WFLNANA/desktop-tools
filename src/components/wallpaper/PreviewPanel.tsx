import React from 'react';
import { Button, message } from 'antd';
import { DesktopOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useWallpaperStore } from './store';
import { LocalImage } from './LocalImage';
import styles from './styles.module.scss';

export const PreviewPanel: React.FC = () => {
  const { selectedWallpaper, removeLocalWallpaper } = useWallpaperStore();

  if (!selectedWallpaper) {
    return (
      <div
        className={styles.previewPanel}
        style={{ alignItems: 'center', justifyContent: 'center', color: '#999' }}
      >
        <InfoCircleOutlined style={{ fontSize: 24, marginBottom: 8 }} />
        <div>选择一张壁纸查看详情</div>
      </div>
    );
  }

  const handleSetWallpaper = async () => {
    try {
      if (selectedWallpaper.source === 'local' && selectedWallpaper.path) {
        await invoke('set_local_wallpaper', {
          filePath: selectedWallpaper.path,
          fitMode: 'fill',
          monitorId: null,
        });
        message.success('壁纸设置成功');
      } else {
        message.info('在线壁纸请先下载');
      }
    } catch (e) {
      console.error(e);
      message.error(`设置失败: ${e}`);
    }
  };

  const handleDelete = () => {
    if (selectedWallpaper.source === 'local') {
      removeLocalWallpaper(selectedWallpaper.id);
      message.success('已移除');
    }
  };

  return (
    <div className={styles.previewPanel}>
      {selectedWallpaper.source === 'local' && selectedWallpaper.path ? (
        <LocalImage path={selectedWallpaper.path} title={selectedWallpaper.title} />
      ) : (
        <img src={selectedWallpaper.url} alt={selectedWallpaper.title} />
      )}

      <h3>{selectedWallpaper.title}</h3>

      <div className={styles.previewInfo}>
        <div className={styles.infoItem}>
          <label>类型</label>
          <span>{selectedWallpaper.source === 'local' ? '本地' : '在线'}</span>
        </div>
        {selectedWallpaper.width && (
          <div className={styles.infoItem}>
            <label>分辨率</label>
            <span>
              {selectedWallpaper.width} x {selectedWallpaper.height}
            </span>
          </div>
        )}
        {selectedWallpaper.size && (
          <div className={styles.infoItem}>
            <label>大小</label>
            <span>{(selectedWallpaper.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        )}
        {selectedWallpaper.path && (
          <div className={styles.infoItem} style={{ flexDirection: 'column', border: 'none' }}>
            <label>路径</label>
            <span style={{ wordBreak: 'break-all', marginTop: 4 }}>{selectedWallpaper.path}</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Button type="primary" icon={<DesktopOutlined />} block onClick={handleSetWallpaper}>
          设为壁纸
        </Button>
        {selectedWallpaper.source === 'local' && (
          <Button danger icon={<DeleteOutlined />} block onClick={handleDelete}>
            移除
          </Button>
        )}
      </div>
    </div>
  );
};
