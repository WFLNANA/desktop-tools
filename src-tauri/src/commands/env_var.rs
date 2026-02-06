use crate::error::Result;
use crate::services::env_var::{
    CreateEnvVarRequest, EnvVarCategory, EnvironmentVariable, UpdateEnvVarRequest,
    ValidateNameResult,
};
use crate::services::EnvVarService;

#[tauri::command]
pub fn get_env_vars() -> Result<Vec<EnvironmentVariable>> {
    EnvVarService::get_env_vars()
}

#[tauri::command]
pub fn get_env_var_categories() -> Result<Vec<EnvVarCategory>> {
    EnvVarService::get_env_var_categories()
}

#[tauri::command]
pub fn create_env_var(req: CreateEnvVarRequest) -> Result<EnvironmentVariable> {
    EnvVarService::create_env_var(req)
}

#[tauri::command]
pub fn update_env_var(id: String, req: UpdateEnvVarRequest) -> Result<EnvironmentVariable> {
    EnvVarService::update_env_var(id, req)
}

#[tauri::command]
pub fn delete_env_var(id: String) -> Result<()> {
    EnvVarService::delete_env_var(id)
}

#[tauri::command]
pub fn delete_env_vars(ids: Vec<String>) -> Result<()> {
    EnvVarService::delete_env_vars(ids)
}

#[tauri::command]
pub fn sync_env_var(id: String) -> Result<EnvironmentVariable> {
    EnvVarService::sync_env_var(id)
}

#[tauri::command]
pub fn sync_all_env_vars() -> Result<Vec<EnvironmentVariable>> {
    EnvVarService::sync_all_env_vars()
}

#[tauri::command]
pub fn validate_env_var_name(name: String) -> Result<ValidateNameResult> {
    Ok(EnvVarService::validate_env_var_name(&name))
}

#[tauri::command]
pub fn open_env_var_settings() -> Result<()> {
    EnvVarService::open_env_var_settings()
}
