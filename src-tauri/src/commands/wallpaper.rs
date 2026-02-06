use crate::error::{AppError, Result};
use crate::services::WallpaperService;
use crate::AppState;
use tauri::State;

/**
 * 获取本地壁纸列表
 * @param state 应用状态
 * @returns 本地壁纸数组JSON字符串
 */
#[tauri::command]
pub fn get_local_wallpapers(state: State<AppState>) -> Result<String> {
    let service = WallpaperService::new(state.db.clone());
    service.get_local_wallpapers()
}

/**
 * 导入本地壁纸
 * @param state 应用状态
 * @param file_paths 壁纸文件路径数组JSON字符串
 * @returns 导入的壁纸数组JSON字符串
 */
#[tauri::command]
pub fn import_wallpapers(state: State<AppState>, file_paths: String) -> Result<String> {
    let paths: Vec<String> = serde_json::from_str(&file_paths)?;
    let service = WallpaperService::new(state.db.clone());
    service.import_wallpapers(paths)
}

/**
 * 从目录导入壁纸
 * @param state 应用状态
 * @param directory_path 目录路径
 * @returns 导入的壁纸数组JSON字符串
 */
#[tauri::command]
pub fn import_wallpapers_from_directory(state: State<AppState>, directory_path: String) -> Result<String> {
    let service = WallpaperService::new(state.db.clone());
    service.import_wallpapers_from_directory(directory_path)
}

/**
 * 删除本地壁纸
 * @param state 应用状态
 * @param wallpaper_id 壁纸ID
 */
#[tauri::command]
pub fn delete_local_wallpaper(state: State<AppState>, wallpaper_id: String) -> Result<()> {
    let service = WallpaperService::new(state.db.clone());
    service.delete_local_wallpaper(wallpaper_id)
}

/**
 * 批量删除本地壁纸
 * @param state 应用状态
 * @param wallpaper_ids 壁纸ID数组JSON字符串
 */
#[tauri::command]
pub fn delete_local_wallpapers(state: State<AppState>, wallpaper_ids: String) -> Result<()> {
    let ids: Vec<String> = serde_json::from_str(&wallpaper_ids)?;
    let service = WallpaperService::new(state.db.clone());
    service.delete_local_wallpapers(ids)
}

/**
 * 获取壁纸缩略图
 * @param state 应用状态
 * @param wallpaper_id 壁纸ID
 * @param width 缩略图宽度
 * @param height 缩略图高度
 * @returns 缩略图数据URL
 */
#[tauri::command]
pub fn get_wallpaper_thumbnail(
    state: State<AppState>,
    wallpaper_id: String,
    width: u32,
    height: u32,
) -> Result<String> {
    let service = WallpaperService::new(state.db.clone());
    service.get_wallpaper_thumbnail(wallpaper_id, width, height)
}

/**
 * 获取壁纸站分类列表
 * @param state 应用状态
 * @returns 壁纸分类数组JSON字符串
 */
#[tauri::command]
pub fn get_wallpaper_categories(state: State<AppState>) -> Result<String> {
    let service = WallpaperService::new(state.db.clone());
    service.get_wallpaper_categories()
}

/**
 * 获取壁纸站壁纸列表
 * @param state 应用状态
 * @param category_id 分类ID（可选）
 * @param page 页码
 * @param page_size 每页数量
 * @returns 壁纸列表响应JSON字符串
 */
#[tauri::command]
pub fn get_wallpaper_station_wallpapers(
    state: State<AppState>,
    category_id: Option<String>,
    page: u32,
    page_size: u32,
) -> Result<String> {
    let service = WallpaperService::new(state.db.clone());
    service.get_wallpaper_station_wallpapers(category_id, page, page_size)
}

/**
 * 下载壁纸站壁纸到本地
 * @param state 应用状态
 * @param wallpaper_id 壁纸ID
 * @returns 下载后的壁纸信息JSON字符串
 */
