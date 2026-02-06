import React, { useState, useEffect, useCallback } from 'react';
import {
  GlobalOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import {
  message,
  Modal,
  Form,
  Input,
  Switch,
  Button,
  Dropdown,
  MenuProps,
  Tooltip,
  Upload,
} from 'antd';
import { open } from '@tauri-apps/plugin-dialog';
import { exists } from '@tauri-apps/plugin-fs';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useShortcutStore } from '../stores/shortcutStore';
import type {
  CreateQuickAccessDto,
  UpdateQuickAccessDto,
  QuickAccessItem,
} from '../types/shortcuts';
import '../styles/QuicklyGoPage.scss';

// ============================================================================
// 辅助组件与函数
// ============================================================================

const getIconUrl = (iconPath?: string) => {
  if (!iconPath) return undefined;
  if (iconPath.startsWith('http') || iconPath.startsWith('data:')) {
    return iconPath;
  }
  // 本地文件路径转换为 webview 可访问的 URL
  return convertFileSrc(iconPath);
};

// 预设图标 (SVG Base64)
const PRESET_ICONS = [
  // Website (Blue Earth)
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzE4OTBmZiI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMSAxNy45M2MtMy45NS0uNDktNy0zLjg1LTctNy45MyAwLS42Mi4wOC0xLjIxLjIxLTEuNzlMOSAxNXYxYzAgMS4xLjkgMiAyIDJ2MS45M3ptNi45LTIuNTRjLS4yNi0uODEtMS0xLjM5LTEuOS0xLjM5aC0xdi0zYzAtLjU1LS40NS0xLTEtMUg4di0yaDJjLjU1IDAgMS0uNDUgMS0xVjdoMmMxLjEgMCAyLS45IDItMnYtLjQxYzIuOTMgMS4xOSA1IDQuMDYgNSA3LjQxIDAgMi4wOC0uOCAzLjk3LTIuMSA1LjM5eiIvPjwvc3ZnPg==',
  // Directory (Yellow Folder)
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZhYWQxNCI+PHBhdGggZD0iTTEwIDRINGMtMS4xIDAtMS45OS45LTEuOTkgMkwyIDE4YzAgMS4xLjkgMiAyIDJoMTZjMS4xIDAgMi0uOSAyLTJWOGMwLTEuMS0uOS0yLTItMmgtOGwtMi0yeiIvPjwvc3ZnPg==',
  // Document (Green)
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzUyYzQxYSI+PHBhdGggZD0iTTE0IDJINmMtMS4xIDAtMS45OS45LTEuOTkgMkw0IDIwYzAgMS4xLjg5IDIgMS45OSAyaDE0YzEuMSAwIDItLjkgMi0yVjhsLTYtNnptMiAxNkg4di0yaDh2MnptMC00SDh2LTJoOHYyem0tMy01VjMuNUwxOC41IDlIMTN6Ii8+PC9zdmc+',
  // App (Purple)
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzcyMmVkMSI+PHBhdGggZD0iTTQgOGg0VjRINFY0em02IDEyaDR2LTRoLTR2NHptLTYgMGg0di00SDR2NHptMC02aDR2LTRINFY0em02IDBoNHYtNGgtNHY0em02LTEwdjRoNFY0aC00em0tNiA0aDRWNGgtNHptNiA2aDR2LTRoLTR2NHptMCA2aDR2LTRoLTR2NHoiLz48L3N2Zz4=',
  // Star (Orange)
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZhOGMwZSI+PHBhdGggZD0iTTEyIDE3LjI3TDUuMTcgMjFsMS42NC03LjAzTDEuNDUgOS40bDcuMTktLjYxTDEyIDJsMy4zNiA2Ljc5IDcuMTkuNjEtNS4zNiA0LjU3IDEuNjQgNy4wM3oiLz48L3N2Zz4='
];

// ============================================================================
// 主组件
// ============================================================================

