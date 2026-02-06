import React, { useState, useEffect, useRef } from 'react';
import { Typography, Button, Calendar, Badge, Tooltip, ConfigProvider } from 'antd';
import { CoffeeOutlined, SoundOutlined, CalendarOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Solar, Lunar } from 'lunar-javascript';
import { CardProps } from '../types';
import zhCN from 'antd/es/locale/zh_CN';
import { useSmartInterval } from '../../../hooks/useSmartInterval';

// --- CountdownCard ---
export const CountdownCard = React.memo<CardProps>(({ card }) => {
    const config = card.parsedConfig || {};
    const targetDate = config.targetDate ? dayjs(config.targetDate) : dayjs().add(1, 'day');
    const [timeLeft, setTimeLeft] = useState<{d: number, h: number, m: number, s: number} | null>(null);
    const [isArrived, setIsArrived] = useState(false);

    useSmartInterval(() => {
        const now = dayjs();
        const diff = targetDate.diff(now);
        if (diff <= 0) {
            setIsArrived(true);
            setTimeLeft(null);
        } else {
            setIsArrived(false);
            setTimeLeft({
                d: Math.floor(diff / (1000 * 60 * 60 * 24)),
                h: Math.floor((diff / (1000 * 60 * 60)) % 24),
                m: Math.floor((diff / 1000 / 60) % 60),
                s: Math.floor((diff / 1000) % 60)
            });
        }
    }, 1000);

    return (
        <div style={{ textAlign: 'center', padding: '10px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography.Title level={5} style={{ marginBottom: 15, color: 'inherit', fontSize: 'calc(var(--card-font-size, 16px) * 1.1)', fontFamily: 'var(--card-font-family)' }}>{config.title || '倒计时'}</Typography.Title>
            {isArrived ? (
                <Typography.Title level={3} type="success" style={{ fontSize: 'calc(var(--card-font-size, 16px) * 1.5)', fontFamily: 'var(--card-font-family)' }}>已到达</Typography.Title>
            ) : timeLeft ? (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 'calc(var(--card-font-size, 16px) * 1.5)', fontWeight: 'bold', fontFamily: 'var(--card-font-family)' }}>{timeLeft.d}</span>
                        <span style={{ fontSize: 'calc(var(--card-font-size, 16px) * 0.8)', color: 'inherit', opacity: 0.6, fontFamily: 'var(--card-font-family)' }}>天</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 'calc(var(--card-font-size, 16px) * 1.5)', fontWeight: 'bold', fontFamily: 'var(--card-font-family)' }}>{timeLeft.h}</span>
                        <span style={{ fontSize: 'calc(var(--card-font-size, 16px) * 0.8)', color: 'inherit', opacity: 0.6, fontFamily: 'var(--card-font-family)' }}>时</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 'calc(var(--card-font-size, 16px) * 1.5)', fontWeight: 'bold', fontFamily: 'var(--card-font-family)' }}>{timeLeft.m}</span>
                        <span style={{ fontSize: 'calc(var(--card-font-size, 16px) * 0.8)', color: 'inherit', opacity: 0.6, fontFamily: 'var(--card-font-family)' }}>分</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 'calc(var(--card-font-size, 16px) * 1.5)', fontWeight: 'bold', fontFamily: 'var(--card-font-family)' }}>{timeLeft.s}</span>
                        <span style={{ fontSize: 'calc(var(--card-font-size, 16px) * 0.8)', color: 'inherit', opacity: 0.6, fontFamily: 'var(--card-font-family)' }}>秒</span>
                    </div>
                </div>
            ) : (
                <Typography.Text style={{ color: 'inherit' }}>加载中...</Typography.Text>
            )}
            <Typography.Text style={{ marginTop: 10, fontSize: 'calc(var(--card-font-size, 16px) * 0.8)', color: 'inherit', opacity: 0.6, fontFamily: 'var(--card-font-family)' }}>
                目标: {targetDate.format('YYYY-MM-DD HH:mm')}
            </Typography.Text>
        </div>
    );
});

// --- HydrationCard ---
export const HydrationCard = React.memo<CardProps>(({ card, onUpdate }) => {
    const config = card.parsedConfig || {};
    const [cups, setCups] = useState(config.cups || 0);
    const [lastDrink, setLastDrink] = useState<dayjs.Dayjs | null>(config.lastDrink ? dayjs(config.lastDrink) : null);
    const target = config.target || 8;

    // Reset if new day
    useEffect(() => {
        if (lastDrink && !lastDrink.isSame(dayjs(), 'day')) {
            setCups(0);
            onUpdate?.({ cups: 0 });
        }
    }, [lastDrink]);

    const drink = () => {
        const now = dayjs();
        const newCups = cups + 1;
        setCups(newCups);
        setLastDrink(now);
        onUpdate?.({ cups: newCups, lastDrink: now.toISOString() });
    };

    return (
        <div style={{ textAlign: 'center', padding: 10, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography.Text strong style={{ color: 'inherit', fontSize: 'var(--card-font-size, 16px)', fontFamily: 'var(--card-font-family)' }}>喝水提醒</Typography.Text>
                <Typography.Text style={{ fontSize: 'calc(var(--card-font-size, 16px) * 0.8)', color: 'inherit', opacity: 0.6, fontFamily: 'var(--card-font-family)' }}>目标 {target} 杯</Typography.Text>
            </div>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <CoffeeOutlined style={{ fontSize: 'calc(var(--card-font-size, 16px) * 3)', color: '#1890ff', opacity: 0.8 }} />
                <Badge count={cups} offset={[10, -40]} color="#1890ff" showZero overflowCount={99}>
                    <div style={{ width: 1, height: 1 }} />
                </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Typography.Text style={{ fontSize: 'calc(var(--card-font-size, 16px) * 0.8)', color: 'inherit', fontFamily: 'var(--card-font-family)' }}>
                    {lastDrink ? `上次: ${lastDrink.format('HH:mm')}` : '今天还没喝水哦'}
                </Typography.Text>
                <Button type="primary" shape="round" icon={<PlusOutlined />} onClick={drink} size="small">
                    喝一杯
                </Button>
            </div>
        </div>
    );
});

// --- CalendarCard ---
export const CalendarCard: React.FC<CardProps> = React.memo(({ card }) => {
    const dateCellRender = (value: dayjs.Dayjs) => {
        const solar = Solar.fromDate(value.toDate());
        const lunar = solar.getLunar();
        const day = lunar.getDayInChinese();
        
        return (
            <div style={{ fontSize: '0.8em', textAlign: 'center', color: '#999' }}>
                {day === '初一' ? `${lunar.getMonthInChinese()}月` : day}
            </div>
        );
    };

    return (
        <ConfigProvider locale={zhCN}>
            <div style={{ 
                height: '100%', 
                display: 'flex',
                flexDirection: 'column',
                fontSize: 'var(--card-font-size, 16px)',
                fontFamily: 'var(--card-font-family)'
            }}>
                <Calendar 
                    fullscreen={false} 
                    cellRender={dateCellRender}
                    headerRender={({ value, onChange }) => {
                        return (
                            <div style={{ padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography.Text strong style={{ fontSize: '1.1em', fontFamily: 'var(--card-font-family)' }}>{value.format('YYYY年MM月')}</Typography.Text>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <Button size="small" onClick={() => onChange(value.clone().subtract(1, 'month'))}>&lt;</Button>
                                    <Button size="small" onClick={() => onChange(value.clone().add(1, 'month'))}>&gt;</Button>
                                </div>
                            </div>
                        );
                    }}
                />
            </div>
        </ConfigProvider>
    );
});
