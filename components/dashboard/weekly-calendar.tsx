"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AppointmentSlot } from "./appointment-slot"

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const hours = ["8:00", "9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]

type AppointmentStatus = "confirmed" | "pending"

interface Appointment {
  patient: string
  status: AppointmentStatus
  service?: string
}

// Sample appointment data
const appointments: Record<string, Record<string, Appointment>> = {
  Mon: {
    "9:00": { patient: "John Smith", status: "confirmed", service: "Check-up" },
    "11:00": { patient: "Emily Davis", status: "pending", service: "Consultation" },
    "14:00": { patient: "Michael Brown", status: "confirmed", service: "Follow-up" },
  },
  Tue: {
    "8:00": { patient: "Sarah Wilson", status: "confirmed", service: "Annual Physical" },
    "10:00": { patient: "David Lee", status: "pending", service: "Lab Review" },
    "15:00": { patient: "Jennifer Taylor", status: "confirmed", service: "Check-up" },
  },
  Wed: {
    "9:00": { patient: "Robert Martinez", status: "confirmed", service: "Consultation" },
    "13:00": { patient: "Lisa Anderson", status: "pending", service: "Follow-up" },
  },
  Thu: {
    "10:00": { patient: "James Johnson", status: "confirmed", service: "Check-up" },
    "11:00": { patient: "Maria Garcia", status: "confirmed", service: "Lab Review" },
    "16:00": { patient: "William Moore", status: "pending", service: "Consultation" },
  },
  Fri: {
    "8:00": { patient: "Elizabeth White", status: "confirmed", service: "Annual Physical" },
    "12:00": { patient: "Christopher Harris", status: "confirmed", service: "Follow-up" },
    "14:00": { patient: "Amanda Clark", status: "pending", service: "Check-up" },
  },
  Sat: {
    "9:00": { patient: "Daniel Lewis", status: "confirmed", service: "Consultation" },
  },
}

export function WeeklyCalendar() {
  const [currentDate] = useState(new Date())

  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)

    return days.map((_, index) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + index)
      return date.getDate()
    })
  }

  const weekDates = getWeekDates()
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">Weekly Schedule</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous week</span>
          </Button>
          <span className="min-w-32 text-center text-sm font-medium text-foreground">{monthName}</span>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next week</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header row with days */}
          <div className="grid grid-cols-[60px_repeat(6,1fr)] border-b border-border">
            <div className="p-2" />
            {days.map((day, index) => (
              <div key={day} className="border-l border-border p-3 text-center">
                <p className="text-xs font-medium text-muted-foreground">{day}</p>
                <p className="text-lg font-semibold text-foreground">{weekDates[index]}</p>
              </div>
            ))}
          </div>

          {/* Time slots grid */}
          <div className="grid grid-cols-[60px_repeat(6,1fr)]">
            {hours.map((hour) => (
              <div key={hour} className="contents">
                <div className="border-b border-border p-2 pr-3 text-right">
                  <span className="text-xs text-muted-foreground">{hour}</span>
                </div>
                {days.map((day) => {
                  const appointment = appointments[day]?.[hour]
                  return (
                    <div key={`${day}-${hour}`} className="min-h-[60px] border-b border-l border-border p-1">
                      {appointment && (
                        <AppointmentSlot
                          patient={appointment.patient}
                          status={appointment.status}
                          service={appointment.service}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