const QuicklyGoPage: React.FC = () => {
  // Store
  const {
    items,
    loading,
    activeTab,
    hasPasswordSet,
    setActiveTab,
    fetchShortcuts,
    checkPasswordStatus,
    createShortcut,
    updateShortcut,
    deleteShortcut,
    openShortcut,
    fetchWebsiteMetadata,
    setGlobalPassword,
    verifyPassword,
  } = useShortcutStore();

  // Local State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuickAccessItem | null>(null);
  const [passwordAction, setPasswordAction] = useState<{
    type: 'access' | 'edit';
    item?: QuickAccessItem;
    callback?: () => void;
  } | null>(null);

  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [settingsForm] = Form.useForm();

  // Effects
  useEffect(() => {
    fetchShortcuts();
    checkPasswordStatus();
  }, []);

  // Handlers
  const handleTabChange = (tab: 'website' | 'directory') => {
    setActiveTab(tab);
  };

  const showAddModal = () => {
    setEditingItem(null);
    form.resetFields();
    // 设置默认类型
    form.setFieldsValue({
      kind: activeTab,
      hidden: false,
      encrypted: false,
    });
    setIsAddModalOpen(true);
  };

  const showEditModal = (item: QuickAccessItem) => {
    // 如果是加密项，且未验证过（这里简单处理，每次编辑加密项都需要密码，或者基于 session）
    // 需求：访问、编辑加密的目录、网站时需要输入密码
    if (item.encrypted) {
      setPasswordAction({
        type: 'edit',
        item,
        callback: () => {
          setEditingItem(item);
          form.setFieldsValue({
            ...item,
            kind: item.kind,
          });
          setIsAddModalOpen(true);
        },
      });
      setIsPasswordModalOpen(true);
    } else {
      setEditingItem(item);
      form.setFieldsValue({
        ...item,
        kind: item.kind,
      });
      setIsAddModalOpen(true);
    }
  };

  const handleDelete = (item: QuickAccessItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除"${item.name}"吗？`,
      okType: 'danger',
      onOk: async () => {
        await deleteShortcut(item.id);
      },
    });
  };

  const handleOpenItem = (item: QuickAccessItem) => {
    if (item.encrypted) {
      setPasswordAction({
        type: 'access',
        item,
        callback: () => {
          openShortcut(item);
        },
      });
      setIsPasswordModalOpen(true);
    } else {
      openShortcut(item);
    }
  };

  // 表单提交
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const success = editingItem
        ? await updateShortcut(editingItem.id, values as UpdateQuickAccessDto)
        : await createShortcut(values as CreateQuickAccessDto);

      if (success) {
        setIsAddModalOpen(false);
        form.resetFields();
        setEditingItem(null);
      }
    } catch (error) {
      // Form validation failed
    }
  };

  // 网站 URL 解析
  const handleUrlBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const url = e.target.value;
    const kind = form.getFieldValue('kind');

    if (kind === 'website' && url && !editingItem) {
      // 仅在添加模式下自动解析
      // 简单的 URL 格式校验
      if (!/^https?:\/\//.test(url)) {
        // 如果没有协议头，尝试添加
        // 但最好还是让用户输入完整，或者在这里提示
      }

      const metadata = await fetchWebsiteMetadata(url);
      if (metadata.title) form.setFieldValue('name', metadata.title);
      if (metadata.description) form.setFieldValue('description', metadata.description);
      // Logo 处理：如果解析到 icon，直接使用
      // 需求：没有上传logo时使用标题的前4个字符作为logo显示（这是渲染时的 fallback，这里只填解析到的 icon）
      // 这里如果 metadata.icon 存在，填充到 form
      // 注意：icon 字段可能是 string (url)
      if (metadata.icon) form.setFieldValue('icon', metadata.icon);
    }
  };

  // 目录选择
  const handleSelectDirectory = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === 'string') {
        form.setFieldValue('target', selected);
        // 自动填充名称
        const dirName = selected.split(/[\\/]/).pop();
        if (dirName && !form.getFieldValue('name')) {
          form.setFieldValue('name', dirName);
        }
        // 自动填充描述为路径
        if (!form.getFieldValue('description')) {
           form.setFieldValue('description', selected);
        }
      }
    } catch (err) {
      console.error(err);
      message.error('选择目录失败');
    }
  };

  // 目录校验
  const handleDirectoryBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const path = e.target.value;
    const kind = form.getFieldValue('kind');

    if (kind === 'directory' && path) {
      try {
        const isExist = await exists(path);
        if (!isExist) {
          form.setFields([{ name: 'target', errors: ['目录不存在'] }]);
        } else {
          form.setFields([{ name: 'target', errors: [] }]);
          // 自动填充名称
          const dirName = path.split(/[\\/]/).pop();
          if (dirName && !form.getFieldValue('name')) {
            form.setFieldValue('name', dirName);
          }
          // 自动填充描述为路径
          if (!form.getFieldValue('description')) {
             form.setFieldValue('description', path);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // 密码验证
  const handlePasswordSubmit = async () => {
    try {
      const { password } = await passwordForm.validateFields();
      const isValid = await verifyPassword(password);

      if (isValid) {
        setIsPasswordModalOpen(false);
        passwordForm.resetFields();
        // 执行回调
        if (passwordAction?.callback) {
          passwordAction.callback();
        }
      } else {
        passwordForm.setFields([{ name: 'password', errors: ['密码错误'] }]);
      }
    } catch (error) {
      // Validation error
    }
  };

  // 全局密码设置
  const handleSettingsSubmit = async () => {
    try {
      const values = await settingsForm.validateFields();
      const { password, confirm, oldPassword } = values;

      // 如果已设置密码，验证原密码
      if (hasPasswordSet) {
        const isOldValid = await verifyPassword(oldPassword);
        if (!isOldValid) {
          settingsForm.setFields([{ name: 'oldPassword', errors: ['原密码错误'] }]);
          return;
        }
      }

      if (password !== confirm) {
        settingsForm.setFields([{ name: 'confirm', errors: ['两次输入的密码不一致'] }]);
        return;
      }

      const success = await setGlobalPassword(password);
      if (success) {
        setIsSettingsModalOpen(false);
        settingsForm.resetFields();
      }
    } catch (error) {
      // Validation error
    }
  };

  // 渲染卡片
  const renderCard = (item: QuickAccessItem) => {
    const menuProps: MenuProps = {
      items: [
        {
          key: 'edit',
          label: '编辑',
          icon: <EditOutlined />,
          onClick: () => showEditModal(item),
        },
        {
          key: 'delete',
          label: '删除',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => handleDelete(item),
        },
      ],
    };

    // Fallback Logo 逻辑：前4个字符
    const renderIcon = () => {
      const iconUrl = getIconUrl(item.icon);
      if (iconUrl) {
        return <img src={iconUrl} alt={item.name} />;
      }
      // 使用标题前4个字符
      return <>{item.name.slice(0, 4)}</>;
    };

    return (
      <div key={item.id} className="qg-card" onClick={() => handleOpenItem(item)}>
        <div className="status-badges">
          {item.encrypted && <LockOutlined style={{ color: 'var(--color-warning)' }} />}
          {item.hidden && <EyeInvisibleOutlined style={{ color: 'var(--color-text-tertiary)' }} />}
        </div>

        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          <Dropdown menu={menuProps} trigger={['click']}>
            <div className="action-btn">
              <MoreOutlined />
            </div>
          </Dropdown>
        </div>

        <div className="card-left">
          <div className="icon-wrapper">{renderIcon()}</div>
          <div className="card-info">
            <div className="card-title">{item.name}</div>
            <div className="card-desc" title={item.description || ''}>
              {item.description || '暂无描述'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 过滤显示的 items
  const filteredItems = items.filter((item) => item.kind === activeTab);

  return (
    <div className="quickly-go-page">
      {/* Header */}
      <header className="page-header">
        <div className="title-group">
          <div className="sub-title">快速启动常用网站、应用或文件夹</div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Tooltip title={hasPasswordSet ? '修改密码' : '设置密码'}>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setIsSettingsModalOpen(true)}
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </Tooltip>
          <button className="add-btn" onClick={showAddModal}>
            <PlusOutlined style={{ fontSize: '14px', strokeWidth: 20 }} />
            添加快捷入口
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="tab-container">
        <div
          className={`tab-item ${activeTab === 'website' ? 'active' : ''}`}
          onClick={() => handleTabChange('website')}
        >
          <GlobalOutlined style={{ fontSize: '16px' }} />
          <span>网站</span>
          {activeTab === 'website' && <div className="active-line" />}
        </div>

        <div
          className={`tab-item ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => handleTabChange('directory')}
        >
          <FolderOpenOutlined style={{ fontSize: '16px' }} />
          <span>本地目录</span>
          {activeTab === 'directory' && <div className="active-line" />}
        </div>
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        {filteredItems.map(renderCard)}

        {/* Continue Add Card */}
        <div className="qg-card add-card" onClick={showAddModal}>
          <div className="add-icon-wrapper">
            <PlusOutlined style={{ fontSize: '16px', fontWeight: 'bold' }} />
          </div>
          <span className="add-card-text">继续添加</span>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        title={editingItem ? '编辑快捷入口' : '添加快捷入口'}
        open={isAddModalOpen}
        onOk={handleFormSubmit}
        onCancel={() => setIsAddModalOpen(false)}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ kind: activeTab, hidden: false, encrypted: false }}
        >
          <Form.Item name="kind" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="target"
            label={activeTab === 'website' ? '网站地址' : '目录路径'}
            rules={[{ required: true, message: '请输入地址/路径' }]}
          >
            {activeTab === 'website' ? (
              <Input placeholder="https://example.com" onBlur={handleUrlBlur} />
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Input placeholder="C:/Projects" onBlur={handleDirectoryBlur} />
                <Button onClick={handleSelectDirectory} icon={<FolderOpenOutlined />}>
                  选择
                </Button>
              </div>
            )}
          </Form.Item>

          <Form.Item name="name" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述信息" rows={2} />
          </Form.Item>

          <Form.Item label="Logo (选填)">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Form.Item name="icon" noStyle>
                <Input placeholder="Logo 图片地址或 Base64" style={{ flex: 1 }} />
              </Form.Item>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => {
                  const reader = new FileReader();
                  reader.readAsDataURL(file);
                  reader.onload = () => {
                    if (typeof reader.result === 'string') {
                      form.setFieldValue('icon', reader.result);
                    }
                  };
                  return false; // Prevent default upload behavior
                }}
              >
                <Button icon={<PlusOutlined />}>上传</Button>
              </Upload>
            </div>
            
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginRight: 8 }}>预设图标:</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PRESET_ICONS.map((icon, index) => (
                  <div
                    key={index}
                    onClick={() => form.setFieldValue('icon', icon)}
                    style={{
                      width: 24,
                      height: 24,
                      cursor: 'pointer',
                      border: '1px solid var(--color-border)',
                      borderRadius: 4,
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'var(--color-bg-secondary)'
                    }}
                    title="点击使用此图标"
                  >
                    <img src={icon} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt={`Preset ${index + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          </Form.Item>

          <div style={{ display: 'flex', gap: '24px' }}>
            <Form.Item name="hidden" label="默认隐藏" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item name="encrypted" label="加密保护" valuePropName="checked">
              <Switch disabled={!hasPasswordSet && !editingItem?.encrypted} />
            </Form.Item>
            {!hasPasswordSet && !editingItem?.encrypted && (
              <div
                style={{
                  lineHeight: '32px',
                  color: 'var(--color-text-tertiary)',
                  fontSize: '12px',
                }}
              >
                (需先设置全局密码)
              </div>
            )}
          </div>
        </Form>
      </Modal>

      {/* Password Verification Modal */}
      <Modal
        title="安全验证"
        open={isPasswordModalOpen}
        onOk={handlePasswordSubmit}
        onCancel={() => {
          setIsPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        destroyOnHidden
        width={400}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="password"
            label="请输入密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password autoFocus />
          </Form.Item>
        </Form>
      </Modal>

      {/* Global Password Settings Modal */}
      <Modal
        title={hasPasswordSet ? "修改全局密码" : "设置全局密码"}
        open={isSettingsModalOpen}
        onOk={handleSettingsSubmit}
        onCancel={() => {
          setIsSettingsModalOpen(false);
          settingsForm.resetFields();
        }}
        destroyOnHidden
        width={400}
      >
        <Form form={settingsForm} layout="vertical">
          {hasPasswordSet && (
            <Form.Item
              name="oldPassword"
              label="原密码"
              rules={[{ required: true, message: '请输入原密码' }]}
            >
              <Input.Password autoFocus />
            </Form.Item>
          )}
          <Form.Item
            name="password"
            label="新密码"
            rules={[{ required: true, message: '请输入新密码' }]}
          >
            <Input.Password autoFocus={!hasPasswordSet} />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuicklyGoPage;
