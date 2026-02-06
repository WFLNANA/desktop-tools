use tauri::{Manager, WindowEvent, image::Image};

pub fn setup_window_listeners(app: &tauri::App) {
    let app_handle = app.app_handle().clone();
    
    if let Some(window) = app.get_webview_window("main") {
        let handle = window.clone();
        
        let _ = window.on_window_event(move |event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let state = app_handle.state::<crate::AppState>();
                let db = &*state.db;
                let behavior = db.get_close_behavior().unwrap_or(None).unwrap_or_else(|| "exit".to_string());
                
                if behavior == "minimize" {
                    api.prevent_close();
                    let _ = handle.hide();
                }
            }
        });
    }
}

pub async fn setup_system_tray(app: &tauri::App) {
    use tauri::menu::MenuItem;
    use tauri::menu::Menu;
    use tauri::tray::TrayIconBuilder;
    
    let app_handle = app.app_handle().clone();
    
    let quit_i = MenuItem::with_id(&app_handle, "quit", "退出", true, None::<&str>).unwrap();
    let show_i = MenuItem::with_id(&app_handle, "show", "显示窗口", true, None::<&str>).unwrap();
    // let about_i = MenuItem::with_id(&app_handle, "about", "关于", true, None::<&str>).unwrap();
    
    let menu = Menu::with_items(&app_handle, &[&show_i, &quit_i]).unwrap();

    let icon = Image::from_bytes(include_bytes!("../../icons/logo.png")).unwrap();
    
    let _tray = TrayIconBuilder::new()
        .icon(icon)
        .menu(&menu)
        .tooltip("大胖工具箱")
        .build(&app_handle)
        .unwrap();
    
    let app_handle_clone = app_handle.clone();
    
    _tray.on_menu_event(move |_tray, event| {
        let tauri::menu::MenuEvent { id, .. } = event;
        if id.as_ref() == "show" {
            let _ = app_handle_clone.get_webview_window("main").unwrap().show();
            let _ = app_handle_clone.get_webview_window("main").unwrap().set_focus();
        } else if id.as_ref() == "quit" {
            let _ = app_handle_clone.exit(0);
        } else if id.as_ref() == "about" {
            let _ = app_handle_clone.get_webview_window("about").unwrap().show();
            let _ = app_handle_clone.get_webview_window("about").unwrap().set_focus();
        }
    });
    // let app_handle_tray = app_handle.clone();
    // _tray.on_tray_icon_event(move |_tray, event| {
    //     if let TrayIconEvent::DoubleClick { .. } = event {
    //         let _ = app_handle_tray.get_webview_window("main").unwrap().show();
    //         let _ = app_handle_tray.get_webview_window("main").unwrap().set_focus();
    //     }
    // });
}
