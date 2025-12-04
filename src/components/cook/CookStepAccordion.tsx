import React, { useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Timer, ChevronDown, ChevronUp } from 'lucide-react';
import { useCookSession } from '@/context/cook/CookSessionContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getFirstTimeFromText, timeToSeconds } from '@/utils/parseTimeFromText';

interface CookStepAccordionProps {
  steps: any[]; // Will be typed as Step[] once we import the type
  fontSize: 'small' | 'standard' | 'large';
}

const CookStepAccordion: React.FC<CookStepAccordionProps> = ({ steps, fontSize }) => {
  const { 
    state, 
    setCurrentStepIndex, 
    nextStep, 
    previousStep,
    addTimer
  } = useCookSession();

  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const totalSteps = steps.length;
  const canGoPrevious = state.currentStepIndex > 0;
  const canGoNext = state.currentStepIndex < totalSteps - 1;

  // Handle starting a timer for the current step
  const handleStartTimer = useCallback((stepIndex: number) => {
    const currentStep = steps[stepIndex];
    const instructionText = currentStep?.instruction || '';
    const parsedTime = getFirstTimeFromText(instructionText);
    
    if (parsedTime) {
      const duration = timeToSeconds(parsedTime);
      addTimer({
        duration,
        remaining: duration,
        label: parsedTime.originalText,
        isActive: true,
      });
    }
  }, [steps, addTimer]);

  // Handle expanding/collapsing a step
  const handleStepClick = useCallback((stepIndex: number) => {
    setCurrentStepIndex(stepIndex);
  }, [setCurrentStepIndex]);

  // Handle Next button
  const handleNext = useCallback(() => {
    if (canGoNext) {
      const nextIndex = state.currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      
      // Scroll to the next step
      setTimeout(() => {
        stepRefs.current[nextIndex]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }, [canGoNext, state.currentStepIndex, setCurrentStepIndex]);

  // Handle Previous button
  const handlePrevious = useCallback(() => {
    if (canGoPrevious) {
      const prevIndex = state.currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      
      // Scroll to the previous step
      setTimeout(() => {
        stepRefs.current[prevIndex]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }, [canGoPrevious, state.currentStepIndex, setCurrentStepIndex]);

  // Generate short description for collapsed step
  const getShortDescription = (instruction: string) => {
    const words = instruction.split(' ');
    const shortWords = words.slice(0, 6);
    const shortText = shortWords.join(' ');
    return words.length > 6 ? shortText + '...' : shortText;
  };

  // Get font size classes based on current setting
  const getFontSizeClasses = () => {
    switch (fontSize) {
      case 'small':
        return {
          instruction: 'text-sm',
          title: 'text-base',
          button: 'text-sm',
          stepNumber: 'text-sm'
        };
      case 'large':
        return {
          instruction: 'text-2xl',
          title: 'text-xl',
          button: 'text-xl',
          stepNumber: 'text-lg'
        };
      default: // standard
        return {
          instruction: 'text-lg',
          title: 'text-base',
          button: 'text-lg',
          stepNumber: 'text-base'
        };
    }
  };

  const fontClasses = getFontSizeClasses();

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Step {state.currentStepIndex + 1} of {steps.length}
          </span>
          <span className="text-sm font-medium text-gray-600">
            {Math.round(((state.currentStepIndex + 1) / steps.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-green-600 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((state.currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Accordion Steps */}
      <div className="space-y-4 mb-8">
        {steps.map((step, index) => {
          const instructionText = step?.instruction || '';
          const parsedTime = getFirstTimeFromText(instructionText);
          const isActive = index === state.currentStepIndex;
          const isExpanded = isActive;

          return (
            <div 
              key={index} 
              ref={el => stepRefs.current[index] = el}
              className="scroll-mt-4"
            >
              <Card className={`transition-all duration-300 ${
                isActive ? 'ring-2 ring-green-500 shadow-lg' : 'shadow-md'
              }`}>
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleStepClick(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                isActive 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              } ${fontClasses.stepNumber}`}>
                        {index + 1}
                      </div>
                      <h3 className={`font-semibold text-gray-900 ${fontClasses.title}`}>
                        Step {index + 1}
                      </h3>
                      {!isActive && (
                        <span className="text-gray-600">
                          - {getShortDescription(instructionText)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {parsedTime && !isActive && (
                        <div className="flex items-center text-green-600 text-sm">
                          <Timer className="w-4 h-4 mr-1" />
                          {parsedTime.originalText}
                        </div>
                      )}
                      <Button variant="ghost" size="sm">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className={`text-gray-800 leading-relaxed mb-6 ${fontClasses.instruction}`}>
                      {instructionText || 'No instruction for this step.'}
                    </div>

                    {/* Timer Button - Only show for active step if time detected */}
                    {parsedTime && (
                      <div className="mb-4">
                        <Button
                          onClick={() => handleStartTimer(index)}
                          variant="outline"
                          size="lg"
                          className={`min-h-[56px] border-green-500 text-green-600 hover:bg-green-50 ${fontClasses.button}`}
                        >
                          <Timer className="w-5 h-5 mr-2" />
                          Start {parsedTime.originalText} Timer
                        </Button>
                      </div>
                    )}

                    {/* Navigation Buttons - Only show for active step */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <Button
                        onClick={handlePrevious}
                        disabled={!canGoPrevious}
                        variant="outline"
                        size="lg"
                        className="min-h-[60px] min-w-[140px]"
                      >
                        <ChevronLeft className="w-6 h-6 mr-2" />
                        Previous
                      </Button>

                      <Button
                        onClick={handleNext}
                        disabled={!canGoNext}
                        variant="default"
                        size="lg"
                        className="min-h-[60px] min-w-[140px] bg-green-600 hover:bg-green-700 text-white"
                      >
                        {canGoNext ? (
                          <>
                            Next
                            <ChevronRight className="w-6 h-6 ml-2" />
                          </>
                        ) : (
                          'Done Cooking'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CookStepAccordion;
