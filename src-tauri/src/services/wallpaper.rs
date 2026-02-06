use crate::db::Database;
use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Arc;
use uuid::Uuid;
use rusqlite::params;

/**
 * 壁纸服务结构体
 * @description 处理壁纸相关的业务逻辑，包括本地壁纸管理和壁纸站API调用
 */
#[allow(dead_code)]
pub struct WallpaperService {
    db: Arc<Database>,
}

impl WallpaperService {
    /**
     * 创建壁纸服务实例
     * @param db 数据库连接
     */
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }
}

/**
 * 本地壁纸数据结构
 */
#[derive(Serialize, Deserialize, Clone)]
pub struct LocalWallpaper {
    pub id: String,
    pub name: String,
    pub file_path: String,
    pub file_name: String,
    pub file_type: String,
    pub file_size: i64,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub modified_at: String,
    pub created_at: String,
}

/**
 * 壁纸分类数据结构
 */
#[derive(Serialize, Deserialize, Clone)]
pub struct WallpaperCategory {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub count: Option<i32>,
}

/**
 * 壁纸站壁纸数据结构
 */
#[derive(Serialize, Deserialize, Clone)]
pub struct RemoteWallpaper {
    pub id: String,
    pub name: String,
    pub file_path: String,
    pub thumbnail_url: Option<String>,
    pub original_url: String,
    pub width: i32,
    pub height: i32,
    pub file_size: i64,
    pub category_id: Option<String>,
    pub category_name: Option<String>,
    pub author: Option<String>,
    pub tags: Vec<String>,
}

/**
 * 壁纸站分页响应
 */
#[derive(Serialize, Deserialize)]
pub struct WallpaperStationResponse {
    pub wallpapers: Vec<RemoteWallpaper>,
    pub total: i32,
    pub page: u32,
    pub page_size: u32,
    pub has_more: bool,
}

/**
 * 设置壁纸结果
 */
#[derive(Serialize, Deserialize)]
pub struct SetWallpaperResult {
    pub success: bool,
    pub message: Option<String>,
    pub error_code: Option<String>,
}

/**
 * 显示器信息
 */
#[derive(Serialize, Deserialize)]
pub struct MonitorInfo {
    pub id: String,
    pub name: String,
    pub width: i32,
    pub height: i32,
}

/**
 * 当前壁纸信息
 */
#[derive(Serialize, Deserialize)]
pub struct CurrentWallpaperInfo {
    pub file_path: String,
    pub fit_mode: String,
}

impl WallpaperService {
    /**
     * 获取所有本地壁纸
     */
    pub fn get_local_wallpapers(&self) -> Result<String, AppError> {
        let conn = self.db.get_connection();
        let conn = conn.lock().unwrap();
        
        // 先检查数据库中已有多少条记录
        let mut count_stmt = conn.prepare("SELECT COUNT(*) FROM wallpapers")?;
        let count: i64 = count_stmt.query_row([], |row| row.get(0))?;
        log::info!("[Rust] 数据库中 wallpapers 表已有记录数: {}", count);
        
        let mut stmt = conn.prepare(
            "SELECT id, name, file_path, file_name, file_type, file_size, width, height, modified_at, created_at 
             FROM wallpapers 
             ORDER BY created_at DESC"
        )?;
        
        let wallpaper_iter = stmt.query_map([], |row| {
            Ok(LocalWallpaper {
                id: row.get(0)?,
                name: row.get(1)?,
                file_path: row.get(2)?,
                file_name: row.get(3)?,
                file_type: row.get(4)?,
                file_size: row.get(5)?,
                width: row.get(6)?,
                height: row.get(7)?,
                modified_at: row.get(8)?,
                created_at: row.get(9)?,
            })
        })?;
        
        let mut wallpapers: Vec<LocalWallpaper> = vec![];
        for wallpaper in wallpaper_iter {
            wallpapers.push(wallpaper?);
        }
        
        log::info!("[Rust] get_local_wallpapers 返回记录数: {}", wallpapers.len());
        serde_json::to_string(&wallpapers).map_err(|e| AppError::Internal(e.to_string()))
    }

