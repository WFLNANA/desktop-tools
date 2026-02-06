use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Local;

#[derive(Debug, Serialize, Deserialize)]
pub struct DesktopCard {
    pub id: String,
    #[serde(rename = "type")]
    pub card_type: String,
    pub title: Option<String>,
    pub config: String, // JSON string
    pub position_x: i32,
    pub position_y: i32,
    pub width: i32,
    pub height: i32,
    pub z_index: i32,
    pub is_visible: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCardPayload {
    #[serde(rename = "type")]
    pub card_type: String,
    pub title: Option<String>,
    pub config: String,
    pub position_x: i32,
    pub position_y: i32,
    pub width: i32,
    pub height: i32,
}

#[tauri::command]
pub async fn get_desktop_cards(state: State<'_, AppState>) -> Result<Vec<DesktopCard>, String> {
    let db = state.db.clone();
    let conn = db.get_connection();
    let conn = conn.lock().unwrap();

    let mut stmt = conn
        .prepare("SELECT id, type, title, config, position_x, position_y, width, height, z_index, is_visible, created_at, updated_at FROM desktop_cards ORDER BY z_index ASC")
        .map_err(|e| e.to_string())?;

    let cards = stmt
        .query_map([], |row| {
            Ok(DesktopCard {
                id: row.get(0)?,
                card_type: row.get(1)?,
                title: row.get(2)?,
                config: row.get(3)?,
                position_x: row.get(4)?,
                position_y: row.get(5)?,
                width: row.get(6)?,
                height: row.get(7)?,
                z_index: row.get(8)?,
                is_visible: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(cards)
}

#[tauri::command]
pub async fn create_desktop_card(
    state: State<'_, AppState>,
    payload: CreateCardPayload,
) -> Result<DesktopCard, String> {
    let db = state.db.clone();
    let conn = db.get_connection();
    let conn = conn.lock().unwrap();

    let id = Uuid::new_v4().to_string();
    let now = Local::now().to_string();

    conn.execute(
        "INSERT INTO desktop_cards (id, type, title, config, position_x, position_y, width, height, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        (
            &id,
            &payload.card_type,
            &payload.title,
            &payload.config,
            payload.position_x,
            payload.position_y,
            payload.width,
            payload.height,
            &now,
            &now,
        ),
    )
    .map_err(|e| e.to_string())?;

    Ok(DesktopCard {
        id,
        card_type: payload.card_type,
        title: payload.title,
        config: payload.config,
        position_x: payload.position_x,
        position_y: payload.position_y,
        width: payload.width,
        height: payload.height,
        z_index: 0,
        is_visible: true,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub async fn update_desktop_card(
    state: State<'_, AppState>,
    id: String,
    title: Option<String>,
    config: String,
) -> Result<(), String> {
    let db = state.db.clone();
    let conn = db.get_connection();
    let conn = conn.lock().unwrap();

    conn.execute(
        "UPDATE desktop_cards SET title = ?1, config = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3",
        (&title, &config, &id),
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn update_card_position(
    state: State<'_, AppState>,
    id: String,
    position_x: i32,
    position_y: i32,
    width: i32,
    height: i32,
) -> Result<(), String> {
    let db = state.db.clone();
    let conn = db.get_connection();
    let conn = conn.lock().unwrap();

    conn.execute(
        "UPDATE desktop_cards SET position_x = ?1, position_y = ?2, width = ?3, height = ?4, updated_at = CURRENT_TIMESTAMP WHERE id = ?5",
        (position_x, position_y, width, height, &id),
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_desktop_card(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let db = state.db.clone();
    let conn = db.get_connection();
    let conn = conn.lock().unwrap();

    conn.execute("DELETE FROM desktop_cards WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

use tauri::{AppHandle, Manager, WebviewWindowBuilder, WebviewUrl};

#[tauri::command]
pub async fn open_card_window(app: AppHandle, id: String, width: f64, height: f64) -> Result<(), String> {
    let label = format!("widget_{}", id);
    if let Some(window) = app.get_webview_window(&label) {
        // 如果窗口已存在，尝试显示并聚焦
        // 使用 unminimize 确保最小化的窗口也能恢复
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
        return Ok(());
    }

    let url = WebviewUrl::App(format!("index.html#/widget/{}", id).into());

    // 确保 width 和 height 是有效值
    let safe_width = if width > 0.0 { width } else { 300.0 };
    let safe_height = if height > 0.0 { height } else { 200.0 };

    WebviewWindowBuilder::new(&app, &label, url)
        .title("Widget")
        .inner_size(safe_width, safe_height)
        .decorations(false)
        .transparent(true)
        .skip_taskbar(true)
        .always_on_top(false)
        .shadow(false) // 禁用窗口阴影
        .center() // 居中显示
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn close_card_window(app: AppHandle, id: String) -> Result<(), String> {
    let label = format!("widget_{}", id);
    if let Some(window) = app.get_webview_window(&label) {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn update_card_order(
    state: State<'_, AppState>,
    ids: Vec<String>,
) -> Result<(), String> {
    let db = state.db.clone();
    let conn = db.get_connection();
    let mut conn = conn.lock().unwrap();
    
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    for (index, id) in ids.iter().enumerate() {
        tx.execute(
            "UPDATE desktop_cards SET z_index = ?1 WHERE id = ?2",
            (index as i32, id),
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}
