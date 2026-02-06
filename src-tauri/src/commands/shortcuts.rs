use tauri::{AppHandle, Manager};
use uuid::Uuid;
use std::time::{SystemTime, UNIX_EPOCH};
use crate::models::shortcuts::{QuickAccessItem, CreateQuickAccessDto, UpdateQuickAccessDto};
use crate::AppState;
use rusqlite::OptionalExtension;
use reqwest::header::USER_AGENT;
use scraper::{Html, Selector};

#[derive(serde::Serialize)]
pub struct WebsiteMetadata {
    title: Option<String>,
    description: Option<String>,
    icon: Option<String>,
}

#[tauri::command]
pub async fn fetch_website_metadata(url: String) -> Result<WebsiteMetadata, String> {
    // Ensure URL has protocol
    let target_url = if !url.starts_with("http://") && !url.starts_with("https://") {
        format!("https://{}", url)
    } else {
        url.clone()
    };

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| e.to_string())?;

    let res = client.get(&target_url)
        .header(USER_AGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        .send()
        .await
        .map_err(|e| e.to_string())?;
        
    let html_content = res.text().await.map_err(|e| e.to_string())?;
    let document = Html::parse_document(&html_content);
    
    // Title
    let title_selector = Selector::parse("title").unwrap();
    let title = document.select(&title_selector).next().map(|el| el.text().collect::<String>());
    
    // Description
    let meta_desc_selector = Selector::parse("meta[name='description']").unwrap();
    let description = document.select(&meta_desc_selector).next()
        .and_then(|el| el.value().attr("content"))
        .map(|s| s.to_string());
    
    // Icon
    let icon_selector = Selector::parse("link[rel*='icon']").unwrap();
    let mut icon = document.select(&icon_selector).next()
        .and_then(|el| el.value().attr("href"))
        .map(|s| s.to_string());
    
    // Resolve relative URLs for icon
    if let Some(ref i) = icon {
        if !i.starts_with("http") {
             if let Ok(base) = reqwest::Url::parse(&target_url) {
                 if let Ok(joined) = base.join(i) {
                     icon = Some(joined.to_string());
                 }
             }
        }
    } else {
         // Fallback to /favicon.ico
         if let Ok(base) = reqwest::Url::parse(&target_url) {
             if let Ok(joined) = base.join("/favicon.ico") {
                 icon = Some(joined.to_string());
             }
         }
    }

    Ok(WebsiteMetadata {
        title,
        description,
        icon,
    })
}

#[tauri::command]
pub async fn get_shortcuts(
    app_handle: AppHandle,
    include_hidden: bool,
) -> Result<Vec<QuickAccessItem>, String> {
    let state = app_handle.state::<AppState>();
    let db = &state.db;
    let conn = db.get_connection();
    let conn = conn.lock().unwrap();

    let mut query = "SELECT id, name, target, kind, icon, encrypted, hidden, created_at, updated_at, description FROM shortcuts".to_string();
    if !include_hidden {
        query.push_str(" WHERE hidden = 0");
    }
    query.push_str(" ORDER BY created_at DESC");

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    
    let rows = stmt.query_map([], |row| {
        Ok(QuickAccessItem {
            id: row.get(0)?,
            name: row.get(1)?,
            target: row.get(2)?,
            kind: row.get(3)?,
            icon: row.get(4)?,
            encrypted: row.get(5)?,
            hidden: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
            description: row.get(9).ok(),
        })
    }).map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| e.to_string())?);
    }

    Ok(items)
}

#[tauri::command]
pub async fn create_shortcut(
    app_handle: AppHandle,
    dto: CreateQuickAccessDto,
) -> Result<QuickAccessItem, String> {
    let state = app_handle.state::<AppState>();
    let db = &state.db;
    let conn = db.get_connection();
    let conn = conn.lock().unwrap();

    let id = Uuid::new_v4().to_string();
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    conn.execute(
        "INSERT INTO shortcuts (id, name, target, kind, icon, encrypted, hidden, created_at, updated_at, description) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        (
            &id,
            &dto.name,
            &dto.target,
            &dto.kind,
            &dto.icon,
            dto.encrypted,
            dto.hidden,
            now,
            now,
            &dto.description,
        ),
    ).map_err(|e| e.to_string())?;

    Ok(QuickAccessItem {
        id,
        name: dto.name,
        target: dto.target,
        kind: dto.kind,
        icon: dto.icon,
        encrypted: dto.encrypted,
        hidden: dto.hidden,
        created_at: now,
        updated_at: now,
        description: dto.description,
    })
}

