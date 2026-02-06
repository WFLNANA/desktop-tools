import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Spin, App as AntdApp } from 'antd';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { CloseOutlined, LockOutlined, UnlockOutlined, PushpinOutlined, PushpinFilled } from '@ant-design/icons';
import { useCardStore, DesktopCard } from '../stores/cardStore';
import { CARD_COMPONENTS, PlaceholderCard } from '../components/cards/registry';

export const WidgetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { cards, loadCards, toggleCardLock, updateCard } = useCardStore();
  const [card, setCard] = useState<DesktopCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const { message } = AntdApp.useApp();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
        message.error(`Widget Error: ${event.message}`);
    };
    window.addEventListener('error', handleError);

    const init = async () => {
      try {
        // 先设置一个调试背景，确保能看到窗口
        document.body.style.background = 'rgba(0, 0, 0, 0)'; 
        document.documentElement.style.background = 'rgba(0, 0, 0, 0)';

        await loadCards();
      } catch (error) {
        message.error('加载卡片数据失败，请重试');
      } finally {
        setLoading(false);
      }
    };
    init();

    return () => {
        window.removeEventListener('error', handleError);
    };
  }, [loadCards]);

  useEffect(() => {
    if (cards.length > 0 && id) {
      const found = cards.find((c) => c.id === id);
      setCard(found || null);

      // Set window title
      if (found) {
        getCurrentWindow().setTitle(found.title || 'Widget');
      }
    }
  }, [cards, id]);

  const isPinned = card?.parsedConfig?.isPinned ?? false;

  useEffect(() => {
    if (card) {
        getCurrentWindow().setAlwaysOnTop(isPinned);
    }
  }, [card, isPinned]);

  if (loading)
    return (
              <div
                style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100vh',
                    background: 'rgba(0, 0, 0, 0.5)', 
                    color: 'white',
                    borderRadius: 8
                }}
              >
                <Spin />
                <div style={{marginLeft: 10}}>Loading Widget... {id}</div>
              </div>
            );
          if (!card)
            return (
                <div style={{ 
                    color: 'red', 
                    padding: 20, 
                    background: 'rgba(255, 255, 255, 0.8)',
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    Card not found: {id}
                </div>
            );

  const Component = CARD_COMPONENTS[card.type] || PlaceholderCard;
  const parsedConfig = card.parsedConfig || {};
  const isLocked = parsedConfig.isLocked ?? false;
  // const isPinned = parsedConfig.isPinned ?? false; // Moved up

  /**
   * 切换置顶状态
   */
  const togglePin = async () => {
    if (!card) return;
    const newConfig = { ...parsedConfig, isPinned: !isPinned };
    await updateCard(card.id, card.title || '', newConfig);
  };

  // Apply styles similar to BaseCard but for full window
  const background =
    parsedConfig.background || parsedConfig.bgColor || 'var(--ant-color-bg-container)';
  const textColor = parsedConfig.textColor || 'var(--ant-color-text)';
  const opacity =
    parsedConfig.transparent !== undefined ? (100 - parsedConfig.transparent) / 100 : 1;
  const fontSize = parsedConfig.fontSize ? `${parsedConfig.fontSize}px` : undefined;
  const fontFamily = parsedConfig.fontFamily;

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: background,
        color: textColor,
        opacity: opacity,
        fontSize: fontSize,
        fontFamily: fontFamily,
        borderRadius: 0,
        position: 'relative',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        userSelect: 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag Handle - Top 30px - Only if UNLOCKED */}
      {!isLocked && (
        <div
          data-tauri-drag-region
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 30,
            cursor: 'move',
            zIndex: 1000,
            background: 'var(--color-bg-tertiary)',
            opacity: isHovered ? 0.5 : 0.02,
            transition: 'opacity var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'end',
            padding: '0 12px',
            gap: 12,
          }}
          title="拖拽移动"
        >
          <div
            style={{
              zIndex: 1002,
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.2s',
            }}
          >
            <div
              style={{
                cursor: 'pointer',
                padding: 4,
                opacity: 0.8,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={togglePin}
              title={isPinned ? '取消置顶' : '置顶'}
            >
              {isPinned ? (
                <PushpinFilled style={{ color: 'var(--ant-color-primary)', fontSize: 16 }} />
              ) : (
                <PushpinOutlined style={{ fontSize: 16 }} />
              )}
            </div>
          </div>

          <div
            style={{
              zIndex: 1002,
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.2s',
            }}
          >
            <div
              style={{
                cursor: 'pointer',
                padding: 4,
                opacity: 0.8,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => toggleCardLock(card.id)}
              title={isLocked ? '解锁' : '锁定'}
            >
              {isLocked ? (
                <LockOutlined style={{ color: 'var(--color-error)', fontSize: 16 }} />
              ) : (
                <UnlockOutlined style={{ fontSize: 16 }} />
              )}
            </div>
          </div>

          {/* Close Button - Only if UNLOCKED */}
          {!isLocked && (
            <div
              style={{
                width: 24,
                height: 24,
                zIndex: 1002,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isHovered ? 1 : 0.02,
                transition: 'opacity 0.2s',
              }}
              onClick={() => getCurrentWindow().close()}
              title="关闭窗口"
            >
              <CloseOutlined style={{ fontSize: 16 }} />
            </div>
          )}
        </div>
      )}

      <div style={{ height: '100%', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <Component 
            card={card} 
            size={(() => {
                const width = card.width || 300;
                if (width <= 240) return 'small';
                if (width >= 361) return 'large';
                return 'medium';
            })()}
            onUpdate={(config) => updateCard(card.id, card.title || '', config)}
        />
      </div>

      {/* Interaction Blocker if Locked */}
      {isLocked && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 999,
            pointerEvents: 'auto',
            background: 'transparent',
          }}
        >
          <div
            style={{
              cursor: 'pointer',
              padding: 4,
              opacity: isHovered ? 0.8 : 0,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => toggleCardLock(card.id)}
            title='解锁'
          >
            <UnlockOutlined style={{ fontSize: 16 }} />
          </div>
        </div>
      )}
    </div>
  );
};
