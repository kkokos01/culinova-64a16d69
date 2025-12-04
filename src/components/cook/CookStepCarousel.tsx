import React, { useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Timer } from 'lucide-react';
import { useCookSession } from '@/context/cook/CookSessionContext';
import { Card, CardContent } from '@/components/ui/card';
import { getFirstTimeFromText, timeToSeconds } from '@/utils/parseTimeFromText';

interface CookStepCarouselProps {
  steps: any[]; // Will be typed as Step[] once we import the type
}

const CookStepCarousel: React.FC<CookStepCarouselProps> = ({ steps }) => {
  const { 
    state, 
    setCurrentStepIndex, 
    nextStep, 
    previousStep,
    addTimer
  } = useCookSession();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    dragFree: false,
    containScroll: 'keepSnaps',
    startIndex: 0,
  });

  // Sync carousel with context state
  const scrollTo = useCallback((index: number) => {
    if (emblaApi) {
      emblaApi.scrollTo(index);
    }
  }, [emblaApi]);

  // Handle carousel changes
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const selectedIndex = emblaApi.selectedScrollSnap();
      setCurrentStepIndex(selectedIndex);
    };

    emblaApi.on('select', onSelect);
    emblaApi.on('init', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('init', onSelect);
    };
  }, [emblaApi, setCurrentStepIndex]);

  // Sync context state changes to carousel
  useEffect(() => {
    if (emblaApi && emblaApi.selectedScrollSnap() !== state.currentStepIndex) {
      scrollTo(state.currentStepIndex);
    }
  }, [state.currentStepIndex, emblaApi, scrollTo]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        previousStep();
      } else if (event.key === 'ArrowRight') {
        nextStep();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [nextStep, previousStep]);

  const totalSteps = steps.length;
  const canGoPrevious = state.currentStepIndex > 0;
  const canGoNext = state.currentStepIndex < totalSteps - 1;

  // Handle starting a timer for the current step
  const handleStartTimer = useCallback(() => {
    const currentStep = steps[state.currentStepIndex];
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
  }, [steps, state.currentStepIndex, addTimer]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-full">
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
            className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((state.currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Carousel Container */}
      <div className="flex-1 relative">
        <div className="overflow-hidden h-full" ref={emblaRef}>
          <div className="flex h-full">
            {steps.map((step, index) => {
              const instructionText = step?.instruction || '';
              const parsedTime = getFirstTimeFromText(instructionText);
              const isCurrentStep = index === state.currentStepIndex;
              
              return (
                <div 
                  key={index} 
                  className="flex-[0_0_100%] min-w-0 flex items-center justify-center p-4"
                >
                  <Card className="w-full h-full max-h-[600px] flex flex-col">
                    <CardContent className="p-8 lg:p-12 text-center flex-1 flex flex-col">
                      <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                        Step {index + 1}
                      </div>
                      
                      <div className="text-xl lg:text-2xl text-gray-800 leading-relaxed whitespace-pre-wrap flex-1 flex items-center justify-center">
                        {instructionText || 'No instruction for this step.'}
                      </div>

                      {/* Timer Button - Only show for current step if time detected */}
                      {isCurrentStep && parsedTime && (
                        <div className="mt-6">
                          <Button
                            onClick={handleStartTimer}
                            variant="outline"
                            size="lg"
                            className="min-h-[56px] text-lg border-blue-500 text-blue-600 hover:bg-blue-50"
                          >
                            <Timer className="w-5 h-5 mr-2" />
                            Start {parsedTime.originalText} Timer
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8 gap-4">
        <Button
          onClick={previousStep}
          disabled={!canGoPrevious}
          variant="outline"
          size="lg"
          className="min-h-[60px] min-w-[140px] text-lg"
        >
          <ChevronLeft className="w-6 h-6 mr-2" />
          Previous
        </Button>

        <Button
          onClick={nextStep}
          disabled={!canGoNext}
          variant="default"
          size="lg"
          className="min-h-[60px] min-w-[140px] text-lg bg-blue-600 hover:bg-blue-700"
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

      {/* Step Indicators */}
      <div className="flex justify-center items-center gap-2 mt-6">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStepIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === state.currentStepIndex
                ? 'bg-blue-600 w-8'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to step ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default CookStepCarousel;
