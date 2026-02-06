use once_cell::sync::Lazy;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::time::{Duration, Instant};
use crate::commands::system::GpuInfo;

mod nvidia;
mod amd;
mod wmi;

#[derive(Clone)]
struct GpuCache {
    data: Option<Vec<GpuInfo>>,
    timestamp: Instant,
}

impl GpuCache {
    fn new() -> Self {
        Self {
            data: None,
            timestamp: Instant::now(),
        }
    }
    
    fn is_expired(&self, ttl: Duration) -> bool {
        self.data.is_none() || self.timestamp.elapsed() > ttl
    }
    
    fn update(&mut self, data: Vec<GpuInfo>) {
        self.data = Some(data);
        self.timestamp = Instant::now();
    }
    
    fn get(&self) -> Option<Vec<GpuInfo>> {
        self.data.clone()
    }
}

static GPU_CACHE: Lazy<Arc<Mutex<GpuCache>>> = 
    Lazy::new(|| Arc::new(Mutex::new(GpuCache::new())));

const GPU_CACHE_TTL: Duration = Duration::from_secs(2);

pub async fn get_all_gpu_info() -> Vec<GpuInfo> {
    let mut cache = GPU_CACHE.lock().await;
    
    if !cache.is_expired(GPU_CACHE_TTL) {
        if let Some(cached) = cache.get() {
            log::debug!("使用缓存的GPU信息");
            return cached;
        }
    }
    
    log::info!("刷新GPU信息缓存");
    
    let mut gpus = Vec::new();
    
    let (nvidia_result, amd_result) = tokio::join!(
        nvidia::try_nvidia_gpu(),
        amd::try_amd_gpu()
    );
    
    if let Some(nvidia) = nvidia_result {
        log::info!("发现NVIDIA GPU: {}", nvidia.name);
        gpus.push(nvidia);
    }
    
    if let Some(amd) = amd_result {
        log::info!("发现AMD GPU: {}", amd.name);
        gpus.push(amd);
    }
    
    if gpus.is_empty() {
        log::info!("未发现厂商特定GPU，回退到WMI");
        let wmi_gpus = wmi::query_wmi_gpus().await;
        if !wmi_gpus.is_empty() {
            log::info!("WMI发现{}个GPU", wmi_gpus.len());
            gpus.extend(wmi_gpus);
        } else {
            log::info!("通过任何方法都未检测到GPU");
        }
    }
    
    cache.update(gpus.clone());
    gpus
}
