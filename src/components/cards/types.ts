import { DesktopCard, CardConfig } from '../../stores/cardStore';

export interface CardProps {
  card: DesktopCard;
  isEditing: boolean;
  onUpdate: (config: CardConfig) => void;
  size?: 'small' | 'medium' | 'large';
}

// --- Configuration Contracts ---

export interface BaseCardConfig {
  bgColor?: string;
  textColor?: string;
  transparent?: number; // 0-100
  fontSize?: number;
  fontFamily?: string;
  isPinned?: boolean;
}

export interface TimeCardConfig extends BaseCardConfig {
  is24Hour?: boolean;
  showDate?: boolean;
}

export interface WeatherCardConfig extends BaseCardConfig {
  city?: string;
  refreshInterval?: number;
}

export interface CountdownCardConfig extends BaseCardConfig {
  targetDate: string; // ISO string
  title?: string;
}

export interface WoodenFishCardConfig extends BaseCardConfig {
  count?: number;
  autoKnock?: boolean; // Future feature
}

export interface HydrationCardConfig extends BaseCardConfig {
  cups?: number;
  target?: number;
  lastDrink?: string; // ISO string
}

export interface CalendarCardConfig extends BaseCardConfig {
  view?: 'month' | 'year';
}

// System cards usually don't have specific config other than base
export interface SystemCardConfig extends BaseCardConfig {
  showGraph?: boolean;
}

export type AnyCardConfig = 
  | TimeCardConfig 
  | WeatherCardConfig 
  | CountdownCardConfig 
  | WoodenFishCardConfig 
  | HydrationCardConfig 
  | CalendarCardConfig 
  | SystemCardConfig;

export const CARD_TYPES = {
  TIME: 'time',
  COUNTDOWN: 'countdown',
  WEATHER: 'weather',
  WOODEN_FISH: 'wooden_fish',
  HYDRATION: 'hydration',
  CALENDAR: 'calendar',
  GPU: 'gpu',
  MEMORY: 'memory',
  NETWORK: 'network',
} as const;

export const CARD_META = {
  [CARD_TYPES.TIME]: { name: '时间', defaultWidth: 300, defaultHeight: 150 },
  [CARD_TYPES.COUNTDOWN]: { name: '倒计时', defaultWidth: 300, defaultHeight: 150 },
  [CARD_TYPES.WEATHER]: { name: '天气', defaultWidth: 300, defaultHeight: 200 },
  [CARD_TYPES.WOODEN_FISH]: { name: '木鱼', defaultWidth: 200, defaultHeight: 200 },
  [CARD_TYPES.HYDRATION]: { name: '喝水提醒', defaultWidth: 200, defaultHeight: 150 },
  [CARD_TYPES.CALENDAR]: { name: '日历', defaultWidth: 300, defaultHeight: 300 },
  [CARD_TYPES.GPU]: { name: 'GPU监控', defaultWidth: 300, defaultHeight: 200 },
  [CARD_TYPES.MEMORY]: { name: '内存监控', defaultWidth: 300, defaultHeight: 200 },
  [CARD_TYPES.NETWORK]: { name: '网速', defaultWidth: 300, defaultHeight: 150 },
};
