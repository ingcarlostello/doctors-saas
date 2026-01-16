"use client"

import { Send, CalendarCheck, DollarSign, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AutomationCard } from "./automation-card"

const roiStats = [
  {
    title: "Recall Messages Sent",
    value: "142",
    subtitle: "This month",
    icon: Send,
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
  {
    title: "Appointments Generated",
    value: "28",
    subtitle: "From recalls",
    icon: CalendarCheck,
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
  {
    title: "Revenue Recovered",
    value: "$4,200",
    subtitle: "This month",
    icon: DollarSign,
    iconBg: "bg-success/10",
    iconColor: "text-success",
    highlighted: true,
  },
]

const automations = [
  {
    id: "1",
    title: "6-Month Checkup",
    icon: "tooth",
    trigger: "Cleaning",
    waitTime: "6 Months",
    action: "WhatsApp",
    enabled: true,
    pending: 12,
  },
  {
    id: "2",
    title: "Post-Treatment Follow-up",
    icon: "heart",
    trigger: "Root Canal",
    waitTime: "1 Week",
    action: "WhatsApp",
    enabled: true,
    pending: 5,
  },
  {
    id: "3",
    title: "Annual Checkup Reminder",
    icon: "calendar",
    trigger: "Any Visit",
    waitTime: "12 Months",
    action: "WhatsApp",
    enabled: false,
    pending: 24,
  },
  {
    id: "4",
    title: "Inactive Patient Reactivation",
    icon: "refresh",
    trigger: "No Visit",
    waitTime: "3 Months",
    action: "WhatsApp",
    enabled: true,
    pending: 8,
  },
]

export function CampaignsContent() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Recall Campaigns</h1>
          <p className="text-sm text-muted-foreground">Automate patient reactivation and recover revenue</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Automation
        </Button>
      </div>

      {/* ROI Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {roiStats.map((stat) => (
          <Card
            key={stat.title}
            className={`border ${stat.highlighted ? "border-success/30 bg-success/5" : "border-border bg-card"}`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p
                    className={`text-3xl font-semibold tracking-tight ${
                      stat.highlighted ? "text-success" : "text-foreground"
                    }`}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
                <div className={`rounded-lg p-2 ${stat.iconBg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Automations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Active Automations</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {automations.filter((a) => a.enabled).length} of {automations.length} active
          </p>
        </div>

        <div className="grid gap-4">
          {automations.map((automation) => (
            <AutomationCard key={automation.id} automation={automation} />
          ))}
        </div>
      </div>
    </div>
  )
}
