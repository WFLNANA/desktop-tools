import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Popover, Modal } from 'antd';
import { CloseOutlined, SettingOutlined, DragOutlined, ExportOutlined, ImportOutlined, PushpinOutlined, PushpinFilled } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { DesktopCard, useCardStore } from '../../stores/cardStore';
import { CARD_META } from './types';
import styles from './BaseCard.module.scss';
import message from 'antd/lib/message';

interface BaseCardProps {
  card: DesktopCard;
  children: React.ReactNode;
  isEditing: boolean;
  onEdit?: (card: DesktopCard) => void;
}

export const BaseCard: React.FC<BaseCardProps> = ({ card, children, isEditing, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, disabled: !isEditing });

  const { deleteCard, updateCard } = useCardStore();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // width: card.width || CARD_META[card.type as keyof typeof CARD_META]?.defaultWidth || 300,
    height: card.height || CARD_META[card.type as keyof typeof CARD_META]?.defaultHeight || 200,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  const parsedConfig = card.parsedConfig || {};
  const background = parsedConfig.background || parsedConfig.bgColor || 'var(--ant-color-bg-container)';
  const textColor = parsedConfig.textColor || 'var(--ant-color-text)';
  const opacity = parsedConfig.transparent !== undefined ? (100 - parsedConfig.transparent) / 100 : 1;
  const fontSize = parsedConfig.fontSize ? `${parsedConfig.fontSize}px` : undefined;
  const fontFamily = parsedConfig.fontFamily;
  const isPinned = parsedConfig.isPinned || false;

  const timeoutRef = React.useRef<any>(null);
  const isLongPress = React.useRef(false);
  const startPos = React.useRef<{x: number, y: number} | null>(null);

  // Always enable dragging if editing is true (which is now always true)
  // But we want content to be clickable.
  // We should only enable drag if we are hovering over the card or grabbing a handle.
  // For now, let's just make the overlay show on hover.
  const [isHovered, setIsHovered] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    // If clicking on actions, don't trigger drag/edit
    if ((e.target as HTMLElement).closest(`.${styles.actions}`)) {
        return;
    }

    startPos.current = { x: e.clientX, y: e.clientY };
    isLongPress.current = false;
    timeoutRef.current = setTimeout(() => {
        isLongPress.current = true;
        // Long press could trigger edit, but we have a button now.
        // Maybe long press does nothing special or just visual feedback?
    }, 800);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }

    if (startPos.current) {
        const deltaX = e.clientX - startPos.current.x;
        const deltaY = e.clientY - startPos.current.y;
        
        // Swipe Left to Delete (threshold 100px, vertical tolerance 50px)
        if (deltaX < -100 && Math.abs(deltaY) < 50) {
            Modal.confirm({
                title: '确认删除',
                content: '确定要删除这个卡片吗？',
                onOk: () => deleteCard(card.id)
            });
        }
    }
    startPos.current = null;
  };

  const handlePopOut = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
        const defaultWidth = CARD_META[card.type as keyof typeof CARD_META]?.defaultWidth || 300;
        const defaultHeight = CARD_META[card.type as keyof typeof CARD_META]?.defaultHeight || 200;
        
        // Ensure width and height are numbers
        const width = typeof card.width === 'number' ? card.width : 
                    (card.width ? parseFloat(String(card.width)) : defaultWidth);
        const height = typeof card.height === 'number' ? card.height : 
                      (card.height ? parseFloat(String(card.height)) : defaultHeight);

        await invoke('open_card_window', { 
            id: card.id, 
            width: width || defaultWidth, 
            height: height || defaultHeight 
        });
    } catch (err: any) {
        console.error('打开独立窗口失败:', err);
        message.error(`打开独立窗口失败: ${err?.message || err || '未知错误'}`);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleClosePopOut = async () => {
      if (isProcessing) return;
      setIsProcessing(true);
      try {
          await invoke('close_card_window', { id: card.id });
      } catch (err: any) {
          console.error('关闭独立窗口失败:', err);
          message.error(`关闭独立窗口失败: ${err?.message || err || '未知错误'}`);
      } finally {
          setIsProcessing(false);
      }
  };

  /**
   * 切换卡片置顶状态
   */
    const togglePin = async () => {
      const newConfig = { ...parsedConfig, isPinned: !isPinned };
      await updateCard(card.id, card.title || '', newConfig);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles.cardWrapper}
      {...attributes}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={(e) => {
          handlePointerUp(e);
          setIsHovered(false);
      }}
      onMouseEnter={() => setIsHovered(true)}
    >
      <div 
        className={styles.cardContent}
        style={{
            // background and opacity moved to independent layer
            color: textColor,
            fontSize: fontSize,
            fontFamily: fontFamily,
            // Inject CSS variables for child components
            '--card-text-color': textColor,
            '--card-bg-color': background,
            '--card-font-size': fontSize,
            '--card-font-family': fontFamily,
        } as React.CSSProperties}
      >
        <div 
            className={styles.cardBackground}
            style={{
                background: background,
                opacity: opacity,
            }}
        />
        <div 
            className={styles.editOverlay} 
            style={{ opacity: isHovered || isDragging ? 1 : 0, pointerEvents: isHovered ? 'auto' : 'none' }}
        >
            <div className={styles.dragHandle} {...listeners} title="按住拖拽排序">
                <DragOutlined />
            </div>
            <div className={styles.actions}>
                <Button 
                    type="text" 
                    icon={isPinned ? <PushpinFilled /> : <PushpinOutlined />} 
                    size="small" 
                    className={styles.actionBtn}
                    onClick={togglePin}
                    title={isPinned ? "取消置顶" : "置顶"}
                    style={{ color: isPinned ? 'var(--ant-color-primary)' : undefined }}
                />
                <Button 
                    type="text" 
                    icon={<ExportOutlined />} 
                    size="small" 
                    className={styles.actionBtn}
                    onClick={handlePopOut}
                    title="独立窗口显示"
                    loading={isProcessing}
                />
                <Button 
                    type="text" 
                    icon={<ImportOutlined />} 
                    size="small" 
                    className={styles.actionBtn}
                    onClick={handleClosePopOut}
                    title="收回独立窗口"
                    loading={isProcessing}
                />
                <Button 
                    type="text" 
                    icon={<SettingOutlined />} 
                    size="small" 
                    className={styles.actionBtn}
                    onClick={() => onEdit?.(card)}
                />
            </div>
        </div>
        <div className={styles.innerContent}>
            {children}
        </div>
      </div>
    </div>
  );
};