#[tauri::command]
pub fn download_wallpaper(state: State<AppState>, wallpaper_id: String) -> Result<String> {
    let service = WallpaperService::new(state.db.clone());
    service.download_wallpaper(wallpaper_id)
}

/**
 * 搜索壁纸站壁纸
 * @param state 应用状态
 * @param keyword 搜索关键词
 * @param page 页码
 * @param page_size 每页数量
 * @returns 壁纸列表响应JSON字符串
 */
#[tauri::command]
pub fn search_wallpapers(
    state: State<AppState>,
    keyword: String,
    page: u32,
    page_size: u32,
) -> Result<String> {
    let service = WallpaperService::new(state.db.clone());
    service.search_wallpapers(keyword, page, page_size)
}

/**
 * 设置系统壁纸
 * @param state 应用状态
 * @param wallpaper_id 壁纸ID
 * @param fit_mode 适配模式
 * @param monitor_id 显示器ID（可选）
 * @returns 设置结果JSON字符串
 */
#[tauri::command]
pub fn set_wallpaper(
    state: State<AppState>,
    wallpaper_id: String,
    fit_mode: String,
    monitor_id: Option<String>,
) -> Result<String> {
    let service = WallpaperService::new(state.db.clone());
    service.set_wallpaper(wallpaper_id, fit_mode, monitor_id)
}

/**
 * 设置本地文件为壁纸
 * @param state 应用状态
 * @param file_path 文件路径
 * @param fit_mode 适配模式
 * @param monitor_id 显示器ID（可选）
 * @returns 设置结果JSON字符串
 */
#[tauri::command]
pub fn set_local_wallpaper(
    state: State<AppState>,
    file_path: String,
    fit_mode: String,
    monitor_id: Option<String>,
) -> Result<String> {
    let service = WallpaperService::new(state.db.clone());
    service.set_local_wallpaper(file_path, fit_mode, monitor_id)
}

/**
 * 获取当前系统壁纸信息
 * @param state 应用状态
 * @return壁纸信息JSON字符串
 */
#[tauri::command]
pub fn get_current_wallpaper(state: State<AppState>) -> Result<String> {
    let service = WallpaperService::new(state.db.clone());
    service.get_current_wallpaper()
}

/**
 * 获取可用显示器列表
 * @param state 应用状态
 * @returns 显示器数组JSON字符串
 */
#[tauri::command]
pub fn get_monitors(state: State<AppState>) -> Result<String> {
    let service = WallpaperService::new(state.db.clone());
    service.get_monitors()
}

/**
 * 打开文件选择对话框
 * @param title 对话框标题
 * @param multiple 是否允许多选
 * @param filters 文件过滤器 JSON 数组
 * @returns 选择的文件路径数组 JSON 字符串（用户取消返回空数组）
 */
#[tauri::command]
pub async fn open_file_dialog(
    window: tauri::WebviewWindow,
    title: Option<String>,
    _multiple: Option<bool>,
    filters: Option<String>,
) -> Result<String> {
    use tauri_plugin_dialog::DialogExt;

    let (tx, rx) = std::sync::mpsc::channel();
    
    let mut dialog = window.dialog().file();
    
    dialog = dialog.set_title(&title.unwrap_or_else(|| "选择文件".to_string()));
    dialog = dialog.add_filter("图片", &["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg"]);

    if let Some(filters_json) = filters {
        let _filters: Option<Vec<serde_json::Value>> = serde_json::from_str(&filters_json).ok();
    }

    dialog.pick_files(move |paths: Option<Vec<tauri_plugin_dialog::FilePath>>| {
        tx.send(paths).unwrap();
    });

    let result = rx.recv().unwrap();

    let paths: Vec<String> = result
        .map(|paths: Vec<tauri_plugin_dialog::FilePath>| {
            paths
                .iter()
                .map(|p: &tauri_plugin_dialog::FilePath| p.to_string())
                .collect()
        })
        .unwrap_or_default();

    serde_json::to_string(&paths).map_err(|e| AppError::Internal(e.to_string()))
}
