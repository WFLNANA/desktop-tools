use crate::db::models::{Category, CategoryNode, CreateCategoryRequest, DeleteStrategy, UpdateCategoryRequest};
use crate::error::Result;
use crate::services::CategoryService;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn create_category(
    state: State<AppState>,
    req: CreateCategoryRequest,
) -> Result<Category> {
    let service = CategoryService::new(state.db.clone());
    service.create_category(req)
}

#[tauri::command]
pub fn update_category(
    state: State<AppState>,
    id: i64,
    req: UpdateCategoryRequest,
) -> Result<Category> {
    let service = CategoryService::new(state.db.clone());
    service.update_category(id, req)
}

#[tauri::command]
pub fn delete_category(
    state: State<AppState>,
    id: i64,
    strategy: DeleteStrategy,
) -> Result<()> {
    let service = CategoryService::new(state.db.clone());
    service.delete_category(id, strategy)
}

#[tauri::command]
pub fn get_category_tree(state: State<AppState>) -> Result<Vec<CategoryNode>> {
    let service = CategoryService::new(state.db.clone());
    service.get_category_tree()
}

#[tauri::command]
pub fn reorder_categories(
    state: State<AppState>,
    orders: Vec<(i64, i32)>,
) -> Result<()> {
    let service = CategoryService::new(state.db.clone());
    service.reorder_categories(orders)
}
