"use client"

import { useState } from "react"
import { Clock, ChevronRight, MessageSquare, Settings } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Automation {
  id: string
  title: string
  icon: string
  trigger: string
  waitTime: string
  action: string
  enabled: boolean
  pending: number
}

interface AutomationCardProps {
  automation: Automation
}

function AutomationIcon({ type }: { type: string }) {
  const iconClass = "h-5 w-5"

  switch (type) {
    case "tooth":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2C8.5 2 6 4.5 6 7c0 2 .5 3.5 1.5 5.5S9 16 9 18c0 1.5.5 4 2 4s2-2.5 2-4c0 1.5.5 4 2 4s2-2.5 2-4c0-2 .5-3.5 1.5-5.5S20 9 20 7c0-2.5-2.5-5-8-5z" />
        </svg>
      )
    case "heart":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      )
    case "calendar":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    case "refresh":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 2v6h-6" />
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M3 22v-6h6" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        </svg>
      )
    default:
      return <Clock className={iconClass} />
  }
}

export function AutomationCard({ automation }: AutomationCardProps) {
  const [enabled, setEnabled] = useState(automation.enabled)

  return (
    <Card className={`border transition-all ${enabled ? "border-border bg-card" : "border-border/50 bg-muted/30"}`}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-4">
            <div
              className={`rounded-lg p-2.5 ${enabled ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}
            >
              <AutomationIcon type={automation.icon} />
            </div>
            <div>
              <h3 className={`font-medium ${enabled ? "text-foreground" : "text-muted-foreground"}`}>
                {automation.title}
              </h3>
              {/* Flow Logic */}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">If</span>
                <Badge variant="secondary" className="font-normal">
                  {automation.trigger}
                </Badge>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Wait</span>
                <Badge variant="secondary" className="font-normal">
                  <Clock className="mr-1 h-3 w-3" />
                  {automation.waitTime}
                </Badge>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Send</span>
                <Badge variant="secondary" className="font-normal">
                  <MessageSquare className="mr-1 h-3 w-3" />
                  {automation.action}
                </Badge>
              </div>
            </div>
          </div>

          {/* Right: Pending + Toggle + Settings */}
          <div className="flex items-center gap-4">
            {automation.pending > 0 && (
              <Badge
                variant="outline"
                className={
                  enabled
                    ? "border-warning/30 bg-warning/10 text-warning"
                    : "border-border bg-muted text-muted-foreground"
                }
              >
                {automation.pending} pending
              </Badge>
            )}
            <div className="flex items-center gap-3">
              <Switch checked={enabled} onCheckedChange={setEnabled} className="data-[state=checked]:bg-success" />
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
