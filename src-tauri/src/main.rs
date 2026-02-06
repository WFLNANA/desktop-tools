/*
 * @Author       : wfl
 * @LastEditors  : wfl
 * @description  : 
 * @updateInfo   : 
 * @Date         : 2026-01-20 16:23:53
 * @LastEditTime : 2026-02-05 17:14:50
 */
// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod models;
mod commands;
mod db;
mod error;
mod gpu;
mod services;

use db::Database;
use models::shortcuts::ShortcutState;
use std::sync::Arc;
use tauri::Manager;
use commands::{setup_window_listeners, setup_system_tray};

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<Database>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn main() {
    tauri::Builder::<tauri::Wry>::new()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // 获取应用数据目录
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            // 确保目录存在
            std::fs::create_dir_all(&app_dir).expect("Failed to create app data directory");

            // 初始化数据库
            let db_path = app_dir.join("local_resource_manager.db");
            let db = Database::new(db_path).expect("Failed to initialize database");

            // 设置应用状态
            app.manage(AppState { db: Arc::new(db) });
            
            // 初始化 ShortcutState 并加载数据
            let shortcut_state = ShortcutState::new();
            if let Err(e) = shortcut_state.load(app.handle()) {
                eprintln!("Failed to load shortcuts: {}", e);
            }
            app.manage(shortcut_state);

            setup_window_listeners(&app);
            tauri::async_runtime::block_on(async move {
                setup_system_tray(&app).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_category,
            commands::update_category,
            commands::delete_category,
            commands::get_category_tree,
            commands::reorder_categories,
            commands::bind_directory,
            commands::unbind_directory,
            commands::get_bindings,
            commands::scan_directory,
            commands::scan_directory_batch,
            commands::select_directory,
            commands::open_in_explorer,
            commands::open_file_location,
            commands::batch_rename_files,
            commands::get_local_wallpapers,
            commands::import_wallpapers,
            commands::import_wallpapers_from_directory,
            commands::delete_local_wallpaper,
            commands::delete_local_wallpapers,
            commands::get_wallpaper_thumbnail,
            commands::get_wallpaper_categories,
            commands::get_wallpaper_station_wallpapers,
            commands::download_wallpaper,
            commands::search_wallpapers,
            commands::set_wallpaper,
            commands::set_local_wallpaper,
            commands::get_current_wallpaper,
            commands::get_monitors,
            commands::open_file_dialog,
            commands::get_system_info,
            commands::get_env_vars,
            commands::get_env_var_categories,
            commands::create_env_var,
            commands::delete_env_vars,
            commands::sync_env_var,
            commands::sync_all_env_vars,
            commands::validate_env_var_name,
            commands::open_env_var_settings,
            commands::get_shortcuts,
            commands::create_shortcut,
            commands::update_shortcut,
            commands::delete_shortcut,
            commands::open_shortcut,
            commands::set_global_password,
            commands::verify_password,
            commands::has_password,
            commands::fetch_website_metadata,
            commands::cards::get_desktop_cards,
            commands::cards::create_desktop_card,
            commands::cards::update_desktop_card,
            commands::cards::update_card_position,
            commands::cards::delete_desktop_card,
            commands::cards::open_card_window,
            commands::cards::close_card_window,
            commands::cards::update_card_order,
            commands::update_env_var,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
