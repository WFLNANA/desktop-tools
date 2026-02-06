const AUTOSTART_KEY = 'system_auto_start';
const CLOSE_BEHAVIOR_KEY = 'system_close_behavior';

export async function setAutoStart(enabled: boolean): Promise<void> {
  try {
    localStorage.setItem(AUTOSTART_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.warn('Failed to save auto-start preference:', error);
  }
}

export async function getAutoStart(): Promise<boolean> {
  try {
    return localStorage.getItem(AUTOSTART_KEY) === 'true';
  } catch {
    return false;
  }
}

export function getCloseBehavior(): 'exit' | 'minimize' {
  try {
    const saved = localStorage.getItem(CLOSE_BEHAVIOR_KEY);
    return (saved === 'exit' || saved === 'minimize') ? saved : 'exit';
  } catch {
    return 'exit';
  }
}

export function saveCloseBehavior(behavior: 'exit' | 'minimize'): void {
  try {
    localStorage.setItem(CLOSE_BEHAVIOR_KEY, behavior);
  } catch (error) {
    console.warn('Failed to save close behavior:', error);
  }
}
