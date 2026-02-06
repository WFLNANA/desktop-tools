import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dropdown,
  Spin,
} from 'antd';
import {
  FolderOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  PushpinOutlined,
} from '@ant-design/icons';
import type { MenuProps, DropdownProps } from 'antd';
import type { CategoryNode } from '../../types';
import './CategoryList.scss';

interface CategoryListProps {
  categories: CategoryNode[];
  selectedCategory: CategoryNode | null;
  loading: boolean;
  onSelect: (category: CategoryNode) => void;
  onEdit: (category: CategoryNode) => void;
  onDelete: (id: number, name: string) => void;
  onPinToTop: (id: number) => void;
  onReorder: (orders: Array<[number, number]>) => void;
}

interface SortableCategoryItemProps {
  category: CategoryNode;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPinToTop: () => void;
}

function SortableCategoryItem({
  category,
  isSelected,
  isDragging,
  onSelect,
  onEdit,
  onDelete,
  onPinToTop,
}: SortableCategoryItemProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isItemDragging,
  } = useSortable({ id: category.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'pointer',
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        setDropdownOpen(false);
        onEdit();
      },
    },
    {
      key: 'pin',
      label: '置顶',
      icon: <PushpinOutlined />,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        setDropdownOpen(false);
        onPinToTop();
      },
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        setDropdownOpen(false);
        onDelete();
      },
    },
  ];

  const handleDropdownOpenChange: DropdownProps['onOpenChange'] = (open) => {
    setDropdownOpen(open);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-category-item ${isSelected ? 'selected' : ''} ${isItemDragging ? 'dragging' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="category-drag-handle" {...attributes} {...listeners}>
        <FolderOutlined className="category-icon" />
        <span className="category-name">{category.name}</span>
        <span className="category-count">({category.resource_count})</span>
      </div>
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        open={dropdownOpen}
        onOpenChange={handleDropdownOpenChange}
        placement="bottomRight"
        getPopupContainer={(trigger) => trigger.parentElement || document.body}
      >
        <div
          className={`category-actions ${dropdownOpen ? 'open' : ''}`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <MoreOutlined
            className="action-icon"
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(!dropdownOpen);
            }}
          />
        </div>
      </Dropdown>
    </div>
  );
}

function CategoryItemOverlay({ category }: { category: CategoryNode }) {
  return (
    <div className="category-item-overlay">
      <FolderOutlined className="category-icon" />
      <span className="category-name">{category.name}</span>
      <span className="category-count">({category.resource_count})</span>
    </div>
  );
}

export function CategoryList({
  categories,
  selectedCategory,
  loading,
  onSelect,
  onEdit,
  onDelete,
  onPinToTop,
  onReorder,
}: CategoryListProps) {
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = categories.findIndex((cat) => cat.id === active.id);
        const newIndex = categories.findIndex((cat) => cat.id === over.id);

        const newCategories = arrayMove(categories, oldIndex, newIndex);

        const orders: Array<[number, number]> = newCategories.map((cat, index) => [cat.id, index]);

        onReorder(orders);
      }

      setActiveId(null);
    },
    [categories, onReorder]
  );

  const activeCategory = activeId ? categories.find((cat) => cat.id === activeId) : null;

  if (loading) {
    return (
      <div className="category-list-loading">
        <Spin size="small" />
        <span>加载中...</span>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="category-list-empty">
        <FolderOutlined className="empty-icon" />
        <span>暂无分类</span>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={categories.map((cat) => cat.id)} strategy={verticalListSortingStrategy}>
        <div className="category-list-container">
          {categories.map((category) => (
            <SortableCategoryItem
              key={category.id}
              category={category}
              isSelected={selectedCategory?.id === category.id}
              isDragging={activeId === category.id}
              onSelect={() => onSelect(category)}
              onEdit={() => onEdit(category)}
              onDelete={() => onDelete(category.id, category.name)}
              onPinToTop={() => onPinToTop(category.id)}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeCategory ? <CategoryItemOverlay category={activeCategory} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
