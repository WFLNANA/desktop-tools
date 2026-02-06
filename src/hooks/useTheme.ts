/*
 * @Author       : wfl
 * @LastEditors  : wfl
 * @description  : 
 * @updateInfo   : 
 * @Date         : 2026-01-22 11:11:37
 * @LastEditTime : 2026-01-23 09:45:41
 */
import { useEffect, useState, useCallback, useRef } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface UseThemeReturn {
  theme: Theme;
  currentTheme: 'light' | 'dark';
  isSystemTheme: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    
    const saved = localStorage.getItem('theme') as Theme;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    
    return 'system';
  });

  const isFirstRender = useRef(true);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return getEffectiveTheme(theme);
  });

  useEffect(() => {
    const effectiveTheme = getEffectiveTheme(theme);
    setCurrentTheme(effectiveTheme);
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    
    // 同步更新 Ant Design 算法
    // 注意：这里我们不需要手动更新 Ant Design，因为 App.tsx 中会根据 currentTheme 重新渲染 ConfigProvider
    
    if (!isFirstRender.current) {
      localStorage.setItem('theme', theme);
    } else {
      isFirstRender.current = false;
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      if (prev === 'system') return 'light';
      return prev === 'light' ? 'dark' : 'light';
    });
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const newTheme = getSystemTheme();
        setCurrentTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return { 
    theme,
    currentTheme, 
    isSystemTheme: theme === 'system',
    toggleTheme, 
    setTheme 
  };
}
