
import React from "react";
import { Step } from "@/types";

interface StepsSectionProps {
  steps: Step[];
}

const StepsSection: React.FC<StepsSectionProps> = ({ steps }) => {
  return (
    <div className="mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
        Instructions
      </h2>
      {steps.length > 0 ? (
        <ol className="space-y-4">
          {steps.map((step) => (
            <li key={step.id} className="flex">
              <div className="flex-shrink-0 mr-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {step.order_number}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-700 text-base">{step.instruction}</p>
                {step.duration_minutes && (
                  <p className="text-sm text-gray-500 mt-1">
                    Approximately {step.duration_minutes} minutes
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-gray-500 italic">No instructions found for this recipe.</p>
      )}
    </div>
  );
};

export default StepsSection;
