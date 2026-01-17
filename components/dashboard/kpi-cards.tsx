import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, UserCheck, Clock } from "lucide-react"

const kpis = [
  {
    title: "Revenue Recovered",
    value: "$12,480",
    subtitle: "This month",
    icon: DollarSign,
    trend: "+12% from last month",
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
  {
    title: "No-Shows Prevented",
    value: "24",
    subtitle: "This month",
    icon: UserCheck,
    trend: "92% confirmation rate",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
  {
    title: "Pending Recalls",
    value: "18",
    subtitle: "Patients to contact",
    icon: Clock,
    trend: "3 high priority",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
  },
]

export function KPICards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="border border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                <p className="text-2xl font-semibold tracking-tight text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
              </div>
              <div className={`rounded-lg p-2 ${kpi.iconBg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{kpi.trend}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
