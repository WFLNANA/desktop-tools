use crate::db::models::{DirectoryBinding, ResourceItem};
use crate::error::Result;
use crate::services::DirectoryService;
use crate::AppState;
use tauri::State;
use std::process::Command;
use rfd::AsyncFileDialog;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct BatchRenameRequest {
    pub file_paths: Vec<String>,
    pub new_name: String,
}

#[derive(Debug, Serialize)]
pub struct BatchRenameResult {
    pub success: Vec<String>,
    pub failed: Vec<String>,
}

#[tauri::command]
pub fn bind_directory(
    state: State<AppState>,
    category_id: i64,
    path: String,
) -> Result<DirectoryBinding> {
    let service = DirectoryService::new(state.db.clone());
    service.bind_directory(category_id, path)
}

#[tauri::command]
pub fn unbind_directory(state: State<AppState>, binding_id: i64) -> Result<()> {
    let service = DirectoryService::new(state.db.clone());
    service.unbind_directory(binding_id)
}

#[tauri::command]
pub fn get_bindings(state: State<AppState>, category_id: i64) -> Result<Vec<DirectoryBinding>> {
    let service = DirectoryService::new(state.db.clone());
    service.get_bindings(category_id)
}

#[derive(Debug, Serialize)]
pub struct ScanProgress {
    pub total_files: i64,
    pub scanned_files: i64,
    pub current_batch: Vec<ResourceItem>,
    pub is_complete: bool,
}

#[tauri::command]
pub fn scan_directory(
    state: State<AppState>,
    category_id: i64,
    show_hidden: bool,
    ignore_directories: Option<String>,
) -> Result<Vec<ResourceItem>> {
    let service = DirectoryService::new(state.db.clone());
    service.scan_directory(category_id, show_hidden, ignore_directories)
}

#[tauri::command]
pub fn scan_directory_batch(
    state: State<AppState>,
    category_id: i64,
    show_hidden: bool,
    ignore_directories: Option<String>,
    batch_size: Option<i32>,
) -> Result<ScanProgress> {
    let service = DirectoryService::new(state.db.clone());
    service.scan_directory_batch(category_id, show_hidden, ignore_directories, batch_size.unwrap_or(1000))
}

#[tauri::command]
pub fn open_in_explorer(path: String) -> Result<()> {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| crate::error::AppError::IoError(e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| crate::error::AppError::IoError(e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| crate::error::AppError::IoError(e))?;
    }

    Ok(())
}

#[tauri::command]
pub fn open_file_location(file_path: String) -> Result<()> {
    let path = std::path::Path::new(&file_path);

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .args(&["/select,", &file_path])
            .spawn()
            .map_err(|e| crate::error::AppError::IoError(e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(&["-R", &file_path])
            .spawn()
            .map_err(|e| crate::error::AppError::IoError(e))?;
    }

    #[cfg(target_os = "linux")]
    {
        let parent = path.parent()
            .ok_or_else(|| crate::error::AppError::InvalidPath("无法获取父目录".to_string()))?;
        Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| crate::error::AppError::IoError(e))?;
    }

    #[cfg(not(target_os = "linux"))]
    {
        let _ = path;
    }

    Ok(())
}

#[tauri::command]
pub async fn select_directory() -> Result<Option<String>> {
    let file_dialog = AsyncFileDialog::new();
    let result = file_dialog.pick_folder().await;
    
    match result {
        Some(path) => Ok(Some(path.path().to_string_lossy().to_string())),
        None => Ok(None),
    }
}

#[tauri::command]
pub fn batch_rename_files(request: BatchRenameRequest) -> Result<BatchRenameResult> {
    let mut success = Vec::new();
    let mut failed = Vec::new();

    for (index, file_path) in request.file_paths.iter().enumerate() {
        let path = std::path::Path::new(file_path);
        
        if !path.exists() {
            failed.push(file_path.clone());
            continue;
        }

        let parent = match path.parent() {
            Some(p) => p,
            None => {
                failed.push(file_path.clone());
                continue;
            }
        };

        let extension = path.extension()
            .and_then(|e| e.to_str())
            .unwrap_or("");

        let new_file_name = if extension.is_empty() {
            format!("{}{}", request.new_name, index + 1)
        } else {
            format!("{}{}.{}", request.new_name, index + 1, extension)
        };

        let new_path = parent.join(&new_file_name);

        match std::fs::rename(path, &new_path) {
            Ok(_) => success.push(new_path.to_string_lossy().to_string()),
            Err(_) => failed.push(file_path.clone()),
        }
    }

    Ok(BatchRenameResult { success, failed })
}
