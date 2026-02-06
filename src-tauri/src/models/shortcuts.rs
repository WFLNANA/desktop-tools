use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Runtime};
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuickAccessItem {
    pub id: String,
    pub name: String,
    pub target: String,
    pub kind: String, // 'website' | 'directory'
    pub description: Option<String>,
    pub icon: Option<String>,
    pub encrypted: bool,
    pub hidden: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateQuickAccessDto {
    pub name: String,
    pub target: String,
    pub kind: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub encrypted: bool,
    pub hidden: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateQuickAccessDto {
    pub name: Option<String>,
    pub target: Option<String>,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub encrypted: Option<bool>,
    pub hidden: Option<bool>,
}

pub struct ShortcutState {
    // 可以在这里放一些运行时缓存，如果有需要的话
}

impl ShortcutState {
    pub fn new() -> Self {
        Self {}
    }

    pub fn load<R: Runtime>(&self, _app: &AppHandle<R>) -> Result<()> {
        // 初始化逻辑，目前不需要做什么，表结构已经在 Database::new 中初始化
        Ok(())
    }
}
