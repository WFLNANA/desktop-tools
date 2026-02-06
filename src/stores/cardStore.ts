import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export interface CardConfig {
  bgColor?: string;
  textColor?: string;
  fontSize?: number;
  transparent?: number;
  // Specific configs for card types
  [key: string]: any;
}

export interface DesktopCard {
  id: string;
  type: string;
  title?: string;
  config: string; // JSON string from DB
  parsedConfig?: CardConfig;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  z_index: number;
  is_visible: boolean;
}

interface CardState {
  cards: DesktopCard[];
  loading: boolean;
  loadCards: () => Promise<void>;
  addCard: (type: string, title: string, config: CardConfig) => Promise<void>;
  updateCard: (id: string, title: string, config: CardConfig) => Promise<void>;
  updateCardPosition: (id: string, x: number, y: number, w: number, h: number) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  reorderCards: (ids: string[]) => Promise<void>;
  toggleCardLock: (id: string) => Promise<void>;
}

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  loading: false,

  loadCards: async () => {
    set({ loading: true });
    try {
      const cards = await invoke<DesktopCard[]>('get_desktop_cards');
      const parsedCards = cards.map(c => {
        try {
            return {
                ...c,
                parsedConfig: c.config ? JSON.parse(c.config) : {}
            };
        } catch (e) {
            console.error(`Failed to parse config for card ${c.id}:`, e);
            return {
                ...c,
                parsedConfig: {}
            };
        }
      });
      set({ cards: parsedCards, loading: false });
    } catch (error) {
      console.error('Failed to load cards:', error);
      set({ loading: false });
    }
  },

  addCard: async (type, title, config) => {
    try {
      const payload = {
        type,
        title,
        config: JSON.stringify(config),
        position_x: 0,
        position_y: 0,
        width: 300,
        height: 200,
      };
      const newCard = await invoke<DesktopCard>('create_desktop_card', { payload });
      const parsedCard = {
        ...newCard,
        parsedConfig: JSON.parse(newCard.config)
      };
      set(state => ({ cards: [...state.cards, parsedCard] }));
    } catch (error) {
      console.error('Failed to create card:', error);
    }
  },

  updateCard: async (id, title, config) => {
    try {
      await invoke('update_desktop_card', {
        id,
        title,
        config: JSON.stringify(config),
      });
      set(state => ({
        cards: state.cards.map(c =>
          c.id === id ? { ...c, title, parsedConfig: config, config: JSON.stringify(config) } : c
        ),
      }));
    } catch (error) {
      console.error('Failed to update card:', error);
    }
  },

  updateCardPosition: async (id, x, y, w, h) => {
    // Optimistic update
    set(state => ({
      cards: state.cards.map(c =>
        c.id === id ? { ...c, position_x: x, position_y: y, width: w, height: h } : c
      ),
    }));

    try {
      await invoke('update_card_position', {
        id,
        positionX: x,
        positionY: y,
        width: w,
        height: h,
      });
    } catch (error) {
      console.error('Failed to update card position:', error);
      // Revert if needed (omitted for brevity)
    }
  },

  deleteCard: async (id) => {
    try {
      await invoke('delete_desktop_card', { id });
      set(state => ({ cards: state.cards.filter(c => c.id !== id) }));
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  },

  reorderCards: async (ids) => {
    // Optimistic update
    set(state => {
      const cardMap = new Map(state.cards.map(c => [c.id, c]));
      const newCards = ids.map(id => cardMap.get(id)).filter((c): c is DesktopCard => !!c);
      // Append any cards that might have been missed (shouldn't happen if ids is complete)
      const remaining = state.cards.filter(c => !ids.includes(c.id));
      return { cards: [...newCards, ...remaining] };
    });

    try {
        await invoke('update_card_order', { ids });
    } catch (error) {
        console.error('Failed to reorder cards:', error);
        // Revert on error? For now, we just log.
    }
  },

  toggleCardLock: async (id) => {
    const card = get().cards.find(c => c.id === id);
    if (!card) return;

    const newConfig = { ...card.parsedConfig, isLocked: !card.parsedConfig?.isLocked };
    await get().updateCard(id, card.title || '', newConfig);
  },
}));
