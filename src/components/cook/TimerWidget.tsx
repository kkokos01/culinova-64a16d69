import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Timer, Clock } from 'lucide-react';
import { useCookSession, type CookTimer } from '@/context/cook/CookSessionContext';
import { formatSeconds } from '@/utils/parseTimeFromText';

const TimerWidget: React.FC = () => {
  const { state, removeTimer, updateTimer } = useCookSession();
  const { timers } = state;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
          }
        }
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timers, updateTimer]);

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
    <Card className={`shadow-lg border-2 transition-all duration-300 ${
      isCompleted 
        ? 'border-red-500 bg-red-50 animate-pulse' 
        : isActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 bg-white'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2 rounded-full ${
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
            
            <div className="flex-1">
              <div className="font-semibold text-sm text-gray-900">
                {timer.label}
              </div>
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

          <div className="flex items-center gap-1">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimerWidget;
