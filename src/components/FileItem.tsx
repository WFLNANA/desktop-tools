import { useState } from 'react';
import { Button, Checkbox, Dropdown, message } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { convertFileSrc } from '@tauri-apps/api/core';
import { directoryApi } from '../api/directory';
import type { ResourceItem } from '../types';

interface FileItemProps {
  item: ResourceItem;
  viewMode: 'list' | 'medium' | 'large';
  isSelected: boolean;
  onSelect: (id: number, checked: boolean) => void;
  onToggleSelect: (id: number) => void;
  getFileIcon: (fileType: string) => string;
  formatFileSize: (bytes: number) => string;
}

export function FileItem({
  item,
  viewMode,
  isSelected,
  onSelect,
  onToggleSelect,
  getFileIcon,
  formatFileSize,
}: FileItemProps) {
  const [mediaError, setMediaError] = useState(false);

  const handleMenuClick = async (key: string) => {
    try {
      switch (key) {
        case 'open':
          await directoryApi.openInExplorer(item.file_path);
          break;
        case 'location':
          await directoryApi.openFileLocation(item.file_path);
          break;
        case 'copy':
          await navigator.clipboard.writeText(item.file_path);
          message.success('路径已复制到剪贴板');
          break;
      }
    } catch (error) {
      message.error('操作失败: ' + error);
    }
  };

  const menuItems = [
    {
      key: 'open',
      label: '打开文件',
    },
    {
      key: 'location',
      label: '打开所在位置',
    },
    {
      key: 'copy',
      label: '复制路径',
    },
  ];

  const isImageFile = (fileType: string) => {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    return imageTypes.includes(fileType.toLowerCase());
  };

  const isVideoFile = (fileType: string) => {
    const videoTypes = ['mp4', 'webm', 'ogg', 'avi', 'mov'];
    return videoTypes.includes(fileType.toLowerCase());
  };

  const assetUrl = convertFileSrc(item.file_path);

  // 列表视图
  if (viewMode === 'list') {
    return (
      <div className={`file-item file-item-list ${isSelected ? 'selected' : ''}`}>
        <Checkbox 
          checked={isSelected} 
          onChange={(e) => {
            e.stopPropagation();
            onSelect(item.id, e.target.checked);
          }} 
        />
        <div className="file-icon">{getFileIcon(item.file_type)}</div>
        <div className="file-info">
          <div className="file-name" title={item.file_name}>
            {item.file_name}
          </div>
          <div className="file-meta">
            <span>{formatFileSize(item.file_size)}</span>
            <span className="file-divider">•</span>
            <span>{new Date(item.modified_at).toLocaleDateString()}</span>
          </div>
        </div>
        <Dropdown
          menu={{ items: menuItems, onClick: ({ key }) => handleMenuClick(key) }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      </div>
    );
  }

  // 网格视图
  const isLarge = viewMode === 'large';

  const renderPreview = () => {
    if (isImageFile(item.file_type) && !mediaError) {
      return (
        <img
          src={assetUrl}
          alt={item.file_name}
          className="preview-image"
          onError={() => setMediaError(true)}
        />
      );
    } else if (isVideoFile(item.file_type) && !mediaError) {
      return (
        <video src={assetUrl} className="preview-video" onError={() => setMediaError(true)} />
      );
    } else {
      return <div className="file-icon-large">{getFileIcon(item.file_type)}</div>;
    }
  };

  return (
    <div
      className={`file-item file-item-grid ${isLarge ? 'large' : 'medium'} ${isSelected ? 'selected' : ''}`}
    >
      <Checkbox
        className="file-checkbox"
        checked={isSelected}
        onChange={(e) => {
          e.stopPropagation();
          onSelect(item.id, e.target.checked);
        }}
      />
      <div className="file-preview" onClick={(e) => {
        e.stopPropagation();
        onToggleSelect(item.id);
      }}>
        {renderPreview()}
      </div>
      <div className="file-info-grid">
        <div className="file-name" title={item.file_name}>
          {item.file_name}
        </div>
        {isLarge && (
          <div className="file-meta">
            <span>{formatFileSize(item.file_size)}</span>
          </div>
        )}
      </div>
      <Dropdown
        menu={{ items: menuItems, onClick: ({ key }) => handleMenuClick(key) }}
        trigger={['click']}
      >
        <Button type="text" icon={<MoreOutlined />} className="file-more-btn" />
      </Dropdown>
    </div>
  );
}
