/**
 * Onboarding Stepper Component
 * Mobile-first progress indicator for 4-step partner onboarding (IDFC-style)
 * 
 * Reuses customer UI design system (same colors, spacing, typography)
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStepperProps {
  currentStep: number; // 1-4
  totalSteps?: number;
}

const steps = [
  { number: 1, label: 'Business' },
  { number: 2, label: 'KYC' },
  { number: 3, label: 'Banking' },
  { number: 4, label: 'Catalog' },
];

export const OnboardingStepper = ({ currentStep, totalSteps = 4 }: OnboardingStepperProps) => {
  return (
    <div className="w-full py-6">
      {/* Progress bar */}
      <div className="relative">
        {/* Background line */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-border" />
        
        {/* Progress line */}
        <div 
          className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-300"
          style={{ width: `calc(${((currentStep - 1) / (totalSteps - 1)) * 100}%)` }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isCompleted = step.number < currentStep;
            const isCurrent = step.number === currentStep;
            const isUpcoming = step.number > currentStep;

            return (
              <div key={step.number} className="flex flex-col items-center gap-2">
                {/* Circle */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary bg-background text-primary",
                    isUpcoming && "border-border bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.number}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    (isCompleted || isCurrent) && "text-foreground",
                    isUpcoming && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current step text (mobile-friendly) */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </p>
      </div>
    </div>
  );
};

