/*
 * @Author       : wfl
 * @LastEditors  : wfl
 * @description  :
 * @updateInfo   :
 * @Date         : 2026-01-20 16:22:41
 * @LastEditTime : 2026-02-03 16:16:21
 */
import { useEffect, useState } from 'react';
import { ConfigProvider, theme as antdTheme, App as AntdApp } from 'antd';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useSettingsStore, THEME_PRESETS } from './stores/settingsStore';
import { NavBar } from './components/navigation/NavBar';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { WallpaperModule } from './components/wallpaper';
import { ToolboxPage } from './pages/ToolboxPage';
import { SystemInfoPage } from './pages/SystemInfoPage';
import { EnvVarPage } from './pages/EnvVarPage';
import QuicklyGoPage from './pages/QuicklyGoPage';
import { useTheme } from './hooks/useTheme';
import './styles/main.scss';
import { CardManager } from './components/cards/CardManager';
import { WidgetPage } from './pages/WidgetPage';

const ThemeSync = () => {
  const { token } = antdTheme.useToken();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', token.colorPrimary);
    root.style.setProperty('--color-primary-hover', token.colorPrimaryHover);
    root.style.setProperty('--color-primary-light', token.colorPrimaryBgHover);
    root.style.setProperty('--color-primary-subtle', token.colorPrimaryBg);
    root.style.setProperty('--ant-theme-primary', token.colorPrimary);
  }, [token]);

  return null;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const { currentTheme: theme } = useTheme();
  const { closeBehavior, loadSettings, themePreset } = useSettingsStore();

  const activePreset = THEME_PRESETS.find((p) => p.id === themePreset) || THEME_PRESETS[0];
  const colorPrimary = theme === 'dark' ? activePreset.colors.dark : activePreset.colors.light;

  const isWidget = location.pathname.startsWith('/widget/');

  // 动态计算 Ant Design 主题配置
  const antdThemeConfig = {
    algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary,
      colorBgBase: theme === 'dark' ? '#141414' : '#ffffff',
      colorTextBase: theme === 'dark' ? '#ffffff' : '#000000',
    },
    cssVar: {
      prefix: 'ant',
    },
  };

  useEffect(() => {
    const init = async () => {
      loadSettings();
      setSettingsLoaded(true);
    };
    init();

    let unlisten: () => void | undefined;
    const setupWindowListener = async () => {
      try {
        // 尝试获取窗口实例，如果在浏览器环境中可能会失败
        const appWindow = getCurrentWindow();
        const unlistenFn = await appWindow.onCloseRequested(
          (event: { preventDefault: () => void }) => {
            if (settingsLoaded && closeBehavior === 'minimize') {
              console.log('Preventing close and hiding window');
              event.preventDefault();
              appWindow.hide();
            }
          }
        );
        unlisten = unlistenFn;
      } catch (error) {
        console.warn('Tauri API not available (running in browser?)', error);
      }
    };

    if (!isWidget) {
      setupWindowListener();
    }

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [closeBehavior, settingsLoaded, loadSettings, isWidget]);

  return (
    <ConfigProvider theme={antdThemeConfig}>
      <AntdApp>
        <ThemeSync />
        {isWidget ? (
            <Routes>
                <Route path="/widget/:id" element={<WidgetPage />} />
            </Routes>
        ) : (
            <div className="app-container">
            <NavBar
                currentPage={getPageFromPath(location.pathname)}
                onPageChange={(page) => navigate(`/${page === 'home' ? '' : page}`)}
            />
            <div className="app-content-wrapper">
                <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/wallpaper" element={<WallpaperModule />} />
                <Route path="/system" element={<SystemInfoPage />} />
                <Route path="/envvar" element={<EnvVarPage />} />
                <Route path="/shortcuts" element={<QuicklyGoPage />} />
                <Route path="/cards" element={<CardManager />} />
                <Route path="/toolbox" element={<ToolboxPage />} />
                </Routes>
            </div>
            </div>
        )}
      </AntdApp>
    </ConfigProvider>
  );
}

/**
 * 从路由路径推断当前页面标识
 */
function getPageFromPath(
  path: string
): 'home' | 'settings' | 'wallpaper' | 'system' | 'envvar' | 'shortcuts' | 'toolbox' | 'cards' {
  if (path.startsWith('/settings')) return 'settings';
  if (path.startsWith('/wallpaper')) return 'wallpaper';
  if (path.startsWith('/system')) return 'system';
  if (path.startsWith('/envvar')) return 'envvar';
  if (path.startsWith('/shortcuts')) return 'shortcuts';
  if (path.startsWith('/cards')) return 'cards';
  if (path.startsWith('/toolbox')) return 'toolbox';
  return 'home';
}

export default App;
