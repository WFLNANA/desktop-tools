/*
 * @Author       : wfl
 * @LastEditors  : wfl
 * @description  : 
 * @updateInfo   : 
 * @Date         : 2026-02-03 16:59:19
 * @LastEditTime : 2026-02-03 17:51:27
 */
import React from 'react';
import { Typography } from 'antd';
import { CARD_TYPES } from './types';
import { TimeCard } from './items/TimeCard';
import { MemoryCard, GpuCard, NetworkCard } from './items/SystemCards';
import { CountdownCard, HydrationCard, CalendarCard } from './items/UtilityCards';
import { WoodenFishCard } from './items/WoodenFish';
import { WeatherCard } from './items/InfoCards';

// Placeholder components for other cards
export const PlaceholderCard = ({ card }: { card: any }) => {
    return (
        <div style={{ padding: 20, textAlign: 'center' }}>
            <Typography.Text>未找到组件: {card?.type}</Typography.Text>
        </div>
    );
};

export const CARD_COMPONENTS: Record<string, React.ComponentType<any>> = {
    [CARD_TYPES.TIME]: TimeCard,
    [CARD_TYPES.COUNTDOWN]: CountdownCard,
    [CARD_TYPES.WEATHER]: WeatherCard,
    [CARD_TYPES.WOODEN_FISH]: WoodenFishCard,
    [CARD_TYPES.HYDRATION]: HydrationCard,
    [CARD_TYPES.CALENDAR]: CalendarCard,
    [CARD_TYPES.GPU]: GpuCard,
    [CARD_TYPES.MEMORY]: MemoryCard,
    [CARD_TYPES.NETWORK]: NetworkCard,
};
