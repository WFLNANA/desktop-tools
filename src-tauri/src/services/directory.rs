use crate::db::models::{DirectoryBinding, ResourceItem};
use crate::db::Database;
use crate::error::{AppError, Result};
use crate::commands::directory::ScanProgress;
use rusqlite::params;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use walkdir::WalkDir;
use std::cell::RefCell;

thread_local! {
    static SCAN_STATE: RefCell<ScanState> = RefCell::new(ScanState::new());
}

struct ScanState {
    all_resources: Vec<ResourceItem>,
    current_index: usize,
    is_complete: bool,
    category_id: i64,
}

impl ScanState {
    fn new() -> Self {
        ScanState {
            all_resources: Vec::new(),
            current_index: 0,
            is_complete: false,
            category_id: 0,
        }
    }

    fn reset(&mut self, category_id: i64) {
        self.all_resources.clear();
        self.current_index = 0;
        self.is_complete = false;
        self.category_id = category_id;
    }

    fn add_resources(&mut self, resources: Vec<ResourceItem>) {
        self.all_resources.extend(resources);
    }

    fn get_next_batch(&mut self, batch_size: usize) -> Vec<ResourceItem> {
        let end = (self.current_index + batch_size).min(self.all_resources.len());
        let batch = self.all_resources[self.current_index..end].to_vec();
        self.current_index = end;
        
        if self.current_index >= self.all_resources.len() {
            self.is_complete = true;
        }
        
        batch
    }

    fn get_total_count(&self) -> i64 {
        self.all_resources.len() as i64
    }

    fn get_scanned_count(&self) -> i64 {
        self.current_index as i64
    }
}

pub struct DirectoryService {
    db: Arc<Database>,
}

impl DirectoryService {
    pub fn new(db: Arc<Database>) -> Self {
        DirectoryService { db }
    }

    /// 绑定目录
    pub fn bind_directory(&self, category_id: i64, path: String) -> Result<DirectoryBinding> {
        // 验证路径
        let path_buf = PathBuf::from(&path);
        if !path_buf.exists() {
            return Err(AppError::PathNotFound(path.clone()));
        }
        if !path_buf.is_dir() {
            return Err(AppError::InvalidInput("Path is not a directory".to_string()));
        }

        let conn = self.db.get_connection();
        let conn = conn.lock().unwrap();

        // 检查分类是否存在
        let exists: bool = conn
            .query_row(
                "SELECT COUNT(*) FROM categories WHERE id = ?",
                params![category_id],
                |row| row.get::<_, i32>(0).map(|count| count > 0),
            )
            .unwrap_or(false);

        if !exists {
            return Err(AppError::CategoryNotFound);
        }

        // 插入绑定
        conn.execute(
            "INSERT INTO directory_bindings (category_id, directory_path) VALUES (?, ?)",
            params![category_id, path],
        )?;

        let id = conn.last_insert_rowid();

        // 查询并返回
        let binding = conn.query_row(
            "SELECT id, category_id, directory_path, created_at FROM directory_bindings WHERE id = ?",
            params![id],

            |row| {
                Ok(DirectoryBinding {
                    id: row.get(0)?,
                    category_id: row.get(1)?,
                    directory_path: row.get(2)?,
                    created_at: row.get(3)?,
                })
            },
        )?;

        Ok(binding)
    }

    /// 移除绑定
    pub fn unbind_directory(&self, binding_id: i64) -> Result<()> {
        let conn = self.db.get_connection();
        let conn = conn.lock().unwrap();

        conn.execute(
            "DELETE FROM directory_bindings WHERE id = ?",
            params![binding_id],
        )?;

        Ok(())
    }

    /// 获取分类的所有绑定
    pub fn get_bindings(&self, category_id: i64) -> Result<Vec<DirectoryBinding>> {
        let conn = self.db.get_connection();
        let conn = conn.lock().unwrap();

        let mut stmt = conn.prepare(
            "SELECT id, category_id, directory_path, created_at 
             FROM directory_bindings 
             WHERE category_id = ?",
        )?;

        let bindings = stmt
            .query_map(params![category_id], |row| {
                Ok(DirectoryBinding {
                    id: row.get(0)?,
                    category_id: row.get(1)?,
                    directory_path: row.get(2)?,
                    created_at: row.get(3)?,
                })
            })?
            .collect::<std::result::Result<Vec<_>, _>>()?;

        Ok(bindings)
    }

    /// 扫描目录
    pub fn scan_directory(&self, category_id: i64, show_hidden: bool, ignore_directories: Option<String>) -> Result<Vec<ResourceItem>> {
        let bindings = self.get_bindings(category_id)?;
        let mut all_resources = Vec::new();

        // 解析忽略的目录列表
        let ignore_dirs: Vec<String> = ignore_directories
            .map(|s| {
                s.split(',')
                    .map(|d| d.trim().to_lowercase())
                    .filter(|d| !d.is_empty())
                    .collect()
            })
            .unwrap_or_default();

        for binding in bindings {
            let resources = self.scan_path(&binding.directory_path, show_hidden, &ignore_dirs)?;
            all_resources.extend(resources);
        }

        // 保存到数据库
        self.save_resources(category_id, &all_resources)?;

        Ok(all_resources)
    }

