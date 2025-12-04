import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface CookTimer {
  id: string;
  duration: number; // in seconds
  remaining: number; // in seconds
  label: string;
  description?: string;
  isActive: boolean;
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
  addTimer: (timer: Omit<CookTimer, 'id'>) => void;
  removeTimer: (id: string) => void;
  updateTimer: (id: string, updates: Partial<CookTimer>) => void;
  setWakeLockActive: (active: boolean) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (index: number) => void;
  totalSteps: number;
}

const CookSessionContext = createContext<CookSessionContextType | undefined>(undefined);

interface CookSessionProviderProps {
  children: ReactNode;
  totalSteps: number;
}

export const CookSessionProvider: React.FC<CookSessionProviderProps> = ({ 
  children, 
  totalSteps 
}) => {
  const [state, setState] = useState<CookSessionState>({
    currentStepIndex: 0,
    timers: [],
    wakeLockActive: false,
    sessionStartTime: new Date(),
  });

  const setCurrentStepIndex = useCallback((index: number) => {
    setState(prev => ({ ...prev, currentStepIndex: Math.max(0, Math.min(index, totalSteps - 1)) }));
  }, [totalSteps]);

  const addTimer = useCallback((timerData: Omit<CookTimer, 'id'>) => {
    const timer: CookTimer = {
      ...timerData,
      id: `timer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setState(prev => ({ ...prev, timers: [...prev.timers, timer] }));
  }, []);

  const removeTimer = useCallback((id: string) => {
    setState(prev => ({ ...prev, timers: prev.timers.filter(t => t.id !== id) }));
  }, []);

  const updateTimer = useCallback((id: string, updates: Partial<CookTimer>) => {
    setState(prev => ({
      ...prev,
      timers: prev.timers.map(timer => 
        timer.id === id ? { ...timer, ...updates } : timer
      )
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
