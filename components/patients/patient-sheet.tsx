"use client"

import { Phone, Mail, Calendar, MapPin, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

interface Patient {
  id: string
  name: string
  phone: string
  email: string
  status: string
  lastVisit: string
  lastVisitType: string
  ltv: number
  avatar: string
}

interface PatientSheetProps {
  patient: Patient | null
  open: boolean
  onClose: () => void
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

export function PatientSheet({ patient, open, onClose }: PatientSheetProps) {
  if (!patient) return null

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="space-y-4 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground">
                {patient.avatar}
              </div>
              <div>
                <SheetTitle className="text-xl">{patient.name}</SheetTitle>
                <Badge variant="outline" className={`mt-1 ${statusStyles[patient.status]}`}>
                  {patient.status}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{patient.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{patient.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">No address on file</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Lifetime Value */}
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lifetime Value</p>
                <p className="font-mono text-2xl font-semibold text-foreground">${patient.ltv.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Upcoming Appointments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Upcoming Appointments</h3>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-3 w-3" />
                Schedule
              </Button>
            </div>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-2">
                {upcomingAppointments.map((apt, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{apt.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {apt.date} at {apt.time}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                      Scheduled
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming appointments</p>
            )}
          </div>

          <Separator />

          {/* Visit History */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Visit History</h3>
            <div className="space-y-2">
              {visitHistory.map((visit, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{visit.type}</p>
                    <p className="text-xs text-muted-foreground">{visit.date}</p>
                  </div>
                  <span className="font-mono text-sm text-foreground">${visit.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button className="flex-1">
              <Phone className="mr-2 h-4 w-4" />
              Call
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent">
              <Mail className="mr-2 h-4 w-4" />
              Message
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
