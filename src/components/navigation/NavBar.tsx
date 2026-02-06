import { useState, useCallback } from 'react';
import { Button, Switch } from 'antd';
import {
  FolderOutlined,
  PictureOutlined,
  ToolOutlined,
  SettingOutlined,
  DashboardOutlined,
  SunOutlined,
  MoonOutlined,
  CodeOutlined,
  ThunderboltOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../hooks/useTheme';
import './NavBar.scss';

interface NavBarProps {
  currentPage?: 'home' | 'settings' | 'wallpaper' | 'system' | 'envvar' | 'shortcuts' | 'toolbox' | 'cards';
  onPageChange?: (page: 'home' | 'settings' | 'wallpaper' | 'system' | 'envvar' | 'shortcuts' | 'toolbox' | 'cards') => void;
}

/**
 * 导航栏组件
 * 负责页面切换与主题切换，新增“系统信息”菜单项
 */
export function NavBar({ currentPage = 'home', onPageChange }: NavBarProps) {
  const { currentTheme: theme, toggleTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  /**
   * 页面切换事件
   */
  const handlePageChange = useCallback((page: 'home' | 'settings' | 'wallpaper' | 'system' | 'envvar' | 'shortcuts' | 'toolbox' | 'cards') => {
    setIsAnimating(true);
    onPageChange?.(page);
    setTimeout(() => setIsAnimating(false), 300);
  }, [onPageChange]);

  const handleThemeToggle = useCallback(() => {
    setIsAnimating(true);
    toggleTheme();
    setTimeout(() => setIsAnimating(false), 300);
  }, [toggleTheme]);

  const getActiveClass = (key: string) => {
    return currentPage === key ? 'active' : '';
  };

  return (
    <nav 
      className={`navbar ${isAnimating ? 'animating' : ''}`}
      role="navigation"
      aria-label="主导航栏"
    >
      <div className="navbar-container">
        <div className="navbar-left">
          <div className="navbar-nav-items" role="menubar">
            <button
              className={`nav-item ${getActiveClass('home')}`}
              onClick={() => handlePageChange('home')}
              role="menuitem"
              aria-current={currentPage === 'home' ? 'page' : undefined}
              tabIndex={0}
            >
              <FolderOutlined />
              <span>资源目录</span>
            </button>
            <button
              className={`nav-item ${getActiveClass('wallpaper')}`}
              onClick={() => handlePageChange('wallpaper')}
              role="menuitem"
              aria-current={currentPage === 'wallpaper' ? 'page' : undefined}
              tabIndex={0}
            >
              <PictureOutlined />
              <span>壁纸</span>
            </button>
            <button
              className={`nav-item ${getActiveClass('system')}`}
              onClick={() => handlePageChange('system')}
              role="menuitem"
              aria-current={currentPage === 'system' ? 'page' : undefined}
              tabIndex={0}
            >
              <DashboardOutlined />
              <span>系统信息</span>
            </button>
            <button
              className={`nav-item ${getActiveClass('envvar')}`}
              onClick={() => handlePageChange('envvar')}
              role="menuitem"
              aria-current={currentPage === 'envvar' ? 'page' : undefined}
              tabIndex={0}
            >
              <CodeOutlined />
              <span>环境变量</span>
            </button>
            <button
              className={`nav-item ${getActiveClass('shortcuts')}`}
              onClick={() => handlePageChange('shortcuts')}
              role="menuitem"
              aria-current={currentPage === 'shortcuts' ? 'page' : undefined}
              tabIndex={0}
            >
              <ThunderboltOutlined />
              <span>一键直达</span>
            </button>
            <button
              className={`nav-item ${getActiveClass('cards')}`}
              onClick={() => handlePageChange('cards')}
              role="menuitem"
              aria-current={currentPage === 'cards' ? 'page' : undefined}
              tabIndex={0}
            >
              <AppstoreOutlined />
              <span>桌面卡片</span>
            </button>
            <button
              className={`nav-item ${getActiveClass('toolbox')}`}
              onClick={() => handlePageChange('toolbox')}
              role="menuitem"
              aria-current={currentPage === 'toolbox' ? 'page' : undefined}
              tabIndex={0}
            >
              <ToolOutlined />
              <span>工具箱</span>
            </button>
          </div>
        </div>

        <div className="navbar-right">
            <Switch
              checked={theme === 'dark'}
              onChange={handleThemeToggle}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
              aria-label={`切换到${theme === 'dark' ? '浅色' : '深色'}模式`}
            />

          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => handlePageChange('settings')}
            aria-label="打开系统配置"
            aria-current={currentPage === 'settings' ? 'page' : undefined}
          >
          </Button>
        </div>
      </div>
    </nav>
  );
}
