"use client"

import { Phone, Mail, Calendar, MapPin, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

interface Patient {
  _id: string
  fullName: string
  phoneNumber: string
  email?: string
  dni: string
  lastAppointmentDate?: number
  nextAppointmentDate?: number
}

interface PatientSheetProps {
  patient: Patient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSendMessage?: () => void
}

const visitHistory = [
  { date: "Jan 8, 2026", type: "Root Canal", amount: 850 },
  { date: "Nov 15, 2025", type: "Cleaning", amount: 120 },
  { date: "Aug 22, 2025", type: "Checkup", amount: 80 },
  { date: "May 10, 2025", type: "Filling", amount: 250 },
]

const upcomingAppointments = [{ date: "Jan 22, 2026", time: "10:00 AM", type: "Follow-up" }]

const statusStyles: Record<string, string> = {
  Active: "bg-success/10 text-success border-success/20",
  Inactive: "bg-muted text-muted-foreground border-border",
  "No-Show Risk": "bg-destructive/10 text-destructive border-destructive/20",
}

export function PatientSheet({ patient, open, onOpenChange, onSendMessage }: PatientSheetProps) {
  if (!patient) return null

  // Helper to get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="space-y-4 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground">
                {getInitials(patient.fullName)}
              </div>
              <div>
                <SheetTitle className="text-xl">{patient.fullName}</SheetTitle>
                <Badge variant="outline" className="mt-1 bg-success/10 text-success border-success/20">
                  Active
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-8 py-6 px-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{patient.phoneNumber}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{patient.email || 'No email on file'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-sm font-medium text-muted-foreground w-4 text-center">ID</span>
              <span className="text-foreground">{patient.dni}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button className="flex-1">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent" onClick={onSendMessage}>
              <Phone className="mr-2 h-4 w-4" />
              Message
            </Button>
          </div>

          <Separator />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lifetime Value</p>
                <p className="mt-2 font-mono text-2xl font-semibold text-foreground">$2450</p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Visits</p>
                <p className="mt-2 font-mono text-2xl font-semibold text-foreground">12</p>
              </div>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Upcoming Appointments</h3>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map((apt, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                  >
                    <div>
                      <p className="font-medium text-foreground">{apt.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {apt.date} at {apt.time}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground font-normal">
                      Scheduled
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming appointments</p>
            )}
          </div>

          {/* Visit History */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Visit History</h3>
            <div className="space-y-3">
              {visitHistory.map((visit, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{visit.type}</p>
                    <p className="text-sm text-muted-foreground">{visit.date}</p>
                  </div>
                  <span className="font-mono text-sm font-medium text-foreground">${visit.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
