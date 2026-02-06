import { useEffect, useState } from 'react';
import {
  Button,
  Input,
  Modal,
  Form,
  Breadcrumb,
  Empty,
  App,
  Progress,
} from 'antd';
import {
  FolderOutlined,
  PlusOutlined,
  FolderAddOutlined,
  ScanOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useCategoryStore } from '../stores/categoryStore';
import { useResourceStore } from '../stores/resourceStore';
import { directoryApi } from '../api/directory';
import { FileTypeStats } from '../components/common/FileTypeStats';
import { CategoryList } from '../components/category/CategoryList';
import type { CategoryNode } from '../types';
import '../styles/main.scss';

export function HomePage() {
  const { message, modal } = App.useApp();
  const {
    categories,
    selectedCategory,
    loading: categoryLoading,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    selectCategory,
    reorderCategories,
  } = useCategoryStore();

  const {
    bindings,
    loading: resourceLoading,
    loadBindings,
    addBinding,
    removeBinding,
    scanDirectory,
    scanDirectoryBatch,
    getFileCategoryStats,
    clearResources,
    scanProgress,
  } = useResourceStore();

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryNode | null>(null);
  const [form] = Form.useForm();
  const [renameForm] = Form.useForm();

  useEffect(() => {
    const init = async () => {
      try {
        await loadCategories();
      } catch (error) {
        console.error('Failed to load categories:', error);
        message.error('加载分类失败: ' + error);
      }
    };
    init();
  }, [loadCategories]);

  const handleSelectCategory = async (category: CategoryNode) => {
    clearResources();
    selectCategory(category);
    try {
      await loadBindings(category.id);
      const currentBindings = useResourceStore.getState().bindings;
      if (currentBindings.length > 0) {
        await scanDirectoryBatch(category.id);
      }
    } catch (error) {
      console.error('Failed to load category:', error);
      message.error('加载分类失败: ' + error);
    }
  };

  const handleCreateCategory = async () => {
    try {
      const values = await form.validateFields();
      await createCategory(values);
      message.success('分类创建成功');
      setIsCategoryModalOpen(false);
      form.resetFields();
    } catch (error) {
      message.error('创建失败: ' + error);
    }
  };

  const handleDeleteCategory = (id: number, name: string) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除分类"${name}"吗？`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteCategory(id, 'DeleteAll');
          message.success('删除成功');
        } catch (error) {
          message.error('删除失败: ' + error);
        }
      },
    });
  };

  const handleRenameCategory = async () => {
    try {
      const values = await renameForm.validateFields();
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name: values.name });
        message.success('重命名成功');
        setIsRenameModalOpen(false);
        renameForm.resetFields();
        setEditingCategory(null);
      }
    } catch (error) {
      message.error('重命名失败: ' + error);
    }
  };

  const handleEditCategory = (category: CategoryNode) => {
    setEditingCategory(category);
    renameForm.setFieldsValue({ name: category.name });
    setIsRenameModalOpen(true);
  };

  const handlePinToTop = async (id: number) => {
    try {
      await updateCategory(id, { sort_order: -1 });
      message.success('已置顶');
      await loadCategories();
    } catch (error) {
      message.error('置顶失败: ' + error);
    }
  };

  const handleReorderCategories = async (orders: Array<[number, number]>) => {
    try {
      await reorderCategories(orders);
    } catch (error) {
      message.error('排序失败: ' + error);
    }
  };

  const handleAddDirectory = async () => {
    if (!selectedCategory) {
      message.warning('请先选择一个分类');
      return;
    }

    try {
      const path = await directoryApi.selectDirectory();
      if (path) {
        await addBinding(selectedCategory.id, path);
        message.success('目录绑定成功');
      }
    } catch (error) {
      message.error('绑定失败: ' + error);
    }
  };

  const handleScan = async () => {
    if (!selectedCategory) {
      message.warning('请先选择一个分类');
      return;
    }

    try {
      await scanDirectoryBatch(selectedCategory.id);
      message.success('扫描完成');
    } catch (error) {
      message.error('扫描失败: ' + error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  return (
    <>
      <div className="sidebar">
        <div className="toolbar">
          <Button
            icon={<PlusOutlined />}
            type='primary'
            style={{ width: '100%' }}
            onClick={() => setIsCategoryModalOpen(true)}
          >
            新建分类
          </Button>
        </div>

        <div className="sidebar-content">
          <CategoryList
            categories={categories}
            selectedCategory={selectedCategory as CategoryNode | null}
            loading={categoryLoading}
            onSelect={handleSelectCategory}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
            onPinToTop={handlePinToTop}
            onReorder={handleReorderCategories}
          />
        </div>
      </div>

      <div className="main-content">
        <div className="content-toolbar">
          <Breadcrumb
            items={[
              {
                title: <HomeOutlined />,
              },
              {
                title: selectedCategory?.name,
              },
            ]}
          />
          <span>已绑定: {bindings.length}个目录</span>
        </div>


        <div className="bindings-section">
          <div className="section-header">
            <div className="section-title">已绑定目录</div>
            <Button
              type="primary"
              icon={<FolderAddOutlined />}
              onClick={handleAddDirectory}
              size="small"
            >
              添加目录
            </Button>
          </div>
          <div className="bindings-list">
            {bindings.map((binding) => (
              <div key={binding.id} className="binding-item">
                <FolderOutlined className="binding-icon" />
                <span
                  className="binding-path"
                  onClick={async () => {
                    try {
                      await directoryApi.openInExplorer(binding.directory_path);
                    } catch (error) {
                      message.error('打开失败: ' + error);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                  title="点击打开目录"
                >
                  {binding.directory_path}
                </span>
                <Button
                  type="text"
                  danger
                  size="small"
                  onClick={() => selectedCategory && removeBinding(binding.id, selectedCategory.id)}
                >
                  移除
                </Button>
              </div>
            ))}
          </div>
        </div>


        {selectedCategory && (
          <div className="files-section">
            <div className="section-header">
              <div className="section-title">文件类型统计</div>
              <Button
                type="primary"
                icon={<ScanOutlined />}
                onClick={handleScan}
                loading={resourceLoading}
                size="small"
              >
                扫描
              </Button>
            </div>

            {resourceLoading && scanProgress.totalFiles > 0 && (
              <div className="scan-progress">
                <Progress
                  percent={Math.round((scanProgress.scannedFiles / scanProgress.totalFiles) * 100)}
                  status="active"
                  format={() => `${scanProgress.scannedFiles.toLocaleString()} / ${scanProgress.totalFiles.toLocaleString()}`}
                />
              </div>
            )}

            {resourceLoading && scanProgress.totalFiles === 0 ? (
              <div className="loading-state">扫描中...</div>
            ) : (
              <FileTypeStats
                stats={getFileCategoryStats()}
                formatFileSize={formatFileSize}
              />
            )}
          </div>
        )}

        {!selectedCategory && (
          <div className="empty-state">
            <Empty
              description="请选择一个分类"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ marginTop: '100px' }}
            />
          </div>
        )}
      </div>

      <Modal
        title="创建分类"
        open={isCategoryModalOpen}
        onOk={handleCreateCategory}
        onCancel={() => {
          setIsCategoryModalOpen(false);
          form.resetFields();
        }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="重命名分类"
        open={isRenameModalOpen}
        onOk={handleRenameCategory}
        onCancel={() => {
          setIsRenameModalOpen(false);
          renameForm.resetFields();
          setEditingCategory(null);
        }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={renameForm} layout="vertical">
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
