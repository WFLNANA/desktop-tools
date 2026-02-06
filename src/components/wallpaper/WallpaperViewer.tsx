import React, { useEffect, useState } from 'react';
import {
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  RotateRightOutlined,
  RotateLeftOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import { message, Spin } from 'antd';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { readFile } from '@tauri-apps/plugin-fs';
import { useWallpaperStore } from './store';
import styles from './viewer.module.scss';

export const WallpaperViewer: React.FC = () => {
  const {
    previewVisible,
    previewList,
    previewIndex,
    closePreview,
    setPreviewIndex,
  } = useWallpaperStore();

  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [loading, setLoading] = useState(true);

  const currentWallpaper = previewList[previewIndex];

  // Reset state and load image when index changes
  useEffect(() => {
    setScale(1);
    setRotate(0);
    setLoading(true);
    
    if (currentWallpaper) {
      if (currentWallpaper.source === 'local' && currentWallpaper.path) {
        setImgSrc(convertFileSrc(currentWallpaper.path));
      } else {
        setImgSrc(currentWallpaper.url);
      }
    }
  }, [previewIndex, currentWallpaper]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewVisible) return;
      
      switch (e.key) {
        case 'Escape':
          closePreview();
          break;
        case 'ArrowLeft':
          handlePrev();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
        case '_':
          handleZoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewVisible, previewIndex]);

  if (!previewVisible || previewList.length === 0 || !currentWallpaper) return null;

  const handlePrev = () => {
    const newIndex = previewIndex > 0 ? previewIndex - 1 : previewList.length - 1;
    setPreviewIndex(newIndex);
  };

  const handleNext = () => {
    const newIndex = previewIndex < previewList.length - 1 ? previewIndex + 1 : 0;
    setPreviewIndex(newIndex);
  };

  const handleImageError = async () => {
    if (currentWallpaper.source === 'local' && currentWallpaper.path && !imgSrc.startsWith('blob:')) {
      try {
        const fileBytes = await readFile(currentWallpaper.path);
        const ext = currentWallpaper.path.split('.').pop()?.toLowerCase();
        let mime = 'image/jpeg';
        if (ext === 'png') mime = 'image/png';
        else if (ext === 'webp') mime = 'image/webp';
        else if (ext === 'gif') mime = 'image/gif';
        else if (ext === 'svg') mime = 'image/svg+xml';
        else if (ext === 'bmp') mime = 'image/bmp';
        
        const blob = new Blob([fileBytes], { type: mime });
        const url = URL.createObjectURL(blob);
        setImgSrc(url);
      } catch (e) {
        console.error('Fallback load failed:', e);
      }
    }
  };

  const handleZoomIn = () => setScale(s => Math.min(s + 0.2, 5));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.2, 0.2));
  const handleRotateLeft = () => setRotate(r => r - 90);
  const handleRotateRight = () => setRotate(r => r + 90);
  
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSetWallpaper = async () => {
    try {
      if (currentWallpaper.source === 'local' && currentWallpaper.path) {
        await invoke('set_local_wallpaper', {
          filePath: currentWallpaper.path,
          fitMode: 'fill',
          monitorId: null,
        });
        message.success('壁纸设置成功');
      } else {
        message.info('在线壁纸暂不支持直接设置，请先下载');
      }
    } catch (e) {
      console.error(e);
      message.error(`设置失败: ${e}`);
    }
  };

  const resolution = currentWallpaper.width && currentWallpaper.height 
    ? `${currentWallpaper.width} x ${currentWallpaper.height}` 
    : '';

  return (
    <div className={styles.viewerOverlay}>
      <div className={styles.topBar}>
        <div className={styles.info}>
          <span className={styles.title}>{currentWallpaper.title || 'Untitled'}</span>
          {resolution && <span className={styles.resolution}>{resolution}</span>}
          <span className={styles.counter}>{previewIndex + 1} / {previewList.length}</span>
        </div>
        <button className={styles.closeBtn} onClick={closePreview}>
          <CloseOutlined />
        </button>
      </div>

      <button className={`${styles.navBtn} ${styles.prev}`} onClick={handlePrev}>
        <LeftOutlined />
      </button>

      <div className={styles.mainArea} onClick={(e) => {
          if(e.target === e.currentTarget) closePreview();
      }}>
        <div 
          className={styles.imageContainer}
          style={{
            transform: `scale(${scale}) rotate(${rotate}deg)`,
            transition: 'transform 0.3s ease',
          }}
        >
          {loading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}>
              <Spin size="large" />
            </div>
          )}
          <img 
              src={imgSrc} 
              alt={currentWallpaper.title}
              onError={() => {
                handleImageError();
                setLoading(false);
              }}
              onLoad={() => setLoading(false)}
              style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  objectFit: 'contain',
                  pointerEvents: 'auto',
                  opacity: loading ? 0 : 1,
                  transition: 'opacity 0.3s ease'
              }} 
          />
        </div>
      </div>

      <button className={`${styles.navBtn} ${styles.next}`} onClick={handleNext}>
        <RightOutlined />
      </button>

      <div className={styles.toolbar}>
        <button onClick={handleZoomOut} title="缩小"><ZoomOutOutlined /></button>
        <button onClick={handleZoomIn} title="放大"><ZoomInOutlined /></button>
        <button onClick={handleRotateLeft} title="向左旋转"><RotateLeftOutlined /></button>
        <button onClick={handleRotateRight} title="向右旋转"><RotateRightOutlined /></button>
        <button onClick={handleFullscreen} title="全屏">
          {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
        </button>
        <button onClick={handleSetWallpaper} title="设为壁纸"><DesktopOutlined /></button>
      </div>
    </div>
  );
};