    /// 分批扫描目录
    pub fn scan_directory_batch(&self, category_id: i64, show_hidden: bool, ignore_directories: Option<String>, batch_size: i32) -> Result<ScanProgress> {
        SCAN_STATE.with(|state| {
            let mut scan_state = state.borrow_mut();

            // 如果是第一次扫描或分类ID不同，重新开始扫描
            if scan_state.category_id != category_id || scan_state.is_complete {
                scan_state.reset(category_id);

                let bindings = self.get_bindings(category_id)?;

                // 解析忽略的目录列表
                let ignore_dirs: Vec<String> = ignore_directories
                    .map(|s| {
                        s.split(',')
                            .map(|d| d.trim().to_lowercase())
                            .filter(|d| !d.is_empty())
                            .collect()
                    })
                    .unwrap_or_default();

                for binding in bindings {
                    let resources = self.scan_path(&binding.directory_path, show_hidden, &ignore_dirs)?;
                    scan_state.add_resources(resources);
                }

                // 保存到数据库
                self.save_resources(category_id, &scan_state.all_resources)?;
            }

            // 获取下一批数据
            let current_batch = scan_state.get_next_batch(batch_size as usize);

            Ok(ScanProgress {
                total_files: scan_state.get_total_count(),
                scanned_files: scan_state.get_scanned_count(),
                current_batch,
                is_complete: scan_state.is_complete,
            })
        })
    }

    /// 扫描单个路径
    fn scan_path(&self, path: &str, show_hidden: bool, ignore_directories: &[String]) -> Result<Vec<ResourceItem>> {
        let mut resources = Vec::new();

        for entry in WalkDir::new(path).follow_links(false) {
            match entry {
                Ok(entry) => {
                    // 检查是否应该跳过该目录
                    if entry.file_type().is_dir() {
                        if let Some(dir_name) = entry.file_name().to_str() {
                            if ignore_directories.contains(&dir_name.to_lowercase()) {
                                // 跳过该目录及其子目录
                                continue;
                            }
                        }
                    }

                    if entry.file_type().is_file() {
                        let file_path = entry.path();
                        
                        // 检查是否为隐藏文件
                        if !show_hidden && is_hidden(file_path) {
                            continue;
                        }

                        // 检查文件路径中是否包含忽略的目录
                        let should_skip = ignore_directories.iter().any(|ignore_dir| {
                            file_path.components()
                                .any(|component| {
                                    component.as_os_str()
                                        .to_str()
                                        .map(|s| s.eq_ignore_ascii_case(ignore_dir))
                                        .unwrap_or(false)
                                })
                        });

                        if should_skip {
                            continue;
                        }

                        if let Ok(metadata) = entry.metadata() {
                            let file_name = entry.file_name().to_string_lossy().to_string();
                            let file_path_str = file_path.to_string_lossy().to_string();
                            let file_size = metadata.len() as i64;
                            let file_type = get_file_type(file_path);
                            let modified_at = metadata
                                .modified()
                                .ok()
                                .and_then(|t| chrono::DateTime::<chrono::Utc>::from(t).to_rfc3339().parse().ok())
                                .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

                            resources.push(ResourceItem {
                                id: 0, // 临时 ID
                                category_id: 0, // 临时 category_id
                                file_name,
                                file_path: file_path_str,
                                file_size,
                                file_type,
                                modified_at,
                                scanned_at: chrono::Utc::now().to_rfc3339(),
                            });
                        }
                    }
                }
                Err(e) => {
                    log::warn!("Failed to read entry: {}", e);
                }
            }
        }

        Ok(resources)
    }

    /// 保存资源到数据库
    fn save_resources(&self, category_id: i64, resources: &[ResourceItem]) -> Result<()> {
        let conn = self.db.get_connection();
        let conn = conn.lock().unwrap();

        // 先删除该分类的旧资源
        conn.execute(
            "DELETE FROM resources WHERE category_id = ?",
            params![category_id],
        )?;

        // 批量插入新资源
        for resource in resources {
            conn.execute(
                "INSERT OR REPLACE INTO resources 
                 (category_id, file_name, file_path, file_size, file_type, modified_at) 
                 VALUES (?, ?, ?, ?, ?, ?)",
                params![
                    category_id,
                    resource.file_name,
                    resource.file_path,
                    resource.file_size,
                    resource.file_type,
                    resource.modified_at,
                ],
            )?;
        }

        Ok(())
    }
}

/// 检查文件是否为隐藏文件
fn is_hidden(path: &Path) -> bool {
    path.file_name()
        .and_then(|name| name.to_str())
        .map(|name| name.starts_with('.'))
        .unwrap_or(false)
}

/// 获取文件类型
fn get_file_type(path: &Path) -> String {
    path.extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("unknown")
        .to_string()
}
