import { useEffect } from 'react';
import {
  Radio,
  Switch,
  Button,
  Card,
  App,
  Input,
} from 'antd';
import type { RadioChangeEvent } from 'antd';
import {
  ArrowLeftOutlined,
  SettingOutlined,
  HighlightOutlined,
  PoweroffOutlined,
  CloseOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore, THEME_PRESETS, ThemePreset, CloseBehavior } from '../stores/settingsStore';
import { useTheme } from '../hooks/useTheme';
import '../styles/settings.scss';

export function SettingsPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { themePreset, closeBehavior, autoStart, scanIgnoreDirectories, setThemePreset, setCloseBehavior, setAutoStart, setScanIgnoreDirectories } = useSettingsStore();
  const { currentTheme: theme, isSystemTheme, setTheme } = useTheme();

  useEffect(() => {
    const preset = THEME_PRESETS.find(p => p.id === themePreset);
    if (preset) {
      document.documentElement.setAttribute('data-theme-preset', preset.id);
    }
  }, [themePreset]);

  const handleThemePresetChange = (e: RadioChangeEvent) => {
    const preset = e.target.value as ThemePreset;
    setThemePreset(preset);
    message.success(`已切换至${THEME_PRESETS.find(p => p.id === preset)?.name}主题`);
  };

  const handleCloseBehaviorChange = (e: RadioChangeEvent) => {
    const behavior = e.target.value as CloseBehavior;
    setCloseBehavior(behavior);
    message.success(`已设置关闭行为为：${behavior === 'exit' ? '退出应用' : '最小化至系统状态栏'}`);
  };

  const handleAutoStartChange = async (enabled: boolean) => {
    await setAutoStart(enabled);
    message.success(`已${enabled ? '启用' : '禁用'}开机启动`);
  };

  const handleScanIgnoreDirectoriesChange = (value: string) => {
    setScanIgnoreDirectories(value);
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          className="back-button"
        >
          返回主页
        </Button>
        <h2><SettingOutlined /> 系统配置</h2>
      </div>

      <div className="settings-content">
        <Card className="settings-card" title={<><HighlightOutlined /> 主题设置</>}>
          <div className="setting-item">
            <div className="setting-label">
              <span className="label-text">预设主题</span>
              <span className="label-desc">选择应用的主题风格</span>
            </div>
            <Radio.Group
              value={themePreset}
              onChange={(e) => handleThemePresetChange(e)}
              className="theme-presets"
            >
              {THEME_PRESETS.map((preset) => (
                <Radio.Button key={preset.id} value={preset.id} className="theme-preset-btn">
                  <div
                    className="preset-color"
                    style={{ background: preset.colors.light }}
                  />
                  <div className="preset-info">
                    <span className="preset-name">{preset.name}</span>
                    <span className="preset-desc">{preset.description}</span>
                  </div>
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <span className="label-text">当前主题模式</span>
              <span className="label-desc">日间/夜间模式（与预设主题配合使用）</span>
            </div>
            <div className="theme-mode-display">
              <span className={`mode-badge ${theme}`}>
                {isSystemTheme 
                  ? '💻 跟随系统' 
                  : theme === 'dark' 
                    ? '🌙 夜间模式' 
                    : '☀️ 日间模式'}
              </span>
              <Button
                type="link"
                size="small"
                onClick={() => setTheme(isSystemTheme ? 'light' : 'system')}
                style={{ marginLeft: 8, padding: 0 }}
              >
                {isSystemTheme ? '手动切换' : '跟随系统'}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="settings-card" title={<><CloseOutlined /> 关闭行为</>}>
          <div className="setting-item">
            <div className="setting-label">
              <span className="label-text">应用关闭时</span>
              <span className="label-desc">选择关闭主窗口时的行为</span>
            </div>
            <Radio.Group
              value={closeBehavior}
              onChange={(e) => handleCloseBehaviorChange(e)}
              className="behavior-options"
            >
              <Radio.Button value="exit" className="behavior-btn">
                <PoweroffOutlined style={{ color: '#e53e3e' }} />
                <span>退出应用</span>
              </Radio.Button>
              <Radio.Button value="minimize" className="behavior-btn">
                <span style={{ transform: 'rotate(-90deg)', display: 'inline-block' }}>⬇</span>
                <span>最小化至系统状态栏</span>
              </Radio.Button>
            </Radio.Group>
          </div>
        </Card>

        <Card className="settings-card" title={<><PoweroffOutlined /> 启动设置</>}>
          <div className="setting-item">
            <div className="setting-label">
              <span className="label-text">开机启动</span>
              <span className="label-desc">系统开机时自动运行应用</span>
            </div>
            <Switch
              checked={autoStart}
              onChange={handleAutoStartChange}
              checkedChildren="启用"
              unCheckedChildren="禁用"
            />
          </div>
        </Card>

        <Card className="settings-card" title={<><FolderOutlined /> 扫描设置</>}>
          <div className="setting-item">
            <div className="setting-label">
              <span className="label-text">扫描忽略目录</span>
              <span className="label-desc">扫描时跳过的目录名，多个目录用逗号分隔</span>
            </div>
            <Input
              placeholder="例如: node_modules, .git, dist"
              value={scanIgnoreDirectories}
              onChange={(e) => handleScanIgnoreDirectoriesChange(e.target.value)}
              allowClear
              style={{ maxWidth: 400 }}
            />
          </div>
        </Card>

        <Card className="settings-card info-card">
          <div className="settings-info">
            <p>💡 所有设置将自动保存，无需手动确认</p>
            <p>⚠️ 开机启动功能需要系统权限支持</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
