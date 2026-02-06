import React, { useState, useEffect } from 'react';
import { Typography, Spin, Tag, Badge } from 'antd';
import { CloudOutlined, RiseOutlined, EnvironmentOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import axios from 'axios';
import { CardProps } from '../types';
import { useSmartInterval } from '../../../hooks/useSmartInterval';

export const WeatherCard: React.FC<CardProps> = React.memo(({ card }) => {
    const [weather, setWeather] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchWeather = async () => {
        const cacheKey = `weather_${card.parsedConfig?.city || 'default'}`;
        const cached = localStorage.getItem(cacheKey);
        let cachedData = null;
        
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            cachedData = data;
            if (Date.now() - timestamp < 30 * 60 * 1000) {
                setWeather(data);
                setLoading(false);
                setError('');
                return;
            }
        }

        try {
            setLoading(true);
            // Default to Shanghai
            let lat = 31.23;
            let lon = 121.47;
            let cityName = '上海';
            
            if (card.parsedConfig?.city) {
                try {
                    const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(card.parsedConfig.city)}&count=1&language=zh&format=json`);
                    if (geoRes.data.results && geoRes.data.results.length > 0) {
                        lat = geoRes.data.results[0].latitude;
                        lon = geoRes.data.results[0].longitude;
                        cityName = geoRes.data.results[0].name;
                    }
                } catch (e) {
                    console.error('Geocoding failed', e);
                }
            }
            
            const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`);
            
            const data = response.data.current;
            
            // Map WMO weather code to text/icon
            const getWeatherStatus = (code: number) => {
                if (code === 0) return '晴';
                if (code <= 3) return '多云';
                if (code <= 48) return '雾';
                if (code <= 67) return '雨';
                if (code <= 77) return '雪';
                if (code <= 82) return '阵雨';
                return '阴';
            };

            const weatherData = {
                temp: data.temperature_2m,
                humidity: data.relative_humidity_2m,
                condition: getWeatherStatus(data.weather_code),
                wind: data.wind_speed_10m,
                city: cityName
            };

            setWeather(weatherData);
            localStorage.setItem(cacheKey, JSON.stringify({ data: weatherData, timestamp: Date.now() }));
            setError('');
        } catch (err) {
            console.error(err);
            if (cachedData) {
                setWeather(cachedData);
                setError('网络错误，显示缓存数据');
            } else {
                setError('获取失败');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeather();
    }, [card.parsedConfig?.city]);

    useSmartInterval(fetchWeather, 30 * 60 * 1000);

    if (loading && !weather) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spin size="small" tip="加载中..." /></div>;
    if (error) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: 12, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <EnvironmentOutlined />
                    <Typography.Text style={{ color: 'inherit', fontFamily: 'var(--card-font-family)' }}>{weather.city}</Typography.Text>
                </div>
                <Tag color="blue">{weather.condition}</Tag>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flex: 1 }}>
                <CloudOutlined style={{ fontSize: 'calc(var(--card-font-size, 16px) * 2.5)', color: 'var(--ant-color-primary)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 'calc(var(--card-font-size, 16px) * 2)', fontWeight: 'bold', lineHeight: 1, fontFamily: 'var(--card-font-family)' }}>{weather.temp}°</span>
                    <span style={{ fontSize: 'calc(var(--card-font-size, 16px) * 0.75)', color: 'inherit', opacity: 0.6, fontFamily: 'var(--card-font-family)' }}>湿度 {weather.humidity}%</span>
                </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'calc(var(--card-font-size, 16px) * 0.75)', color: 'inherit', opacity: 0.7, fontFamily: 'var(--card-font-family)' }}>
                <span>风速: {weather.wind} km/h</span>
                <span>AQI: 45 (优)</span>
            </div>
        </div>
    );
});
