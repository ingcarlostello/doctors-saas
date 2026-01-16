"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const services = [
  { id: "checkup", name: "General Check-up", duration: "30 min", price: "$150" },
  { id: "consultation", name: "Specialist Consultation", duration: "45 min", price: "$250" },
  { id: "followup", name: "Follow-up Visit", duration: "20 min", price: "$100" },
  { id: "physical", name: "Annual Physical", duration: "60 min", price: "$350" },
]

interface DoctorProfileProps {
  selectedService: string | null
  onSelectService: (service: string) => void
  onNext: () => void
}

export function DoctorProfile({ selectedService, onSelectService, onNext }: DoctorProfileProps) {
  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="/professional-female-doctor-portrait-headshot.jpg" alt="Dr. Sarah Mitchell" />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">SM</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Dr. Sarah Mitchell</h2>
              <Badge variant="secondary" className="text-xs">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Verified
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Internal Medicine Specialist</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-warning text-warning" />
                4.9 (128 reviews)
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                New York, NY
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Board-certified internist with 15+ years of experience in preventive medicine and chronic disease
            management. Committed to providing personalized, evidence-based care.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Select a Service</h3>
          <div className="grid gap-2">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => onSelectService(service.id)}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3 text-left transition-colors",
                  selectedService === service.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary",
                )}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{service.name}</p>
                  <p className="text-xs text-muted-foreground">{service.duration}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">{service.price}</span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4">
        <Button className="w-full" onClick={onNext} disabled={!selectedService}>
          Continue to Schedule
        </Button>
      </CardFooter>
    </Card>
  )
}
