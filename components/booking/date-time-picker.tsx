"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const availableTimes = ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"]

interface DateTimePickerProps {
  selectedDate: Date | null
  selectedTime: string | null
  onSelectDate: (date: Date) => void
  onSelectTime: (time: string) => void
  onNext: () => void
  onBack: () => void
}

export function DateTimePicker({
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  onNext,
  onBack,
}: DateTimePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (number | null)[] = []

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const days = getDaysInMonth(currentMonth)
  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const today = new Date()

  const isDateSelectable = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date >= today && date.getDay() !== 0 // Exclude Sundays and past dates
  }

  const handleDateSelect = (day: number) => {
    if (isDateSelectable(day)) {
      onSelectDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
    }
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-foreground">Select Date & Time</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Calendar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={previousMonth} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-foreground">{monthName}</span>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            {days.map((day, index) => (
              <div key={index} className="aspect-square p-0.5">
                {day !== null && (
                  <button
                    onClick={() => handleDateSelect(day)}
                    disabled={!isDateSelectable(day)}
                    className={cn(
                      "flex h-full w-full items-center justify-center rounded-md text-sm transition-colors",
                      selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth.getMonth()
                        ? "bg-primary text-primary-foreground"
                        : isDateSelectable(day)
                          ? "hover:bg-secondary text-foreground"
                          : "text-muted-foreground/40 cursor-not-allowed",
                    )}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Available Times</h3>
            <div className="grid grid-cols-3 gap-2">
              {availableTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => onSelectTime(time)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    selectedTime === time
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:bg-secondary",
                  )}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-3 pt-4">
        <Button variant="outline" className="flex-1 bg-transparent" onClick={onBack}>
          Back
        </Button>
        <Button className="flex-1" onClick={onNext} disabled={!selectedDate || !selectedTime}>
          Continue to Payment
        </Button>
      </CardFooter>
    </Card>
  )
}
