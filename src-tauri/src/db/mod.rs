use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

pub mod models;

pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        
        // 启用外键约束
        conn.execute("PRAGMA foreign_keys = ON", [])?;
        
        let db = Database {
            conn: Arc::new(Mutex::new(conn)),
        };
        db.init_tables()?;
        Ok(db)
    }

    fn init_tables(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        // 创建分类表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                icon TEXT,
                color TEXT,
                parent_id INTEGER,
                sort_order INTEGER NOT NULL DEFAULT 0,
                password_hash TEXT,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // 创建目录绑定表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS directory_bindings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                directory_path TEXT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
                UNIQUE(category_id, directory_path)
            )",
            [],
        )?;

        // 创建资源表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS resources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                file_name TEXT NOT NULL,
                file_path TEXT NOT NULL UNIQUE,
                file_size INTEGER NOT NULL,
                file_type TEXT,
                modified_at DATETIME NOT NULL,
                scanned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // 创建操作日志表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS operation_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                operation_type TEXT NOT NULL,
                operation_detail TEXT,
                operation_result TEXT,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // 创建应用设置表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // 创建快捷方式表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS shortcuts (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                target TEXT NOT NULL,
                icon TEXT,
                description TEXT,
                category_id TEXT,
                is_pinned BOOLEAN DEFAULT 0,
                launch_count INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // 创建桌面卡片表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS desktop_cards (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                title TEXT,
                config TEXT NOT NULL,
                position_x INTEGER NOT NULL DEFAULT 0,
                position_y INTEGER NOT NULL DEFAULT 0,
                width INTEGER NOT NULL DEFAULT 300,
                height INTEGER NOT NULL DEFAULT 200,
                z_index INTEGER NOT NULL DEFAULT 0,
                is_visible BOOLEAN NOT NULL DEFAULT 1,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // 创建全局配置表（用于存储密码等敏感信息，如果不想用 app_settings）
        // 这里直接复用 app_settings 存储 'global_password_hash'

        // 创建壁纸表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS wallpapers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_type TEXT,
                file_size INTEGER,
                width INTEGER,
                height INTEGER,
                modified_at DATETIME NOT NULL,
                created_at DATETIME NOT NULL
            )",
            [],
        )?;

        // 创建索引
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_directory_bindings_category_id ON directory_bindings(category_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_resources_category_id ON resources(category_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_resources_file_name ON resources(file_name)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_resources_file_type ON resources(file_type)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_resources_modified_at ON resources(modified_at)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_operation_logs_operation_type ON operation_logs(operation_type)",
            [],
        )?;

        Ok(())
    }

    pub fn get_connection(&self) -> Arc<Mutex<Connection>> {
        Arc::clone(&self.conn)
    }
    
    pub fn get_close_behavior(&self) -> Result<Option<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT value FROM app_settings WHERE key = 'close_behavior'")?;
        let behavior: Option<String> = stmt.query_row([], |row| row.get(0)).ok();
        Ok(behavior)
    }
    
    pub fn set_close_behavior(&self, behavior: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('close_behavior', ?, CURRENT_TIMESTAMP)",
            [behavior],
        )?;
        Ok(())
    }
}
