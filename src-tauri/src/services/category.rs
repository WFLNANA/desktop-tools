use crate::db::models::{Category, CategoryNode, CreateCategoryRequest, DeleteStrategy, UpdateCategoryRequest};
use crate::db::Database;
use crate::error::{AppError, Result};
use rusqlite::params;
use std::sync::Arc;

pub struct CategoryService {
    db: Arc<Database>,
}

impl CategoryService {
    pub fn new(db: Arc<Database>) -> Self {
        CategoryService { db }
    }

    /// 创建分类
    pub fn create_category(&self, req: CreateCategoryRequest) -> Result<Category> {
        let conn = self.db.get_connection();
        let conn = conn.lock().unwrap();

        // 获取同级分类的最大排序值
        let max_sort_order: i32 = conn
            .query_row(
                "SELECT COALESCE(MAX(sort_order), -1) FROM categories WHERE parent_id IS ?",
                params![req.parent_id],
                |row| row.get(0),
            )
            .unwrap_or(-1);

        conn.execute(
            "INSERT INTO categories (name, description, icon, color, parent_id, sort_order)
             VALUES (?, ?, ?, ?, ?, ?)",
            params![
                req.name,
                req.description,
                req.icon,
                req.color,
                req.parent_id,
                max_sort_order + 1
            ],
        )?;

        let id = conn.last_insert_rowid();

        // 查询并返回创建的分类
        let category = conn.query_row(
            "SELECT id, name, description, icon, color, parent_id, sort_order,
                    password_hash IS NOT NULL as has_password,
                    created_at, updated_at
             FROM categories WHERE id = ?",
            params![id],
            |row| {
                Ok(Category {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    icon: row.get(3)?,
                    color: row.get(4)?,
                    parent_id: row.get(5)?,
                    sort_order: row.get(6)?,
                    has_password: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            },
        )?;

        Ok(category)
    }

    /// 更新分类
    pub fn update_category(&self, id: i64, req: UpdateCategoryRequest) -> Result<Category> {
        let conn = self.db.get_connection();
        let conn = conn.lock().unwrap();

        // 检查分类是否存在
        let exists: bool = conn
            .query_row(
                "SELECT COUNT(*) FROM categories WHERE id = ?",
                params![id],
                |row| row.get::<_, i32>(0).map(|count| count > 0),
            )
            .unwrap_or(false);

        if !exists {
            return Err(AppError::CategoryNotFound);
        }

        // 构建动态更新语句
        let mut updates = Vec::new();
        let mut values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(name) = req.name {
            updates.push("name = ?");
            values.push(Box::new(name));
        }
        if let Some(description) = req.description {
            updates.push("description = ?");
            values.push(Box::new(description));
        }
        if let Some(icon) = req.icon {
            updates.push("icon = ?");
            values.push(Box::new(icon));
        }
        if let Some(color) = req.color {
            updates.push("color = ?");
            values.push(Box::new(color));
        }
        if let Some(sort_order) = req.sort_order {
            updates.push("sort_order = ?");
            values.push(Box::new(sort_order));
        }

        if !updates.is_empty() {
            updates.push("updated_at = CURRENT_TIMESTAMP");
            let sql = format!("UPDATE categories SET {} WHERE id = ?", updates.join(", "));
            values.push(Box::new(id));

            let params: Vec<&dyn rusqlite::ToSql> = values.iter().map(|v| v.as_ref()).collect();
            conn.execute(&sql, params.as_slice())?;
        }

        // 查询并返回更新后的分类
        let category = conn.query_row(
            "SELECT id, name, description, icon, color, parent_id, sort_order,
                    password_hash IS NOT NULL as has_password,
                    created_at, updated_at
             FROM categories WHERE id = ?",
            params![id],
            |row| {
                Ok(Category {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    icon: row.get(3)?,
                    color: row.get(4)?,
                    parent_id: row.get(5)?,
                    sort_order: row.get(6)?,
                    has_password: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            },
        )?;

        Ok(category)
    }

    /// 删除分类
    pub fn delete_category(&self, id: i64, strategy: DeleteStrategy) -> Result<()> {
        let conn = self.db.get_connection();
        let conn = conn.lock().unwrap();

        // 检查分类是否存在
        let category: Option<(i64, Option<i64>)> = conn
            .query_row(
                "SELECT id, parent_id FROM categories WHERE id = ?",
                params![id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .ok();

        if category.is_none() {
            return Err(AppError::CategoryNotFound);
        }

        let (_, parent_id) = category.unwrap();

        match strategy {
            DeleteStrategy::DeleteAll => {
                // 直接删除，级联删除会自动处理子分类
                conn.execute("DELETE FROM categories WHERE id = ?", params![id])?;
            }
            DeleteStrategy::PromoteChildren => {
                // 将子分类提升到上一级
                conn.execute(
                    "UPDATE categories SET parent_id = ? WHERE parent_id = ?",
                    params![parent_id, id],
                )?;
                // 删除当前分类
                conn.execute("DELETE FROM categories WHERE id = ?", params![id])?;
            }
        }

        Ok(())
    }

    /// 获取分类树
    pub fn get_category_tree(&self) -> Result<Vec<CategoryNode>> {
        log::info!("Getting category tree");
        
        let (categories, stats) = {
            let conn = self.db.get_connection();
            let conn = conn.lock().unwrap();

            // 获取所有分类
            let mut stmt = conn.prepare(
                "SELECT id, name, description, icon, color, parent_id, sort_order,
                        password_hash IS NOT NULL as has_password,
                        created_at, updated_at
                 FROM categories
                 ORDER BY sort_order",
            )?;

            let categories: Vec<Category> = stmt
                .query_map([], |row| {
                    Ok(Category {
                        id: row.get(0)?,
                        name: row.get(1)?,
                        description: row.get(2)?,
                        icon: row.get(3)?,
                        color: row.get(4)?,
                        parent_id: row.get(5)?,
                        sort_order: row.get(6)?,
                        has_password: row.get(7)?,
                        created_at: row.get(8)?,
                        updated_at: row.get(9)?,
                    })
                })?
                .collect::<std::result::Result<Vec<_>, _>>()?;

            log::info!("Found {} categories", categories.len());

            // 获取所有分类的统计信息
            let mut stats = std::collections::HashMap::new();
            for category in &categories {
                let directory_count: i32 = conn
                    .query_row(
                        "SELECT COUNT(*) FROM directory_bindings WHERE category_id = ?",
                        params![category.id],
                        |row| row.get(0),
                    )
                    .unwrap_or(0);

                let resource_count: i32 = conn
                    .query_row(
                        "SELECT COUNT(*) FROM resources WHERE category_id = ?",
                        params![category.id],
                        |row| row.get(0),
                    )
                    .unwrap_or(0);

                stats.insert(category.id, (directory_count, resource_count));
            }
            
            (categories, stats)
        }; // conn 在这里被释放

        // 构建树结构
        let tree = Self::build_tree_static(&categories, &stats, None);

        log::info!("Built tree with {} root nodes", tree.len());

        Ok(tree)
    }

    /// 构建分类树（静态方法，不需要数据库连接）
    fn build_tree_static(
        categories: &[Category],
        stats: &std::collections::HashMap<i64, (i32, i32)>,
        parent_id: Option<i64>,
    ) -> Vec<CategoryNode> {
        let mut nodes = Vec::new();

        for category in categories {
            if category.parent_id == parent_id {
                let (directory_count, resource_count) = stats.get(&category.id).copied().unwrap_or((0, 0));

                // 递归构建子节点
                let children = Self::build_tree_static(categories, stats, Some(category.id));

                nodes.push(CategoryNode {
                    category: category.clone(),
                    children,
                    directory_count,
                    resource_count,
                });
            }
        }

        nodes
    }

    /// 调整分类顺序
    pub fn reorder_categories(&self, orders: Vec<(i64, i32)>) -> Result<()> {
        let conn = self.db.get_connection();
        let conn = conn.lock().unwrap();

        for (id, sort_order) in orders {
            conn.execute(
                "UPDATE categories SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                params![sort_order, id],
            )?;
        }

        Ok(())
    }
}
