use crate::commands::system::GpuInfo;

pub async fn try_amd_gpu() -> Option<GpuInfo> {
    tokio::task::spawn_blocking(|| {
        use wmi::{COMLibrary, WMIConnection};
        
        let com_lib = COMLibrary::new().ok()?;
        let wmi_con = WMIConnection::new(com_lib.into()).ok()?;
        
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
        }
        
        let controllers: Vec<VideoController> = wmi_con
            .raw_query("SELECT Name, DriverVersion, AdapterRAM, DeviceID, Status FROM Win32_VideoController WHERE Name LIKE '%AMD%' OR Name LIKE '%Radeon%'")
            .ok()?;
        
        controllers.into_iter().next().map(|vc| GpuInfo {
            name: vc.name.unwrap_or_else(|| "AMD GPU".to_string()),
            vendor: "AMD".to_string(),
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
    .await
    .ok()?
}