    /**
     * 导入壁纸文件
     */
    pub fn import_wallpapers(&self, file_paths: Vec<String>) -> Result<String, AppError> {
        log::info!("[Rust] 开始导入，收到文件数量: {}", file_paths.len());
        log::info!("[Rust] 收到的文件路径: {:?}", file_paths);
        
        let conn = self.db.get_connection();
        let conn = conn.lock().unwrap();
        let mut imported: Vec<LocalWallpaper> = vec![];
        
        for (index, path) in file_paths.iter().enumerate() {
            log::info!("[Rust] 处理第 {} 个文件: {}", index + 1, path);
            
            let path = Path::new(&path);
            if !path.exists() || !path.is_file() {
                log::info!("[Rust] 文件不存在或不是文件，跳过: {}", path.display());
                continue;
            }

            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                let image_exts = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg"];
                if !image_exts.iter().any(|e| e.eq_ignore_ascii_case(ext)) {
                    log::info!("[Rust] 文件扩展名不支持，跳过: {}", path.display());
                    continue;
                }
            }

            let file_name = path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("未知")
                .to_string();
            
            let path_str = path.to_string_lossy().to_string();
            
            log::info!("[Rust] 检查文件是否已存在: {}", path_str);
            
            let mut check_stmt = conn.prepare("SELECT COUNT(*) FROM wallpapers WHERE file_path = ?1")?;
            let count: i64 = check_stmt.query_row([&path_str], |row| row.get(0))?;
            
            if count > 0 {
                log::info!("[Rust] 文件已存在于数据库中，跳过: {}", path_str);
                continue;
            }
            
            let id = Uuid::new_v4().to_string();
            let now = chrono::Utc::now().to_rfc3339();
            
            let wallpaper = LocalWallpaper {
                id: id.clone(),
                name: file_name.clone(),
                file_path: path_str.clone(),
                file_name: file_name.clone(),
                file_type: path.extension()
                    .and_then(|e| e.to_str())
                    .unwrap_or("unknown")
                    .to_string(),
                file_size: path.metadata()
                    .map(|m| m.len() as i64)
                    .unwrap_or(0),
                width: None,
                height: None,
                modified_at: now.clone(),
                created_at: now.clone(),
            };

            conn.execute(
                "INSERT INTO wallpapers (id, name, file_path, file_name, file_type, file_size, width, height, modified_at, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                params![
                    wallpaper.id,
                    wallpaper.name,
                    wallpaper.file_path,
                    wallpaper.file_name,
                    wallpaper.file_type,
                    wallpaper.file_size,
                    wallpaper.width,
                    wallpaper.height,
                    wallpaper.modified_at,
                    wallpaper.created_at
                ],
            )?;

