"use client"

import { useState } from "react"
import { Activity } from "lucide-react"
import { DoctorProfile } from "./doctor-profile"
import { DateTimePicker } from "./date-time-picker"
import { PaymentVerification } from "./payment-verification"
import { StepIndicator } from "./step-indicator"

const steps = [
  { id: 1, name: "Select Service" },
  { id: 2, name: "Choose Time" },
  { id: 3, name: "Payment" },
]

export function BookingFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-8">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Activity className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-semibold tracking-tight text-foreground">Zenticare</span>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={currentStep} />

      {/* Card Container */}
      <div className="mt-8 w-full max-w-md">
        {currentStep === 1 && (
          <DoctorProfile selectedService={selectedService} onSelectService={setSelectedService} onNext={handleNext} />
        )}
        {currentStep === 2 && (
          <DateTimePicker
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelectDate={setSelectedDate}
            onSelectTime={setSelectedTime}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 3 && <PaymentVerification onBack={handleBack} />}
      </div>
    </div>
  )
}
