import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export interface CookTimer {
  id: string;
  duration: number; // in seconds
  remaining: number; // in seconds
  label: string;
  description?: string;
  isActive: boolean;
  startTime?: number; // timestamp when timer was started
}

export interface CookSessionState {
  currentStepIndex: number;
  timers: CookTimer[];
  wakeLockActive: boolean;
  sessionStartTime: Date;
}

export interface CookSessionContextType {
  state: CookSessionState;
  setCurrentStepIndex: (index: number) => void;
  addTimer: (timer: Omit<CookTimer, 'id' | 'startTime'>) => void;
  removeTimer: (id: string) => void;
  updateTimer: (id: string, updates: Partial<CookTimer>) => void;
  setWakeLockActive: (active: boolean) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (index: number) => void;
  totalSteps: number;
}

const CookSessionContext = createContext<CookSessionContextType | undefined>(undefined);

// Local storage keys
const STORAGE_KEYS = {
  TIMERS: 'culinova_cook_timers',
  SESSION_START: 'culinova_cook_session_start'
} as const;

// Save timers to localStorage
const saveTimersToStorage = (timers: CookTimer[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TIMERS, JSON.stringify(timers));
  } catch (error) {
    console.warn('Could not save timers to localStorage:', error);
  }
};

// Load timers from localStorage and recalculate remaining time
const loadTimersFromStorage = (): CookTimer[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TIMERS);
    if (!stored) return [];
    
    const timers: CookTimer[] = JSON.parse(stored);
    const now = Date.now();
    
    // Recalculate remaining time for active timers
    return timers.map(timer => {
      if (timer.isActive && timer.startTime) {
        const elapsed = Math.floor((now - timer.startTime) / 1000);
        const newRemaining = Math.max(0, timer.remaining - elapsed);
        
        return {
          ...timer,
          remaining: newRemaining,
          isActive: newRemaining > 0,
          startTime: newRemaining > 0 ? timer.startTime : undefined
        };
      }
      return timer;
    }).filter(timer => timer.remaining > 0 || !timer.isActive); // Remove completed timers
  } catch (error) {
    console.warn('Could not load timers from localStorage:', error);
    return [];
  }
};

interface CookSessionProviderProps {
  children: ReactNode;
  totalSteps: number;
}

export const CookSessionProvider: React.FC<CookSessionProviderProps> = ({ 
  children, 
  totalSteps 
}) => {
  const [state, setState] = useState<CookSessionState>(() => {
    // Load timers from localStorage on initial mount
    const savedTimers = loadTimersFromStorage();
    return {
      currentStepIndex: 0,
      timers: savedTimers,
      wakeLockActive: false,
      sessionStartTime: new Date(),
    };
  });

  // Save timers to localStorage whenever they change
  useEffect(() => {
    saveTimersToStorage(state.timers);
  }, [state.timers]);

  const setCurrentStepIndex = useCallback((index: number) => {
    setState(prev => ({ ...prev, currentStepIndex: Math.max(0, Math.min(index, totalSteps - 1)) }));
  }, [totalSteps]);

  const addTimer = useCallback((timer: Omit<CookTimer, 'id' | 'startTime'>) => {
    const newTimer: CookTimer = {
      ...timer,
      id: `timer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: timer.isActive ? Date.now() : undefined,
    };
    setState(prev => ({ ...prev, timers: [...prev.timers, newTimer] }));
  }, []);

  const removeTimer = useCallback((id: string) => {
    setState(prev => ({ 
      ...prev, 
      timers: prev.timers.filter(timer => timer.id !== id) 
    }));
  }, []);

  const updateTimer = useCallback((id: string, updates: Partial<CookTimer>) => {
    setState(prev => ({
      ...prev,
      timers: prev.timers.map(timer => {
        if (timer.id === id) {
          const updatedTimer = { ...timer, ...updates };
          
          // Update startTime when timer is started
          if (updates.isActive && !timer.isActive) {
            updatedTimer.startTime = Date.now();
          }
          // Clear startTime when timer is stopped
          else if (updates.isActive === false && timer.isActive) {
            updatedTimer.startTime = undefined;
          }
          
          return updatedTimer;
        }
        return timer;
      })
    }));
  }, []);

  const setWakeLockActive = useCallback((active: boolean) => {
    setState(prev => ({ ...prev, wakeLockActive: active }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStepIndex: Math.min(prev.currentStepIndex + 1, totalSteps - 1)
    }));
  }, [totalSteps]);

  const previousStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStepIndex: Math.max(prev.currentStepIndex - 1, 0)
    }));
  }, []);

  const goToStep = useCallback((index: number) => {
    setCurrentStepIndex(index);
  }, [setCurrentStepIndex]);

  const value: CookSessionContextType = {
    state,
    setCurrentStepIndex,
    addTimer,
    removeTimer,
    updateTimer,
    setWakeLockActive,
    nextStep,
    previousStep,
    goToStep,
    totalSteps,
  };

  return (
    <CookSessionContext.Provider value={value}>
      {children}
    </CookSessionContext.Provider>
  );
};

export const useCookSession = (): CookSessionContextType => {
  const context = useContext(CookSessionContext);
  if (context === undefined) {
    throw new Error('useCookSession must be used within a CookSessionProvider');
  }
  return context;
};
