/*
 * @Author       : wfl
 * @LastEditors  : wfl
 * @description  : 
 * @updateInfo   : 
 * @Date         : 2026-01-20 16:46:21
 * @LastEditTime : 2026-01-21 12:19:29
 */
// use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub parent_id: Option<i64>,
    pub sort_order: i32,
    pub has_password: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CategoryNode {
    #[serde(flatten)]
    pub category: Category,
    pub children: Vec<CategoryNode>,
    pub directory_count: i32,
    pub resource_count: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DirectoryBinding {
    pub id: i64,
    pub category_id: i64,
    pub directory_path: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceItem {
    pub id: i64,
    pub category_id: i64,
    pub file_name: String,
    pub file_path: String,
    pub file_size: i64,
    pub file_type: String,
    pub modified_at: String,
    pub scanned_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct OperationLog {
    pub id: i64,
    pub operation_type: String,
    pub operation_detail: Option<String>,
    pub operation_result: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct AppSetting {
    pub key: String,
    pub value: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCategoryRequest {
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub parent_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCategoryRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum DeleteStrategy {
    DeleteAll,
    PromoteChildren,
}