            imported.push(wallpaper);
        }

        log::info!("[Rust] 导入完成，共处理: {} 个文件", imported.len());
        serde_json::to_string(&imported).map_err(|e| AppError::Internal(e.to_string()))
    }

    /**
     * 从目录导入壁纸
     */
    pub fn import_wallpapers_from_directory(&self, directory_path: String) -> Result<String, AppError> {
        log::info!("[Rust] 开始从目录导入，目录路径: {}", directory_path);
        
        let dir_path = Path::new(&directory_path);
        if !dir_path.exists() || !dir_path.is_dir() {
            log::error!("[Rust] 目录不存在或不是目录: {}", directory_path);
            return Err(AppError::Internal(format!("目录不存在: {}", directory_path)));
        }

        let conn = self.db.get_connection();
        let conn = conn.lock().unwrap();
        let mut imported: Vec<LocalWallpaper> = vec![];
        let image_exts = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg"];

        let entries = std::fs::read_dir(dir_path)
            .map_err(|e| AppError::Internal(format!("读取目录失败: {}", e)))?;

        for entry in entries {
            let entry = entry.map_err(|e| AppError::Internal(format!("读取文件失败: {}", e)))?;
            let path = entry.path();

            if !path.is_file() {
                continue;
            }

            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                if !image_exts.iter().any(|e| e.eq_ignore_ascii_case(ext)) {
                    log::info!("[Rust] 跳过非图片文件: {}", path.display());
                    continue;
                }
            } else {
                log::info!("[Rust] 跳过无扩展名的文件: {}", path.display());
                continue;
            }

            let file_name = path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("未知")
                .to_string();
            
            let path_str = path.to_string_lossy().to_string();
            
            log::info!("[Rust] 检查文件是否已存在: {}", path_str);
            
            let mut check_stmt = conn.prepare("SELECT COUNT(*) FROM wallpapers WHERE file_path = ?1")?;
            let count: i64 = check_stmt.query_row([&path_str], |row| row.get(0))?;
            
            if count > 0 {
                log::info!("[Rust] 文件已存在于数据库中，跳过: {}", path_str);
                continue;
            }
            
            let id = Uuid::new_v4().to_string();
            let now = chrono::Utc::now().to_rfc3339();
            
            let wallpaper = LocalWallpaper {
                id: id.clone(),
                name: file_name.clone(),
                file_path: path_str.clone(),
                file_name: file_name.clone(),
                file_type: path.extension()
                    .and_then(|e| e.to_str())
                    .unwrap_or("unknown")
                    .to_string(),
                file_size: path.metadata()
                    .map(|m| m.len() as i64)
                    .unwrap_or(0),
                width: None,
                height: None,
                modified_at: now.clone(),
                created_at: now.clone(),
            };

            conn.execute(
                "INSERT INTO wallpapers (id, name, file_path, file_name, file_type, file_size, width, height, modified_at, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                params![
                    wallpaper.id,
                    wallpaper.name,
                    wallpaper.file_path,
                    wallpaper.file_name,
                    wallpaper.file_type,
                    wallpaper.file_size,
                    wallpaper.width,
                    wallpaper.height,
                    wallpaper.modified_at,
                    wallpaper.created_at
                ],
            )?;

            imported.push(wallpaper);
        }

        log::info!("[Rust] 目录导入完成，共导入: {} 张壁纸", imported.len());
        serde_json::to_string(&imported).map_err(|e| AppError::Internal(e.to_string()))
    }

    /**
     * 删除本地壁纸
     */
    pub fn delete_local_wallpaper(&self, wallpaper_id: String) -> Result<(), AppError> {
        let conn = self.db.get_connection();
        let conn = conn.lock().unwrap();
        
        conn.execute(
            "DELETE FROM wallpapers WHERE id = ?1",
            params![wallpaper_id],
        )?;
        
        Ok(())
    }

    /**
     * 批量删除本地壁纸
     */
    pub fn delete_local_wallpapers(&self, wallpaper_ids: Vec<String>) -> Result<(), AppError> {
        let conn = self.db.get_connection();
        let conn = conn.lock().unwrap();
        
        for id in wallpaper_ids {
            conn.execute(
                "DELETE FROM wallpapers WHERE id = ?1",
                params![id],
            )?;
        }
        
        Ok(())
    }

    /**
     * 获取壁纸缩略图
     */
    pub fn get_wallpaper_thumbnail(
        &self,
        _wallpaper_id: String,
        _width: u32,
        _height: u32,
    ) -> Result<String, AppError> {
        Ok(String::new())
    }

    /**
     * 获取壁纸站分类列表
     */
    pub fn get_wallpaper_categories(&self) -> Result<String, AppError> {
        let categories = vec![
            WallpaperCategory {
                id: "all".to_string(),
                name: "全部".to_string(),
                icon: None,
                color: None,
                count: None,
            },
            WallpaperCategory {
                id: "hot".to_string(),
                name: "热门".to_string(),
                icon: None,
                color: None,
                count: Some(100),
            },
            WallpaperCategory {
                id: "new".to_string(),
                name: "最新".to_string(),
                icon: None,
                color: None,
                count: Some(50),
            },
            WallpaperCategory {
                id: "scenery".to_string(),
                name: "风景".to_string(),
                icon: None,
                color: None,
                count: Some(200),
            },
            WallpaperCategory {
                id: "anime".to_string(),
                name: "动漫".to_string(),
                icon: None,
                color: None,
                count: Some(150),
            },
            WallpaperCategory {
                id: "abstract".to_string(),
                name: "抽象".to_string(),
                icon: None,
                color: None,
                count: Some(80),
            },
        ];
        serde_json::to_string(&categories).map_err(|e| AppError::Internal(e.to_string()))
    }

    /**
     * 获取壁纸站壁纸列表
     */
    pub fn get_wallpaper_station_wallpapers(
        &self,
        _category_id: Option<String>,
        page: u32,
        page_size: u32,
    ) -> Result<String, AppError> {
        let response = WallpaperStationResponse {
            wallpapers: vec![],
            total: 0,
            page,
            page_size,
            has_more: false,
        };
        serde_json::to_string(&response).map_err(|e| AppError::Internal(e.to_string()))
    }

    /**
     * 下载壁纸到本地
     */
    pub fn download_wallpaper(&self, wallpaper_id: String) -> Result<String, AppError> {
        let wallpaper = LocalWallpaper {
            id: wallpaper_id.clone(),
            name: "下载的壁纸".to_string(),
            file_path: String::new(),
            file_name: "wallpaper.png".to_string(),
            file_type: "png".to_string(),
            file_size: 0,
            width: None,
            height: None,
            modified_at: chrono::Utc::now().to_rfc3339(),
            created_at: chrono::Utc::now().to_rfc3339(),
        };
        serde_json::to_string(&wallpaper).map_err(|e| AppError::Internal(e.to_string()))
    }

    /**
     * 搜索壁纸
     */
    pub fn search_wallpapers(
        &self,
        _keyword: String,
        page: u32,
        page_size: u32,
    ) -> Result<String, AppError> {
        let response = WallpaperStationResponse {
            wallpapers: vec![],
            total: 0,
            page,
            page_size,
            has_more: false,
        };
        serde_json::to_string(&response).map_err(|e| AppError::Internal(e.to_string()))
    }

    /**
     * 设置系统壁纸
     */
    pub fn set_wallpaper(
        &self,
        wallpaper_id: String,
        _fit_mode: String,
        _monitor_id: Option<String>,
    ) -> Result<String, AppError> {
        let conn = self.db.get_connection();
        let conn = conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT file_path FROM wallpapers WHERE id = ?1")?;
        let file_path: String = stmt.query_row([&wallpaper_id], |row| row.get(0))
            .map_err(|e| AppError::Internal(format!("未找到壁纸: {}", e)))?;

        log::info!("[Rust] 设置壁纸，路径: {}", file_path);
        wallpaper::set_from_path(&file_path).map_err(|e| AppError::Internal(format!("设置壁纸失败: {}", e)))?;

        let result = SetWallpaperResult {
            success: true,
            message: Some("壁纸设置成功".to_string()),
            error_code: None,
        };
        serde_json::to_string(&result).map_err(|e| AppError::Internal(e.to_string()))
    }

    /**
     * 设置本地文件为壁纸
     */
    pub fn set_local_wallpaper(
        &self,
        file_path: String,
        _fit_mode: String,
        _monitor_id: Option<String>,
    ) -> Result<String, AppError> {
        log::info!("[Rust] 设置本地壁纸，路径: {}", file_path);
        wallpaper::set_from_path(&file_path).map_err(|e| AppError::Internal(format!("设置壁纸失败: {}", e)))?;

        let result = SetWallpaperResult {
            success: true,
            message: Some("壁纸设置成功".to_string()),
            error_code: None,
        };
        serde_json::to_string(&result).map_err(|e| AppError::Internal(e.to_string()))
    }

    /**
     * 获取当前壁纸信息
     */
    pub fn get_current_wallpaper(&self) -> Result<String, AppError> {
        let path = wallpaper::get().unwrap_or_default();
        let info = CurrentWallpaperInfo {
            file_path: path,
            fit_mode: "fill".to_string(),
        };
        serde_json::to_string(&info).map_err(|e| AppError::Internal(e.to_string()))
    }

    /**
     * 获取显示器列表
     */
    pub fn get_monitors(&self) -> Result<String, AppError> {
        let monitors = vec![MonitorInfo {
            id: "primary".to_string(),
            name: "主显示器".to_string(),
            width: 1920,
            height: 1080,
        }];
        serde_json::to_string(&monitors).map_err(|e| AppError::Internal(e.to_string()))
    }
}