#[tauri::command]
pub async fn update_shortcut(
    app_handle: AppHandle,
    id: String,
    dto: UpdateQuickAccessDto,
) -> Result<QuickAccessItem, String> {
    let state = app_handle.state::<AppState>();
    let db = &state.db;
    let conn = db.get_connection();
    let conn = conn.lock().unwrap();

    // Check if exists
    let mut stmt = conn.prepare("SELECT id FROM shortcuts WHERE id = ?1").map_err(|e| e.to_string())?;
    if !stmt.exists([&id]).map_err(|e| e.to_string())? {
        return Err("Shortcut not found".to_string());
    }

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    // Let's fetch the existing item first
    let mut stmt = conn.prepare("SELECT id, name, target, kind, icon, encrypted, hidden, created_at, updated_at, description FROM shortcuts WHERE id = ?1").map_err(|e| e.to_string())?;
    let mut item = stmt.query_row([&id], |row| {
        Ok(QuickAccessItem {
            id: row.get(0)?,
            name: row.get(1)?,
            target: row.get(2)?,
            kind: row.get(3)?,
            icon: row.get(4)?,
            encrypted: row.get(5)?,
            hidden: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
            description: row.get(9).ok(),
        })
    }).map_err(|e| e.to_string())?;

    // Apply updates
    if let Some(v) = dto.name { item.name = v; }
    if let Some(v) = dto.target { item.target = v; }
    if let Some(v) = dto.icon { item.icon = Some(v); }
    if let Some(v) = dto.description { item.description = Some(v); }
    if let Some(v) = dto.encrypted { item.encrypted = v; }
    if let Some(v) = dto.hidden { item.hidden = v; }
    item.updated_at = now;

    // Save back
    conn.execute(
        "UPDATE shortcuts SET name = ?1, target = ?2, icon = ?3, encrypted = ?4, hidden = ?5, updated_at = ?6, description = ?7 WHERE id = ?8",
        (
            &item.name,
            &item.target,
            &item.icon,
            item.encrypted,
            item.hidden,
            item.updated_at,
            &item.description,
            &id,
        ),
    ).map_err(|e| e.to_string())?;

    Ok(item)
}

#[tauri::command]
pub async fn delete_shortcut(
    app_handle: AppHandle,
    id: String,
) -> Result<(), String> {
    let state = app_handle.state::<AppState>();
    let db = &state.db;
    let conn = db.get_connection();
    let conn = conn.lock().unwrap();

    conn.execute("DELETE FROM shortcuts WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn open_shortcut(
    app_handle: AppHandle,
    target: String,
    kind: String,
) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    
    if kind == "website" {
        app_handle.opener().open_url(&target, None::<&str>).map_err(|e| e.to_string())?;
    } else {
        // Open directory
        app_handle.opener().open_path(&target, None::<&str>).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn set_global_password(
    app_handle: AppHandle,
    password: String,
) -> Result<(), String> {
    let state = app_handle.state::<AppState>();
    let db = &state.db;
    let conn = db.get_connection();
    let conn = conn.lock().unwrap();

    conn.execute(
        "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('global_password', ?1, CURRENT_TIMESTAMP)",
        [&password],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn verify_password(
    app_handle: AppHandle,
    password: String,
) -> Result<bool, String> {
    let state = app_handle.state::<AppState>();
    let db = &state.db;
    let conn = db.get_connection();
    let conn = conn.lock().unwrap();

    let mut stmt = conn.prepare("SELECT value FROM app_settings WHERE key = 'global_password'").map_err(|e| e.to_string())?;
    let stored_password: Option<String> = stmt.query_row([], |row| row.get(0)).optional().map_err(|e| e.to_string())?;

    match stored_password {
        Some(stored) => Ok(stored == password),
        None => Ok(false), // No password set
    }
}

#[tauri::command]
pub async fn has_password(
    app_handle: AppHandle,
) -> Result<bool, String> {
    let state = app_handle.state::<AppState>();
    let db = &state.db;
    let conn = db.get_connection();
    let conn = conn.lock().unwrap();

    let mut stmt = conn.prepare("SELECT 1 FROM app_settings WHERE key = 'global_password'").map_err(|e| e.to_string())?;
    let exists = stmt.exists([]).map_err(|e| e.to_string())?;

    Ok(exists)
}
