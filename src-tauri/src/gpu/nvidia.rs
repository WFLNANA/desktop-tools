use crate::commands::system::GpuInfo;
use nvml_wrapper::enum_wrappers::device::{Clock, TemperatureSensor};

pub async fn try_nvidia_gpu() -> Option<GpuInfo> {
    tokio::task::spawn_blocking(|| {
        use nvml_wrapper::Nvml;
        
        match Nvml::init() {
            Ok(nvml) => {
                match nvml.device_by_index(0) {
                    Ok(device) => {
                        let name = device.name().ok()?;
                        let brand = device.brand().ok()?;
                        let brand_str = match brand {
                            nvml_wrapper::enum_wrappers::device::Brand::Unknown => "Unknown".to_string(),
                            nvml_wrapper::enum_wrappers::device::Brand::Quadro => "Quadro".to_string(),
                            nvml_wrapper::enum_wrappers::device::Brand::Tesla => "Tesla".to_string(),
                            nvml_wrapper::enum_wrappers::device::Brand::GRID => "GRID".to_string(),
                            nvml_wrapper::enum_wrappers::device::Brand::GeForce => "GeForce".to_string(),
                            nvml_wrapper::enum_wrappers::device::Brand::Titan => "TITAN".to_string(),
                            nvml_wrapper::enum_wrappers::device::Brand::Nvidia => "NVIDIA".to_string(),
                            _ => "NVIDIA".to_string(),
                        };
                        let memory_info = device.memory_info().ok()?;
                        let utilization = device.utilization_rates().ok()?;
                        let temperature = device.temperature(TemperatureSensor::Gpu).ok()?;
                        let fan_speed = device.fan_speed(0).ok();
                        let clock_info = device.clock_info(Clock::Graphics).ok();
                        let mem_clock_info = device.clock_info(Clock::Memory).ok();
                        let power_usage = device.power_usage().ok().map(|p| p as u64);
                        let pci_info = device.pci_info().ok()?;
                        let device_id = format!("{}:{:04X}:{:02X}", 
                            pci_info.bus_id,
                            pci_info.device,
                            pci_info.domain
                        );
                        
                        Some(GpuInfo {
                            name,
                            vendor: brand_str,
                            device_id: Some(device_id),
                            driver_version: None,
                            memory_total: Some(memory_info.total),
                            memory_used: Some(memory_info.used),
                            memory_free: Some(memory_info.free),
                            utilization: Some(utilization.gpu as f32),
                            temperature: Some(temperature as f32),
                            fan_speed,
                            clock_speed: clock_info.map(|c| c as u64),
                            memory_clock: mem_clock_info.map(|c| c as u64),
                            power_usage,
                            status: Some("OK".to_string()),
                        })
                    }
                    Err(e) => {
                        log::info!("NVIDIA GPU设备查询失败: {:?}", e);
                        None
                    }
                }
            }
            Err(e) => {
                log::info!("NVML初始化失败（无NVIDIA GPU或驱动程序）: {:?}", e);
                None
            }
        }
    })
    .await
    .ok()?
}
