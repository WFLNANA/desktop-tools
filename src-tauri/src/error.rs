/*
 * @Author       : wfl
 * @LastEditors  : wfl
 * @description  :
 * @updateInfo   :
 * @Date         : 2026-01-20 16:46:39
 * @LastEditTime : 2026-01-21 09:42:55
 */
use thiserror::Error;

#[derive(Debug, Error)]
#[allow(dead_code)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),

    #[error("Category not found")]
    CategoryNotFound,

    #[error("Invalid path: {0}")]
    InvalidPath(String),

    #[error("Invalid password")]
    InvalidPassword,

    #[error("Path not found: {0}")]
    PathNotFound(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("Internal error: {0}")]
    Internal(String),

    #[error("GPU error: {0}")]
    Gpu(String),

    #[error("NVML not available or failed to initialize")]
    NvmlUnavailable,

    #[error("WMI query failed: {0}")]
    WmiQuery(String),

    #[error("System error: {0}")]
    SystemError(String),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type Result<T> = std::result::Result<T, AppError>;
