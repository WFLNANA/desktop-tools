import React from 'react';
import { Button, Dropdown, MenuProps, message, Empty } from 'antd';
import {
  PlusOutlined,
  FolderOpenOutlined,
  FileImageOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { open } from '@tauri-apps/plugin-dialog';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { useWallpaperStore } from './store';
import { Wallpaper } from './types';
import styles from './styles.module.scss';

import { LocalImage } from './LocalImage';


export const LocalGallery: React.FC = () => {
  const {
    localWallpapers,
    addLocalWallpapers,
    removeLocalWallpaper,
    topLocalWallpaper,
    setSelectedWallpaper,
    selectedWallpaper,
    openPreview,
  } = useWallpaperStore();

  const handleAddFiles = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: 'Images',
            extensions: ['png', 'jpg', 'jpeg', 'bmp', 'webp', 'svg', 'gif'],
          },
        ],
      });

      if (selected && selected.length > 0) {
        // Handle string[] return type for multiple files
        const paths = Array.isArray(selected) ? selected : [selected];

        const newWallpapers: Wallpaper[] = paths.map((path) => {
          const name = path.split(/[\\/]/).pop() || 'Unknown';
          return {
            id: crypto.randomUUID(),
            url: convertFileSrc(path),
            path: path,
            title: name,
            source: 'local',
          };
        });
        addLocalWallpapers(newWallpapers);
        message.success(`已添加 ${newWallpapers.length} 张壁纸`);
      }
    } catch (err) {
      console.error(err);
      message.error('添加失败');
    }
  };

  const handleAddFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === 'string') {
        const result = await invoke<string>('import_wallpapers_from_directory', {
          directoryPath: selected,
        });
        const imported = JSON.parse(result);

        const newWallpapers: Wallpaper[] = imported.map((w: any) => ({
          id: w.id,
          url: convertFileSrc(w.file_path),
          path: w.file_path,
          title: w.name,
          source: 'local',
          width: w.width,
          height: w.height,
          size: w.file_size,
        }));

        addLocalWallpapers(newWallpapers);
        message.success(`已从目录添加 ${newWallpapers.length} 张壁纸`);
      }
    } catch (e) {
      console.error(e);
      message.error(`导入目录失败: ${e}`);
    }
  };

  const getMenuItems = (wallpaper: Wallpaper): MenuProps['items'] => [
    {
      key: 'set',
      label: '设为壁纸',
      icon: <FileImageOutlined />,
      onClick: async () => {
        if (wallpaper.path) {
          try {
            await invoke('set_local_wallpaper', {
              filePath: wallpaper.path,
              fitMode: 'fill',
              monitorId: null,
            });
            message.success('设置成功');
          } catch (e) {
            message.error('设置失败');
          }
        }
      },
    },
    {
      key: 'top',
      label: '置顶',
      onClick: () => topLocalWallpaper(wallpaper.id),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: '删除',
      danger: true,
      onClick: () => {
        removeLocalWallpaper(wallpaper.id);
      },
    },
  ];

  return (
    <div
      className={styles.container}
      style={{ flexDirection: 'column', height: '100%', background: 'transparent' }}
    >
      <div className={styles.toolbar}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddFiles}>
            添加图片
          </Button>
          <Button icon={<FolderOpenOutlined />} onClick={handleAddFolder}>
            导入目录
          </Button>
        </div>
        <span>共 {localWallpapers.length} 张</span>
      </div>

      {localWallpapers.length === 0 ? (
        <Empty description="暂无本地壁纸，请添加" style={{ marginTop: 100 }} />
      ) : (
        <div className={styles.masonry} style={{ marginTop: 16, flex: 1 }}>
          {localWallpapers.map((w, index) => (
            <div key={w.id} className={styles.masonryItem}>
              <Dropdown menu={{ items: getMenuItems(w) }} trigger={['contextMenu']}>
                <div
                  className={`${styles.card} ${selectedWallpaper?.id === w.id ? styles.active : ''}`}
                  onClick={() => openPreview(localWallpapers, index)}
                >
                  {selectedWallpaper?.id === w.id && (
                    <div className={styles.checkMark}>
                      <CheckCircleFilled />
                    </div>
                  )}
                  <LocalImage
                    path={w.path || ''}
                    title={w.title}
                    style={{ width: '100%' }}
                  />
                </div>
              </Dropdown>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
