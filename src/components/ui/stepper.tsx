import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface StepperItem {
  id: string
  title: string
  description?: string
  optional?: boolean
}

interface StepperProps {
  steps: StepperItem[]
  currentStep: number
  className?: string
  orientation?: "horizontal" | "vertical"
  variant?: "default" | "simple"
}

export function Stepper({ 
  steps, 
  currentStep, 
  className, 
  orientation = "horizontal",
  variant = "default"
}: StepperProps) {
  if (orientation === "vertical") {
    return (
      <div className={cn("space-y-4", className)}>
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isPending = stepNumber > currentStep

          return (
            <div key={step.id} className="relative flex items-start">
              {/* Vertical line */}
              {index !== steps.length - 1 && (
                <div className="absolute left-4 top-8 w-0.5 h-8 bg-border" />
              )}
              
              {/* Step circle */}
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background text-sm font-medium",
                  {
                    "border-primary bg-primary text-primary-foreground": isCompleted,
                    "border-primary bg-background text-primary": isCurrent,
                    "border-muted-foreground bg-background text-muted-foreground": isPending
                  }
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  stepNumber
                )}
              </div>

              {/* Content */}
              <div className="ml-4 min-h-8 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <h4 className={cn("text-sm font-medium", {
                    "text-foreground": isCompleted || isCurrent,
                    "text-muted-foreground": isPending
                  })}>
                    {step.title}
                  </h4>
                  {step.optional && (
                    <span className="text-xs text-muted-foreground">(Optional)</span>
                  )}
                </div>
                {step.description && (
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isCompleted = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep
        const isPending = stepNumber > currentStep
        const isLast = index === steps.length - 1

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              {/* Step circle */}
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background text-sm font-medium",
                  {
                    "border-primary bg-primary text-primary-foreground": isCompleted,
                    "border-primary bg-background text-primary": isCurrent,
                    "border-muted-foreground bg-background text-muted-foreground": isPending
                  }
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  stepNumber
                )}
              </div>

              {/* Step content */}
              {variant === "default" && (
                <div className="mt-2 text-center max-w-32">
                  <div className="flex items-center justify-center gap-1">
                    <h4 className={cn("text-sm font-medium", {
                      "text-foreground": isCompleted || isCurrent,
                      "text-muted-foreground": isPending
                    })}>
                      {step.title}
                    </h4>
                    {step.optional && (
                      <span className="text-xs text-muted-foreground">(Optional)</span>
                    )}
                  </div>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                  )}
                </div>
              )}
            </div>

            {/* Horizontal line */}
            {!isLast && (
              <div className={cn("flex-1 h-0.5 mx-4", {
                "bg-primary": isCompleted,
                "bg-border": !isCompleted
              })} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export function SimpleStepper({ steps, currentStep, className }: Omit<StepperProps, "variant">) {
  return (
    <Stepper 
      steps={steps} 
      currentStep={currentStep} 
      className={className} 
      variant="simple" 
    />
  )
}