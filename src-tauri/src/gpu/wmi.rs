use crate::commands::system::GpuInfo;

pub async fn query_wmi_gpus() -> Vec<GpuInfo> {
    tokio::task::spawn_blocking(|| {
        use wmi::{COMLibrary, WMIConnection};
        
        #[derive(serde::Deserialize, Debug)]
        struct VideoController {
            #[serde(alias = "Name")]
            name: Option<String>,
            #[serde(alias = "DriverVersion")]
            driver_version: Option<String>,
            #[serde(alias = "AdapterRAM")]
            adapter_ram: Option<u32>,
            #[serde(alias = "DeviceID")]
            device_id: Option<String>,
            #[serde(alias = "Status")]
            status: Option<String>,
            #[serde(alias = "VideoProcessor")]
            video_processor: Option<String>,
            #[serde(alias = "DriverDate")]
            driver_date: Option<String>,
        }
        
        let com_lib = match COMLibrary::new() {
            Ok(com) => com,
            Err(e) => {
                log::info!("WMI COM库初始化失败: {:?}", e);
                return Vec::new();
            }
        };
        
        let wmi_con = match WMIConnection::new(com_lib.into()) {
            Ok(conn) => conn,
            Err(e) => {
                log::info!("WMI连接失败: {:?}", e);
                return Vec::new();
            }
        };
        
        let query_result: std::result::Result<Vec<VideoController>, _> = wmi_con.raw_query(
            "SELECT Name, DriverVersion, AdapterRAM, DeviceID, Status, VideoProcessor, DriverDate FROM Win32_VideoController"
        );
        
        match query_result {
            Ok(controllers) => {
                log::info!("WMI: 发现{}个GPU控制器", controllers.len());
                controllers.into_iter()
                    .filter_map(|vc| {
                        let name = vc.name?;
                        let vendor = detect_vendor(&name);
                        
                        Some(GpuInfo {
                            name,
                            vendor,
                            device_id: vc.device_id,
                            driver_version: vc.driver_version,
                            memory_total: vc.adapter_ram.map(|v| v as u64),
                            memory_used: None,
                            memory_free: None,
                            utilization: None,
                            temperature: None,
                            fan_speed: None,
                            clock_speed: None,
                            memory_clock: None,
                            power_usage: None,
                            status: vc.status,
                        })
                    })
                    .collect()
            }
            Err(e) => {
                log::info!("WMI GPU查询失败: {:?}", e);
                Vec::new()
            }
        }
    })
    .await
    .unwrap_or_default()
}

fn detect_vendor(name: &str) -> String {
    let name_upper = name.to_uppercase();
    if name_upper.contains("NVIDIA") || name_upper.contains("GTX") || name_upper.contains("RTX") {
        "NVIDIA".to_string()
    } else if name_upper.contains("AMD") || name_upper.contains("RADEON") {
        "AMD".to_string()
    } else if name_upper.contains("INTEL") {
        "Intel".to_string()
    } else {
        "Unknown".to_string()
    }
}
