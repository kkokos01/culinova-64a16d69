import { useState, useEffect, useCallback, useRef } from 'react';

interface WakeLockState {
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
}

export const useWakeLock = () => {
  const [state, setState] = useState<WakeLockState>({
    isSupported: false,
    isActive: false,
    error: null,
  });

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Check for wake lock support on mount
  useEffect(() => {
    const isSupported = 'wakeLock' in navigator;
    setState(prev => ({ ...prev, isSupported }));
  }, []);

  // Request wake lock
  const requestWakeLock = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Wake Lock API is not supported in this browser'
      }));
      return false;
    }

    try {
      // Release any existing wake lock
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
      }

      // Request new wake lock
      const wakeLock = await navigator.wakeLock.request('screen');
      wakeLockRef.current = wakeLock;

      setState(prev => ({
        ...prev,
        isActive: true,
        error: null,
      }));

      // Listen for wake lock release events
      wakeLock.addEventListener('release', () => {
        setState(prev => ({
          ...prev,
          isActive: false,
        }));
        wakeLockRef.current = null;
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isActive: false,
        error: `Failed to acquire wake lock: ${errorMessage}`,
      }));
      return false;
    }
  }, [state.isSupported]);

  // Release wake lock
  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setState(prev => ({
          ...prev,
          isActive: false,
          error: null,
        }));
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({
          ...prev,
          error: `Failed to release wake lock: ${errorMessage}`,
        }));
        return false;
      }
    }
    return true;
  }, []);

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && state.isActive && !wakeLockRef.current) {
        // Try to re-acquire wake lock if it was previously active
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isActive, requestWakeLock]);

  // Clean up wake lock on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  return {
    ...state,
    requestWakeLock,
    releaseWakeLock,
  };
};
