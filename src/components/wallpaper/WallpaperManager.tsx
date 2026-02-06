/*
 * @Author       : wfl
 * @LastEditors  : wfl
 * @description  : 
 * @updateInfo   : 
 * @Date         : 2026-01-26 16:21:55
 * @LastEditTime : 2026-02-03 14:54:47
 */
import React from 'react';
import { LocalGallery } from './LocalGallery';
import { OnlineGallery } from './OnlineGallery';
import { WallpaperViewer } from './WallpaperViewer';
import { useWallpaperStore } from './store';
import { PictureOutlined, CloudOutlined } from '@ant-design/icons';
import styles from './styles.module.scss';

export const WallpaperManager: React.FC = () => {
  const { activeTab, setActiveTab } = useWallpaperStore();

  return (
    <div className={styles.container}>
      <div className={styles.topNav}>
        <div 
          className={`${styles.navItem} ${activeTab === 'local' ? styles.active : ''}`}
          onClick={() => setActiveTab('local')}
        >
          <PictureOutlined />
          <span>本地壁纸</span>
        </div>
        <div 
          className={`${styles.navItem} ${activeTab === 'online' ? styles.active : ''}`}
          onClick={() => setActiveTab('online')}
        >
          <CloudOutlined />
          <span>壁纸站</span>
        </div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.mainArea}>
            {activeTab === 'local' ? <LocalGallery /> : <OnlineGallery />}
        </div>
      </div>
      <WallpaperViewer />
    </div>
  );
};
