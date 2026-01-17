import { CheckCircle2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface AppointmentSlotProps {
  patient: string
  status: "confirmed" | "pending"
  service?: string
}

export function AppointmentSlot({ patient, status, service }: AppointmentSlotProps) {
  const isConfirmed = status === "confirmed"

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-md p-2 text-xs transition-colors",
        isConfirmed ? "bg-success/10 hover:bg-success/15" : "bg-warning/10 hover:bg-warning/15",
      )}
    >
      <div className="flex items-center gap-1">
        {isConfirmed ? (
          <CheckCircle2 className="h-3 w-3 shrink-0 text-success" />
        ) : (
          <Clock className="h-3 w-3 shrink-0 text-warning" />
        )}
        <span className={cn("truncate font-medium", isConfirmed ? "text-success" : "text-warning")}>
          {isConfirmed ? "Confirmed" : "Payment Pending"}
        </span>
      </div>
      <p className="mt-1 truncate font-medium text-foreground">{patient}</p>
      {service && <p className="truncate text-muted-foreground">{service}</p>}
    </div>
  )
}
