import React, { useMemo } from 'react';
import { QuickAccessItem } from '../../types/shortcuts';
import { GlobalOutlined, FolderOutlined, LockOutlined, EyeInvisibleOutlined, MoreOutlined } from '@ant-design/icons';
import { Dropdown, Button, MenuProps, theme, Typography } from 'antd';
import { convertFileSrc } from '@tauri-apps/api/core';

const { Text } = Typography;

interface ShortcutItemProps {
  item: QuickAccessItem;
  onClick: (item: QuickAccessItem) => void;
  onEdit: (item: QuickAccessItem) => void;
  onDelete: (item: QuickAccessItem) => void;
  onToggleHidden: (item: QuickAccessItem) => void;
}

// Helper to generate consistent pastel colors from string
const getPastelColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 96%)`; // Very light pastel background
};

const getIconColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 50%)`; // Darker text/icon color
};

export const ShortcutItem: React.FC<ShortcutItemProps> = ({
  item,
  onClick,
  onEdit,
  onDelete,
  onToggleHidden,
}) => {
  const { token } = theme.useToken();

  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: '编辑',
      onClick: () => onEdit(item),
    },
    {
      key: 'toggle-hidden',
      label: item.hidden ? '取消隐藏' : '隐藏',
      onClick: () => onToggleHidden(item),
    },
    {
      key: 'delete',
      label: '删除',
      danger: true,
      onClick: () => onDelete(item),
    },
  ];

  const iconSrc = useMemo(() => {
    if (!item.icon) return null;
    if (item.icon.startsWith('http') || item.icon.startsWith('data:')) {
      return item.icon;
    }
    return convertFileSrc(item.icon);
  }, [item.icon]);

  const bgColor = useMemo(() => getPastelColor(item.name), [item.name]);
  const iconColor = useMemo(() => getIconColor(item.name), [item.name]);

  return (
    <div 
      className={`
        group relative flex items-center gap-4 p-5 rounded-2xl transition-all duration-300
        bg-white dark:bg-[#1f1f1f]
        shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.08)]
        hover:-translate-y-1 border border-transparent hover:border-blue-100 dark:hover:border-blue-900
      `}
      style={{ 
        opacity: item.hidden ? 0.6 : 1,
        height: '100px'
      }}
    >
      {/* Icon Section */}
      <div 
        className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105"
        style={{ 
          backgroundColor: bgColor,
          color: iconColor
        }}
      >
        {iconSrc ? (
          <img src={iconSrc} alt="icon" className="w-full h-full object-cover" />
        ) : (
          <div className="text-2xl flex">
            {item.kind === 'website' ? <GlobalOutlined /> : <FolderOutlined />}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 h-full py-1">
        <div className="flex items-center gap-2">
          <Text strong ellipsis className="text-[16px] text-gray-800 dark:text-gray-100 leading-none">
            {item.name}
          </Text>
          {item.encrypted && (
            <LockOutlined style={{ color: token.colorError }} className="text-xs" />
          )}
          {item.hidden && (
            <EyeInvisibleOutlined style={{ color: token.colorWarning }} className="text-xs" />
          )}
        </div>
        <Text 
          className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed line-clamp-2" 
          title={item.description || item.target}
        >
          {item.description || item.target}
        </Text>
      </div>

      {/* Action Section */}
      <div className="flex flex-col items-end justify-center h-full gap-1 pl-2">
         <Button 
           size="small" 
           className="
             text-xs px-3 h-7 rounded-full border-none bg-gray-50 text-gray-500 font-medium
             hover:bg-gray-100 hover:text-gray-700 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10
             transition-colors duration-200
           "
           onClick={(e) => {
             e.stopPropagation();
             onClick(item);
           }}
         >
           立即打开
         </Button>
         
         {/* Hidden Menu Trigger - Positioned absolutely to not mess with layout or visible on hover */}
         <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
            <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
              <div className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer text-gray-400">
                <MoreOutlined />
              </div>
            </Dropdown>
         </div>
      </div>
    </div>
  );
};
