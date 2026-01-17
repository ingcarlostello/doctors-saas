"use client"

import { KPICards } from "./kpi-cards"
import { WeeklyCalendar } from "./weekly-calendar"

export function DashboardContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, Dr. Mitchell. Here is your practice overview.</p>
      </div>

      <KPICards />
      <WeeklyCalendar />
    </div>
  )
}
