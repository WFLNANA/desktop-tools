import { useEffect, useRef } from 'react';

export const useSmartInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(callback);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    if (delay !== null) {
      const tick = () => {
        if (!document.hidden) {
            savedCallback.current();
        }
      };
      
      const id = setInterval(tick, delay);
      
      // Also listen to visibility change to trigger immediately when becoming visible
      const handleVisibilityChange = () => {
        if (!document.hidden) {
            savedCallback.current();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        clearInterval(id);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [delay]);
};
