/*
 * @Author       : wfl
 * @LastEditors  : wfl
 * @description  : 
 * @updateInfo   : 
 * @Date         : 2026-01-26 16:21:42
 * @LastEditTime : 2026-02-02 15:41:20
 */
import React, { useState, useEffect } from 'react';
import { Tabs, Input, Empty, Skeleton } from 'antd';
import { useWallpaperStore } from './store';
import { Wallpaper } from './types';
import styles from './styles.module.scss';



const MOCK_CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'hot', label: '热门' },
  { key: 'scenery', label: '风景' },
  { key: 'anime', label: '动漫' },
  { key: 'abstract', label: '抽象' },
];

// Mock data generator
const generateMockWallpapers = (category: string, count: number): Wallpaper[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `online-${category}-${i}`,
        title: `${category} Wallpaper ${i + 1}`,
        // Use unsplash source for better visuals
        url: `https://picsum.photos/seed/${category}${i}/400/300`,
        source: 'online',
        width: 1920,
        height: 1080,
        size: 1024 * 1024 * 2 // 2MB
    }));
};

export const OnlineGallery: React.FC = () => {
    const [category, setCategory] = useState('all');
    const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
    const [loadedMap, setLoadedMap] = useState<Record<string, boolean>>({});
    const { setSelectedWallpaper, selectedWallpaper, openPreview } = useWallpaperStore();

    useEffect(() => {
        setWallpapers(generateMockWallpapers('all', 12));
        setLoadedMap({});
    }, []);

    const handleTabChange = (key: string) => {
        setCategory(key);
        setWallpapers(generateMockWallpapers(key, 12));
        setLoadedMap({});
    };

    const handleSearch = (value: string) => {
        if (!value) {
            setWallpapers(generateMockWallpapers(category, 12));
        } else {
             const all = generateMockWallpapers(category, 20);
             setWallpapers(all.filter(w => w.title.toLowerCase().includes(value.toLowerCase())));
        }
        setLoadedMap({});
    };

    return (
        <div className={styles.container} style={{ flexDirection: 'column', height: '100%', background: 'transparent' }}>
             <div className={styles.toolbar} style={{ borderBottom: '1px solid var(--ant-color-border-secondary)', paddingBottom: 0 }}>
                 <Tabs 
                    activeKey={category} 
                    onChange={handleTabChange}
                    items={MOCK_CATEGORIES}
                    style={{ marginBottom: -17 }}
                 />
                 <Input.Search 
                    placeholder="搜索壁纸..." 
                    onSearch={handleSearch} 
                    style={{ width: 200, marginBottom: 8 }}
                    allowClear
                 />
             </div>
             
            <div className={styles.masonry} style={{ marginTop: 16, flex: 1 }}>
                {wallpapers.map((w, index) => (
                    <div key={w.id} className={styles.masonryItem}>
                        <div 
                           className={`${styles.card} ${selectedWallpaper?.id === w.id ? styles.active : ''}`}
                           onClick={() => openPreview(wallpapers, index)}
                        >
                            <div style={{ position: 'relative', width: '100%', minHeight: 120 }}>
                                {!loadedMap[w.id] && (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Skeleton.Image active style={{ width: '100%', height: '100%', minHeight: 120 }} />
                                    </div>
                                )}
                                <img
                                    src={w.url}
                                    loading="lazy"
                                    alt={w.title}
                                    onLoad={() => setLoadedMap((prev) => (prev[w.id] ? prev : { ...prev, [w.id]: true }))}
                                    style={{ width: '100%', height: 'auto', display: 'block', opacity: loadedMap[w.id] ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
             {wallpapers.length === 0 && <Empty description="未找到壁纸" />}
        </div>
    );
};
