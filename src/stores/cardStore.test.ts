import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCardStore } from './cardStore';

// Mock Tauri invoke
const invokeMock = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: any[]) => invokeMock(...args),
}));

describe('cardStore', () => {
  beforeEach(() => {
    useCardStore.setState({ cards: [], loading: false });
    invokeMock.mockReset();
    // Mock get_desktop_cards to return empty array by default
    invokeMock.mockImplementation((cmd) => {
        if (cmd === 'get_desktop_cards') return Promise.resolve([]);
        return Promise.resolve();
    });
  });

  it('should toggle card lock state', async () => {
    // Setup initial state directly
    useCardStore.setState({
      cards: [
        { 
            id: '1', 
            type: 'time', 
            title: 'Time', 
            parsedConfig: { isLocked: false },
            config: '{}',
            createdAt: '',
            updatedAt: '',
            zIndex: 0,
            width: 300,
            height: 200,
            x: 0,
            y: 0
        }
      ]
    });

    const store = useCardStore.getState();
    await store.toggleCardLock('1');

    // Verify update_desktop_card was called with isLocked: true
    expect(invokeMock).toHaveBeenCalledWith('update_desktop_card', expect.objectContaining({
        id: '1',
        // The config is stringified, so we check if it contains the json string
        config: expect.stringContaining('"isLocked":true')
    }));
  });
});
