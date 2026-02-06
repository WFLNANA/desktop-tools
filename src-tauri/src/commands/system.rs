use crate::error::Result;
use crate::AppState;
use serde::Serialize;
use sysinfo::{Components, Disks, Networks, System};
use tauri::State;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkInfo {
    pub name: String,
    pub received: u64,
    pub transmitted: u64,
    pub total_received: u64,
    pub total_transmitted: u64,
    pub mac_address: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TemperatureInfo {
    pub label: String,
    pub temperature: f32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FanInfo {
    pub label: String,
    pub rpm: u32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CpuCoreInfo {
    pub id: usize,
    pub name: String,
    pub usage: f32,
    pub frequency: u64,
    pub temperature: Option<f32>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CpuInfo {
    pub model: String,
    pub cores: usize,
    pub threads: usize,
    pub frequency: u64,
    pub usage: f32,
    pub load_average: LoadAvg,
    pub per_core: Vec<CpuCoreInfo>,
    pub temperature: Option<f32>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadAvg {
    pub one: f32,
    pub five: f32,
    pub fifteen: f32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryInfo {
    pub total: u64,
    pub used: u64,
    pub free: u64,
    pub available: u64,
    pub cached: Option<u64>,
    pub usage: f32,
    pub swap_total: u64,
    pub swap_used: u64,
    pub swap_free: u64,
    pub temperature: Option<f32>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskInfo {
    pub name: String,
    pub mount_point: String,
    pub file_system: String,
    pub total: u64,
    pub available: u64,
    pub used: u64,
    pub usage: f32,
    pub is_removable: bool,
    pub temperature: Option<f32>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GpuInfo {
    pub name: String,
    pub vendor: String,
    pub device_id: Option<String>,
    pub driver_version: Option<String>,
    pub memory_total: Option<u64>,
    pub memory_used: Option<u64>,
    pub memory_free: Option<u64>,
    pub utilization: Option<f32>,
    pub temperature: Option<f32>,
    pub fan_speed: Option<u32>,
    pub clock_speed: Option<u64>,
    pub memory_clock: Option<u64>,
    pub power_usage: Option<u64>,
    pub status: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OsInfo {
    pub name: String,
    pub version: String,
    pub kernel_version: String,
    pub long_version: Option<String>,
    pub arch: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfo {
    pub timestamp: u64,
    pub uptime: u64,
    pub device_name: String,
    pub os: OsInfo,
    pub cpu: CpuInfo,
    pub memory: MemoryInfo,
    pub disks: Vec<DiskInfo>,
    pub gpus: Vec<GpuInfo>,
    pub temperatures: Vec<TemperatureInfo>,
    pub fans: Vec<FanInfo>,
    pub networks: Vec<NetworkInfo>,
}

/**
 * 获取系统信息总览
 */
#[tauri::command]
pub async fn get_system_info(_state: State<'_, AppState>) -> Result<SystemInfo> {
    let mut system = System::new_all();
    let mut networks = Networks::new_with_refreshed_list();
    system.refresh_memory();
    system.refresh_cpu();
    networks.refresh();

    std::thread::sleep(std::time::Duration::from_millis(220));
    system.refresh_cpu();
    networks.refresh();

    let host = System::host_name().unwrap_or_else(|| "Unknown".to_string());
    let os_name = System::name().unwrap_or_else(|| "Unknown".to_string());
    let os_version = System::os_version().unwrap_or_else(|| "Unknown".to_string());
    let kernel_version = System::kernel_version().unwrap_or_else(|| "Unknown".to_string());
    let long_version = System::long_os_version();
    let arch = std::env::consts::ARCH.to_string();

    let mut components = Components::new_with_refreshed_list();
    components.refresh();
    let temps: Vec<TemperatureInfo> = components
        .list()
        .iter()
        .map(|c| TemperatureInfo {
            label: c.label().to_string(),
            temperature: c.temperature(),
        })
        .collect();

    let processors = system.cpus();
    let physical_cores = system.physical_core_count().unwrap_or(processors.len());
    let primary_cpu = processors.first();
    let cpu_model = primary_cpu
        .map(|cpu| cpu.brand().to_string())
        .unwrap_or_else(|| "Unknown".to_string());
    let cpu_frequency = primary_cpu.map(|cpu| cpu.frequency()).unwrap_or(0);
    let cpu_usage = system.global_cpu_info().cpu_usage();
    let cpu_info = CpuInfo {
        model: cpu_model,
        cores: physical_cores,
        threads: processors.len(),
        frequency: cpu_frequency,
        usage: cpu_usage,
        load_average: {
            let l = System::load_average();
            LoadAvg {
                one: l.one as f32,
                five: l.five as f32,
                fifteen: l.fifteen as f32,
            }
        },
        per_core: processors
            .iter()
            .enumerate()
            .map(|(i, c)| CpuCoreInfo {
                id: i,
                name: c.name().to_string(),
                usage: c.cpu_usage(),
                frequency: c.frequency(),
                temperature: get_core_temperature(&temps, i),
            })
            .collect(),
        temperature: get_cpu_temperature(&temps),
    };

    let total_mem = system.total_memory();
    let available_mem = system.available_memory();
    let used_mem = total_mem.saturating_sub(available_mem);
    let mem_usage = if total_mem > 0 {
        (used_mem as f32 / total_mem as f32) * 100.0
    } else {
        0.0
    };
    let total_swap = system.total_swap();
    let used_swap = system.used_swap();
    let free_swap = total_swap.saturating_sub(used_swap);

    let memory_info = MemoryInfo {
        total: total_mem,
        used: used_mem,
        free: 0,
        available: available_mem,
        cached: None,
        usage: mem_usage,
        swap_total: total_swap,
        swap_used: used_swap,
        swap_free: free_swap,
        temperature: None,
    };

    let mut disks = Disks::new_with_refreshed_list();
    disks.refresh();
    let disks_info: Vec<DiskInfo> = disks
        .list()
        .iter()
        .map(|d| {
            let total = d.total_space();
            let available = d.available_space();
            let used = total.saturating_sub(available);
            let usage = if total > 0 {
                (used as f32 / total as f32) * 100.0
            } else {
                0.0
            };
            DiskInfo {
                name: d.name().to_string_lossy().to_string(),
                mount_point: d.mount_point().to_string_lossy().to_string(),
                file_system: d.file_system().to_string_lossy().to_string(),
                total,
                available,
                used,
                usage,
                is_removable: d.is_removable(),
                temperature: None,
            }
        })
        .collect();

    fn find_temperature(temps: &[TemperatureInfo], keywords: &[&str]) -> Option<f32> {
        temps
            .iter()
            .filter(|t| {
                let label_lower = t.label.to_lowercase();
                keywords
                    .iter()
                    .any(|keyword| label_lower.contains(&keyword.to_lowercase()))
            })
            .map(|t| t.temperature)
            .next()
    }

    fn get_cpu_temperature(temps: &[TemperatureInfo]) -> Option<f32> {
        find_temperature(temps, &["cpu", "core", "tctl", "tdie", "package"])
    }

    fn get_memory_temperature(temps: &[TemperatureInfo]) -> Option<f32> {
        find_temperature(temps, &["memory", "ram", "dimm", "so-dimm"])
    }

    fn get_disk_temperature(temps: &[TemperatureInfo], disk_name: &str) -> Option<f32> {
        let disk_name_lower = disk_name.to_lowercase();
        temps
            .iter()
            .find(|t| {
                let label_lower = t.label.to_lowercase();
                label_lower.contains(&disk_name_lower.replace(":", ""))
                    || label_lower.contains("disk")
                    || label_lower.contains("ssd")
                    || label_lower.contains("hdd")
                    || label_lower.contains("nvme")
            })
            .map(|t| t.temperature)
    }

    fn get_core_temperature(temps: &[TemperatureInfo], core_id: usize) -> Option<f32> {
        let core_str = format!("core {}", core_id);
        temps
            .iter()
            .find(|t| {
                let label_lower = t.label.to_lowercase();
                label_lower.contains(&core_str.to_lowercase())
                    || label_lower.contains(&format!("cpu{}", core_id))
            })
            .map(|t| t.temperature)
    }

    #[cfg(target_os = "windows")]
    async fn query_gpus() -> Vec<GpuInfo> {
        use crate::gpu;
        gpu::get_all_gpu_info().await
    }

    #[cfg(not(target_os = "windows"))]
    async fn query_gpus() -> Vec<GpuInfo> {
        Vec::new()
    }

    #[cfg(target_os = "windows")]
    async fn query_fans() -> Vec<FanInfo> {
        use wmi::{COMLibrary, WMIConnection};
        
        tokio::task::spawn_blocking(move || {
            #[derive(serde::Deserialize, Debug)]
            struct WinFan {
                #[serde(alias = "Name")]
                name: Option<String>,
                #[serde(alias = "CurrentSpeed")]
                current_speed: Option<u32>,
            }
            let mut result = Vec::new();
            let com_lib = match COMLibrary::new() {
                Ok(com) => com,
                Err(e) => {
                    log::info!("COMLibrary::new() failed for fans, assuming initialized: {:?}", e);
                    unsafe { COMLibrary::assume_initialized() }
                }
            };

            match WMIConnection::new(com_lib.into()) {
                Ok(wmi_con) => {
                    let query_result: std::result::Result<Vec<WinFan>, _> =
                        wmi_con.raw_query("SELECT Name, CurrentSpeed FROM Win32_Fan");
                    match query_result {
                        Ok(fans) => {
                            log::info!("发现{}个风扇", fans.len());
                            for f in fans {
                                log::info!("发现风扇: {:?}", f);
                                if let Some(rpm) = f.current_speed {
                                    result.push(FanInfo {
                                        label: f.name.unwrap_or_else(|| "风扇".to_string()),
                                        rpm,
                                    });
                                }
                            }
                        }
                        Err(e) => log::info!("WMI风扇查询失败: {:?}", e),
                    }
                }
                Err(e) => log::info!("WMI风扇连接失败: {:?}", e),
            }
            result
        })
        .await
        .unwrap_or_default()
    }

    #[cfg(not(target_os = "windows"))]
    async fn query_fans() -> Vec<FanInfo> {
        Vec::new()
    }

    let cpu_temperature = get_cpu_temperature(&temps);
    let memory_temperature = get_memory_temperature(&temps);
    let disks_with_temp: Vec<DiskInfo> = disks_info
        .iter()
        .map(|disk| DiskInfo {
            name: disk.name.clone(),
            mount_point: disk.mount_point.clone(),
            file_system: disk.file_system.clone(),
            total: disk.total,
            available: disk.available,
            used: disk.used,
            usage: disk.usage,
            is_removable: disk.is_removable,
            temperature: get_disk_temperature(&temps, &disk.name),
        })
        .collect();

    let per_core_with_temp: Vec<CpuCoreInfo> = cpu_info
        .per_core
        .iter()
        .map(|core| CpuCoreInfo {
            id: core.id,
            name: core.name.clone(),
            usage: core.usage,
            frequency: core.frequency,
            temperature: get_core_temperature(&temps, core.id),
        })
        .collect();

    let cpu_info = CpuInfo {
        model: cpu_info.model,
        cores: cpu_info.cores,
        threads: cpu_info.threads,
        frequency: cpu_info.frequency,
        usage: cpu_info.usage,
        load_average: cpu_info.load_average,
        per_core: per_core_with_temp,
        temperature: cpu_temperature,
    };

    let memory_info = MemoryInfo {
        total: memory_info.total,
        used: memory_info.used,
        free: memory_info.free,
        available: memory_info.available,
        cached: memory_info.cached,
        usage: memory_info.usage,
        swap_total: memory_info.swap_total,
        swap_used: memory_info.swap_used,
        swap_free: memory_info.swap_free,
        temperature: memory_temperature,
    };

    let network_infos: Vec<NetworkInfo> = networks
        .iter()
        .map(|(name, data)| NetworkInfo {
            name: name.clone(),
            received: data.received(),
            transmitted: data.transmitted(),
            total_received: data.total_received(),
            total_transmitted: data.total_transmitted(),
            mac_address: data.mac_address().to_string(),
        })
        .collect();

    let info = SystemInfo {
        timestamp: chrono::Utc::now().timestamp_millis() as u64,
        uptime: System::uptime(),
        device_name: host,
        os: OsInfo {
            name: os_name,
            version: os_version,
            kernel_version,
            long_version,
            arch,
        },
        cpu: cpu_info,
        memory: memory_info,
        disks: disks_with_temp,
        gpus: query_gpus().await,
        temperatures: temps,
        fans: query_fans().await,
        networks: network_infos,
    };

    Ok(info)
}
