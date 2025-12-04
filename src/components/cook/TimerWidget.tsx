import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Timer, Clock } from 'lucide-react';
import { useCookSession, type CookTimer } from '@/context/cook/CookSessionContext';
import { formatSeconds } from '@/utils/parseTimeFromText';

// Initialize audio context once at module level
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

const playNotificationSound = () => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800; // Notification frequency
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
};

const TimerWidget: React.FC = () => {
  const { state, removeTimer, updateTimer } = useCookSession();
  const { timers } = state;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [completedTimers, setCompletedTimers] = useState<Set<string>>(new Set());

  // Play notification sound (memoized)
  const handleTimerComplete = useCallback((timerId: string) => {
    if (!completedTimers.has(timerId)) {
      setCompletedTimers(prev => new Set(prev).add(timerId));
      try {
        playNotificationSound();
      } catch (error) {
        console.warn('Could not play notification sound:', error);
      }
    }
  }, [completedTimers]);

  // Update timers every second
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      timers.forEach(timer => {
        if (timer.isActive && timer.remaining > 0) {
          const newRemaining = Math.max(0, timer.remaining - 1);
          updateTimer(timer.id, { remaining: newRemaining });
          
          // Auto-stop timer when it reaches zero
          if (newRemaining === 0) {
            updateTimer(timer.id, { isActive: false });
            handleTimerComplete(timer.id);
          }
        }
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timers, updateTimer, handleTimerComplete]);

  // Clean up completed timers when they're removed
  useEffect(() => {
    const currentTimerIds = new Set(timers.map(t => t.id));
    setCompletedTimers(prev => {
      const updated = new Set<string>();
      prev.forEach(id => {
        if (currentTimerIds.has(id)) {
          updated.add(id);
        }
      });
      return updated;
    });
  }, [timers]);

  if (timers.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 max-w-sm">
      {timers.map(timer => (
        <TimerCard 
          key={timer.id} 
          timer={timer} 
          onRemove={() => removeTimer(timer.id)}
          onToggle={() => updateTimer(timer.id, { isActive: !timer.isActive })}
        />
      ))}
    </div>
  );
};

interface TimerCardProps {
  timer: CookTimer;
  onRemove: () => void;
  onToggle: () => void;
}

const TimerCard: React.FC<TimerCardProps> = ({ timer, onRemove, onToggle }) => {
  const isCompleted = timer.remaining === 0 && !timer.isActive;
  const isActive = timer.isActive && timer.remaining > 0;

  return (
    <Card className={`shadow-lg border-2 transition-all duration-300 backdrop-blur-sm ${
      isCompleted 
        ? 'border-red-500 bg-red-50/75 animate-pulse' 
        : isActive 
          ? 'border-blue-500 bg-blue-50/75' 
          : 'border-gray-200 bg-white/75'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-full flex-shrink-0 ${
              isCompleted 
                ? 'bg-red-500 text-white' 
                : isActive 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-600'
            }`}>
              {isCompleted ? (
                <Timer className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-900 truncate">
                {timer.label}
              </div>
              {timer.description && (
                <div className="text-xs text-gray-600 mt-1 break-words">
                  {timer.description}
                </div>
              )}
              <div className={`text-lg font-mono ${
                isCompleted 
                  ? 'text-red-600' 
                  : isActive 
                    ? 'text-blue-600' 
                    : 'text-gray-600'
              }`}>
                {formatSeconds(timer.remaining)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {timer.remaining > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onToggle}
                className={`h-8 w-8 p-0 ${
                  isActive 
                    ? 'text-blue-600 hover:bg-blue-100' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {isActive ? '⏸' : '▶'}
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onRemove}
              className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isCompleted && (
          <div className="mt-2 text-center">
            <span className="text-sm font-semibold text-red-600 animate-pulse">
              ⏰ Timer Complete!
            </span>
            {timer.description && (
              <div className="text-xs text-gray-600 mt-1 break-words">
                {timer.description}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimerWidget;
