import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Step {
  id: number
  name: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                step.id < currentStep
                  ? "bg-success text-success-foreground"
                  : step.id === currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
              )}
            >
              {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
            </div>
            <span
              className={cn(
                "hidden text-sm font-medium sm:inline",
                step.id === currentStep ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {step.name}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={cn("h-px w-8 transition-colors", step.id < currentStep ? "bg-success" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  )
}
