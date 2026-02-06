use crate::error::{AppError, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 环境变量数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvironmentVariable {
    pub id: String,
    pub name: String,
    pub value: String,
    pub description: Option<String>,
    pub category: String,
    pub is_system: bool,
    pub is_modified: bool,
    pub created_at: i64,
    pub modified_at: i64,
}

/// 创建环境变量请求
#[derive(Debug, Deserialize)]
pub struct CreateEnvVarRequest {
    pub name: String,
    pub value: String,
    pub description: Option<String>,
    pub category: String,
}

/// 更新环境变量请求
#[derive(Debug, Deserialize)]
pub struct UpdateEnvVarRequest {
    pub value: Option<String>,
    pub description: Option<String>,
    pub category: Option<String>,
}

/// 环境变量分类
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvVarCategory {
    pub name: String,
    pub count: i32,
    pub color: Option<String>,
}

/// 验证环境变量名称
#[derive(Debug, Serialize, Deserialize)]
pub struct ValidateNameResult {
    pub valid: bool,
    pub error: Option<String>,
}

/// 环境变量服务
pub struct EnvVarService;

impl EnvVarService {
    /// 预定义的分类及其颜色
    fn get_predefined_categories() -> Vec<(&'static str, Option<&'static str>)> {
        vec![
            ("路径相关", Some("#1677ff")),
            ("开发工具", Some("#52c41a")),
            ("系统配置", Some("#fa8c16")),
            ("数据库", Some("#722ed1")),
            ("应用配置", Some("#eb2f96")),
            ("编程语言", Some("#13c2c2")),
            ("其他", None),
        ]
    }

    /// 自动分类环境变量
    fn auto_category(name: &str) -> &'static str {
        let name_upper = name.to_uppercase();

        if name_upper.contains("PATH") || name_upper.contains("HOME") {
            return "路径相关";
        }
        if name_upper.contains("JAVA") || name_upper.contains("PYTHON") || name_upper.contains("NODE") || name_upper.contains("RUST") {
            return "编程语言";
        }
        if name_upper.contains("GIT") || name_upper.contains("DOCKER") || name_upper.contains("K8S") {
            return "开发工具";
        }
        if name_upper.contains("MYSQL") || name_upper.contains("POSTGRES") || name_upper.contains("MONGO") || name_upper.contains("REDIS") {
            return "数据库";
        }
        if name_upper.contains("APP") || name_upper.contains("CONFIG") {
            return "应用配置";
        }
        if name_upper.contains("TEMP") || name_upper.contains("TMP") || name_upper.contains("CACHE") {
            return "系统配置";
        }

        "其他"
    }

    /// 生成唯一ID
    fn generate_id(name: &str, is_system: bool) -> String {
        let prefix = if is_system { "sys" } else { "user" };
        format!("{}_{}", prefix, name)
    }

    /// 获取所有环境变量
    pub fn get_env_vars() -> Result<Vec<EnvironmentVariable>> {
        let mut vars = Vec::new();
        let now = chrono::Utc::now().timestamp_millis();

        // 获取系统环境变量
        for (key, value) in std::env::vars() {
            let category = Self::auto_category(&key);
            vars.push(EnvironmentVariable {
                id: Self::generate_id(&key, true),
                name: key.clone(),
                value,
                description: None,
                category: category.to_string(),
                is_system: true,
                is_modified: false,
                created_at: now,
                modified_at: now,
            });
        }

        // 按分类分组（使用 BTreeMap 自动排序）
        let mut category_map: std::collections::BTreeMap<String, Vec<EnvironmentVariable>> = std::collections::BTreeMap::new();
        for var in vars {
            category_map.entry(var.category.clone()).or_insert_with(Vec::new).push(var);
        }

        // 按名称排序每个分类内的变量
        let sorted_vars: Vec<EnvironmentVariable> = category_map
            .into_values()
            .flat_map(|mut vars| {
                vars.sort_by(|a, b| a.name.cmp(&b.name));
                vars
            })
            .collect();

        Ok(sorted_vars)
    }

    /// 获取环境变量分类统计
    pub fn get_env_var_categories() -> Result<Vec<EnvVarCategory>> {
        let vars = Self::get_env_vars()?;
        let mut category_counts: HashMap<String, i32> = HashMap::new();

        for var in vars {
            *category_counts.entry(var.category).or_insert(0) += 1;
        }

        let mut categories: Vec<EnvVarCategory> = category_counts
            .into_iter()
            .map(|(name, count)| {
                let predefined = Self::get_predefined_categories()
                    .into_iter()
                    .find(|(cat_name, _)| cat_name == &name);
                EnvVarCategory {
                    name,
                    count,
                    color: predefined.and_then(|(_, color)| color.map(|c| c.to_string())),
                }
            })
            .collect();

        categories.sort_by(|a, b| b.count.cmp(&a.count));
        Ok(categories)
    }

    /// 验证环境变量名称
    pub fn validate_env_var_name(name: &str) -> ValidateNameResult {
        if name.is_empty() {
            return ValidateNameResult {
                valid: false,
                error: Some("环境变量名称不能为空".to_string()),
            };
        }

        // 验证格式：只能包含字母、数字和下划线，且不能以数字开头
        if !name.chars().next().map(|c| c.is_alphabetic() || c == '_').unwrap_or(false) {
            return ValidateNameResult {
                valid: false,
                error: Some("环境变量名称必须以字母或下划线开头".to_string()),
            };
        }

        if !name.chars().all(|c| c.is_alphanumeric() || c == '_') {
            return ValidateNameResult {
                valid: false,
                error: Some("环境变量名称只能包含字母、数字和下划线".to_string()),
            };
        }

        // 检查是否已存在
        if std::env::var(name).is_ok() {
            return ValidateNameResult {
                valid: false,
                error: Some(format!("环境变量 '{}' 已存在", name)),
            };
        }

        ValidateNameResult {
            valid: true,
            error: None,
        }
    }

    /// 创建环境变量（设置到当前进程）
    pub fn create_env_var(req: CreateEnvVarRequest) -> Result<EnvironmentVariable> {
        // 验证名称
        let validation = Self::validate_env_var_name(&req.name);
        if !validation.valid {
            return Err(AppError::InvalidInput(validation.error.unwrap_or_else(|| "无效的环境变量名称".to_string())));
        }

        let now = chrono::Utc::now().timestamp_millis();

        let env_var = EnvironmentVariable {
            id: Self::generate_id(&req.name, false),
            name: req.name.clone(),
            value: req.value.clone(),
            description: req.description,
            category: req.category,
            is_system: false,
            is_modified: false,
            created_at: now,
            modified_at: now,
        };

        // 设置环境变量
        std::env::set_var(&req.name, &req.value);

        Ok(env_var)
    }

    /// 更新环境变量
    pub fn update_env_var(id: String, req: UpdateEnvVarRequest) -> Result<EnvironmentVariable> {
        let vars = Self::get_env_vars()?;
        let env_var = vars
            .iter()
            .find(|v| v.id == id)
            .ok_or_else(|| AppError::InvalidInput("环境变量不存在".to_string()))?;

        let now = chrono::Utc::now().timestamp_millis();
        let value_was_modified = req.value.is_some();

        // 更新值
        if let Some(value) = &req.value {
            std::env::set_var(&env_var.name, value);
        }

        // 更新描述和分类（不实际设置到环境变量）
        // 这里我们返回更新后的数据结构
        let updated_var = EnvironmentVariable {
            id: env_var.id.clone(),
            name: env_var.name.clone(),
            value: req.value.unwrap_or_else(|| env_var.value.clone()),
            description: req.description.or_else(|| env_var.description.clone()),
            category: req.category.unwrap_or_else(|| env_var.category.clone()),
            is_system: env_var.is_system,
            is_modified: value_was_modified || env_var.is_modified,
            created_at: env_var.created_at,
            modified_at: now,
        };

        Ok(updated_var)
    }

    /// 删除环境变量
    pub fn delete_env_var(id: String) -> Result<()> {
        let vars = Self::get_env_vars()?;
        let env_var = vars
            .iter()
            .find(|v| v.id == id)
            .ok_or_else(|| AppError::InvalidInput("环境变量不存在".to_string()))?;

        if env_var.is_system {
            return Err(AppError::InvalidInput("不能删除系统环境变量".to_string()));
        }

        std::env::remove_var(&env_var.name);
        Ok(())
    }

    /// 批量删除环境变量
    pub fn delete_env_vars(ids: Vec<String>) -> Result<()> {
        for id in ids {
            Self::delete_env_var(id)?;
        }
        Ok(())
    }

    /// 同步单个环境变量到系统
    pub fn sync_env_var(id: String) -> Result<EnvironmentVariable> {
        let vars = Self::get_env_vars()?;
        let env_var = vars
            .iter()
            .find(|v| v.id == id)
            .ok_or_else(|| AppError::InvalidInput("环境变量不存在".to_string()))?;

        std::env::set_var(&env_var.name, &env_var.value);

        let now = chrono::Utc::now().timestamp_millis();
        Ok(EnvironmentVariable {
            id: env_var.id.clone(),
            name: env_var.name.clone(),
            value: env_var.value.clone(),
            description: env_var.description.clone(),
            category: env_var.category.clone(),
            is_system: env_var.is_system,
            is_modified: false,
            created_at: env_var.created_at,
            modified_at: now,
        })
    }

    /// 同步所有环境变量到系统
    pub fn sync_all_env_vars() -> Result<Vec<EnvironmentVariable>> {
        let vars = Self::get_env_vars()?;
        let now = chrono::Utc::now().timestamp_millis();

        let synced_vars: Vec<EnvironmentVariable> = vars
            .into_iter()
            .map(|mut var| {
                std::env::set_var(&var.name, &var.value);
                var.is_modified = false;
                var.modified_at = now;
                var
            })
            .collect();

        Ok(synced_vars)
    }

    /// 打开系统环境变量设置界面
    pub fn open_env_var_settings() -> Result<()> {
        #[cfg(target_os = "windows")]
        {
            use std::process::Command;
            Command::new("rundll32.exe")
                .args(["sysdm.cpl,EditEnvironmentVariables"])
                .spawn()
                .map_err(|e| AppError::SystemError(format!("Failed to open environment settings: {}", e)))?;
        }
        Ok(())
    }
}
