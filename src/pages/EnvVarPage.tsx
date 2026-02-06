import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  App,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  SyncOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { EnvironmentVariable, EnvVarCategory } from '../types';
import { envVarApi } from '../api/envVar';
import '../styles/env-var.scss';

export function EnvVarPage() {
  const { message } = App.useApp();
  const [data, setData] = useState<EnvironmentVariable[]>([]);
  const [categories, setCategories] = useState<EnvVarCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({});
  const [sortedInfo, setSortedInfo] = useState<SorterResult<EnvironmentVariable>>({});

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEnvVar, setEditingEnvVar] = useState<EnvironmentVariable | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [vars, cats] = await Promise.all([
        envVarApi.getEnvironmentVariables(),
        envVarApi.getEnvVarCategories(),
      ]);
      setData(vars);
      setCategories(cats);
    } catch (error: any) {
      message.error('加载环境变量失败: ' + error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      await envVarApi.createEnvVar(values);
      message.success('环境变量创建成功');
      setIsCreateModalOpen(false);
      createForm.resetFields();
      await fetchData();
    } catch (error: any) {
      if (error.errorFields) {
        message.error('请检查表单填写');
      } else {
        message.error('创建失败: ' + error);
      }
    }
  };

  const handleEdit = (record: EnvironmentVariable) => {
    setEditingEnvVar(record);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingEnvVar) return;

    try {
      const values = await editForm.validateFields();
      await envVarApi.updateEnvVar(editingEnvVar.id, values);
      message.success('环境变量更新成功');
      setIsEditModalOpen(false);
      setEditingEnvVar(null);
      editForm.resetFields();
      await fetchData();
    } catch (error: any) {
      if (error.errorFields) {
        message.error('请检查表单填写');
      } else {
        message.error('更新失败: ' + error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await envVarApi.deleteEnvVar(id);
      message.success('环境变量删除成功');
      await fetchData();
    } catch (error: any) {
      message.error('删除失败: ' + error);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的环境变量');
      return;
    }

    try {
      await envVarApi.deleteEnvVars(selectedRowKeys as string[]);
      message.success(`成功删除 ${selectedRowKeys.length} 个环境变量`);
      setSelectedRowKeys([]);
      await fetchData();
    } catch (error: any) {
      message.error('批量删除失败: ' + error);
    }
  };

  const handleSync = async (id: string) => {
    try {
      const updated = await envVarApi.syncEnvVar(id);
      message.success('环境变量同步成功');
      setData((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (error: any) {
      message.error('同步失败: ' + error);
    }
  };

  const handleSyncAll = async () => {
    setLoading(true);
    try {
      const updated = await envVarApi.syncAllEnvVars();
      setData(updated);
      message.success('所有环境变量同步成功');
    } catch (error: any) {
      message.error('同步失败: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleNameBlur = async (name: string) => {
    try {
      const result = await envVarApi.validateEnvVarName(name);
      if (!result.valid) {
        message.warning(result.error || '环境变量名称无效');
      }
    } catch (error: any) {
      console.error('验证失败:', error);
    }
  };

  const handleOpenSettings = async () => {
    try {
      await envVarApi.openEnvVarSettings();
    } catch (error: any) {
      message.error('打开系统环境变量设置失败: ' + error);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        !searchText ||
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.value.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchText.toLowerCase()));

      const matchCategory = !selectedCategory || item.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [data, searchText, selectedCategory]);

  const columns: ColumnsType<EnvironmentVariable> = useMemo(() => [
    {
      title: '变量名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortOrder: sortedInfo.columnKey === 'name' ? sortedInfo.order : null,
      render: (text) => (
        <Tooltip title="点击打开系统环境变量设置">
          <code 
            className="env-var-name" 
            onClick={handleOpenSettings}
            style={{ cursor: 'pointer' }}
          >
            {text}
          </code>
        </Tooltip>
      ),
    },
    {
      title: '当前值',
      dataIndex: 'value',
      key: 'value',
      ellipsis: {
        showTitle: false,
      },
      width: 350,
      sorter: (a, b) => a.value.localeCompare(b.value),
      sortOrder: sortedInfo.columnKey === 'value' ? sortedInfo.order : null,
      render: (text, record) => (
        <Tooltip placement="topLeft" title={text}>
          <span className={record.isModified ? 'env-var-value modified' : 'env-var-value'}>
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 80,
      filters: categories.map((cat) => ({ text: cat.name, value: cat.name })),
      filteredValue: filteredInfo.category || null,
      render: (text) => (
        <Tag color={categories.find((c) => c.name === text)?.color || 'blue'}>
          {text}
        </Tag>
      ),
    },
    {
      title: '类型',
      dataIndex: 'isSystem',
      key: 'isSystem',
      width: 80,
      filters: [
        { text: '系统变量', value: true },
        { text: '用户变量', value: false },
      ],
      filteredValue: filteredInfo.isSystem || null,
      render: (isSystem) => (
        <Tag color={isSystem ? 'orange' : 'green'}>
          {isSystem ? '系统变量' : '用户变量'}
        </Tag>
      ),
    },
    {
      title: '修改状态',
      dataIndex: 'isModified',
      key: 'isModified',
      width: 70,
      filters: [
        { text: '已修改', value: true },
        { text: '未修改', value: false },
      ],
      filteredValue: filteredInfo.isModified || null,
      render: (isModified) => (
        isModified ? (
          <Tag color="warning" icon={<WarningOutlined />}>已修改</Tag>
        ) : (
          <Tag>未修改</Tag>
        )
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
              style={{ padding: '4px 8px' }}
            />
          </Tooltip>
          <Tooltip title="同步到系统">
            <Button
              type="text"
              icon={<SyncOutlined />}
              size="small"
              onClick={() => handleSync(record.id)}
              style={{ padding: '4px 8px' }}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个环境变量吗？此操作不可恢复。"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okType="danger"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              style={{ padding: '4px 8px' }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ], [sortedInfo, filteredInfo, categories, selectedCategory]);

  return (
    <div className="main-content env-var-page">
      <div className="env-var-header">
        <div className="env-var-controls">
          <Space size={12}>
            <Input
              placeholder="搜索环境变量..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              placeholder="选择分类"
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: 150 }}
              allowClear
            >
              {categories.map((cat) => (
                <Select.Option key={cat.name} value={cat.name}>
                  {cat.name} ({cat.count})
                </Select.Option>
              ))}
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              icon={<SyncOutlined />}
              onClick={handleSyncAll}
              loading={loading}
            >
              同步全部
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={handleOpenSettings}
            >
              打开系统环境变量
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              新建
            </Button>
          </Space>
        </div>
      </div>

      <div className="env-var-content">
        {selectedRowKeys.length > 0 && (
          <div className="env-var-batch-actions">
            <Space>
              <span className="selected-count">已选择 {selectedRowKeys.length} 项</span>
              <Popconfirm
                title="确认批量删除"
                description={`确定要删除选中的 ${selectedRowKeys.length} 个环境变量吗？此操作不可恢复。`}
                onConfirm={handleBatchDelete}
                okText="删除"
                cancelText="取消"
                okType="danger"
              >
                <Button danger icon={<DeleteOutlined />}>
                  批量删除
                </Button>
              </Popconfirm>
            </Space>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
            getCheckboxProps: (record) => ({
              disabled: record.isSystem,
              name: record.name,
            }),
          }}
          onChange={(_pagination, filters, sorter) => {
            setFilteredInfo(filters);
            setSortedInfo(sorter as SorterResult<EnvironmentVariable>);
          }}
          scroll={{ x: 1400, y: 'calc(100vh - 252px)' }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            defaultPageSize: 50,
            pageSizeOptions: ['20', '50', '100', '200'],
          }}
          size="small"
        />
      </div>

      <Modal
        title="创建环境变量"
        open={isCreateModalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setIsCreateModalOpen(false);
          createForm.resetFields();
        }}
        okText="创建"
        cancelText="取消"
        width={600}
        forceRender
      >
        <Form form={createForm} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="变量名称"
            rules={[
              { required: true, message: '请输入变量名称' },
              {
                pattern: /^[A-Za-z_][A-Za-z0-9_]*$/,
                message: '变量名称只能包含字母、数字和下划线，且不能以数字开头',
              },
            ]}
          >
            <Input
              placeholder="例如: JAVA_HOME, PATH"
              onBlur={(e) => handleNameBlur(e.target.value)}
            />
          </Form.Item>
          <Form.Item
            name="value"
            label="变量值"
            rules={[{ required: true, message: '请输入变量值' }]}
          >
            <Input.TextArea
              placeholder="请输入变量值"
              rows={3}
              showCount
              maxLength={10000}
            />
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
            initialValue="其他"
          >
            <Select placeholder="选择分类">
              {categories.map((cat) => (
                <Select.Option key={cat.name} value={cat.name}>
                  {cat.name}
                </Select.Option>
              ))}
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea
              placeholder="请输入描述信息（可选）"
              rows={2}
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑环境变量"
        open={isEditModalOpen}
        onOk={handleUpdate}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingEnvVar(null);
          editForm.resetFields();
        }}
        okText="保存"
        cancelText="取消"
        width={600}
        afterOpenChange={(open) => {
          if (open && editingEnvVar) {
            editForm.setFieldsValue({
              value: editingEnvVar.value,
              description: editingEnvVar.description || '',
              category: editingEnvVar.category,
            });
          }
        }}
        forceRender
      >
        {editingEnvVar && (
          <Form form={editForm} layout="vertical" preserve={false}>
            <Form.Item label="变量名称">
              <Input value={editingEnvVar.name} disabled />
            </Form.Item>
            <Form.Item
              name="value"
              label="变量值"
              rules={[{ required: true, message: '请输入变量值' }]}
            >
              <Input.TextArea
                placeholder="请输入变量值"
                rows={3}
                showCount
                maxLength={10000}
              />
            </Form.Item>
            <Form.Item
              name="category"
              label="分类"
              rules={[{ required: true, message: '请选择分类' }]}
            >
              <Select placeholder="选择分类">
                {categories.map((cat) => (
                  <Select.Option key={cat.name} value={cat.name}>
                    {cat.name}
                  </Select.Option>
                ))}
                <Select.Option value="其他">其他</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="description" label="描述">
              <Input.TextArea
                placeholder="请输入描述信息（可选）"
                rows={2}
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
