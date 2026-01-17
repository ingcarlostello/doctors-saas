import { Calendar, MessageSquare, TrendingUp, Users, Bell, Shield } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: MessageSquare,
      title: "WhatsApp Automation",
      description: "Automated appointment reminders, confirmations, and follow-ups through WhatsApp Business API.",
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "AI-powered scheduling that optimizes your calendar and reduces gaps between appointments.",
    },
    {
      icon: TrendingUp,
      title: "Revenue Recovery",
      description: "Track and recover lost revenue from no-shows with automated recall campaigns.",
    },
    {
      icon: Users,
      title: "Patient CRM",
      description: "Complete patient management with history, preferences, and engagement scoring.",
    },
    {
      icon: Bell,
      title: "Recall Campaigns",
      description: "Automated recall reminders that bring patients back for routine visits and follow-ups.",
    },
    {
      icon: Shield,
      title: "Payment Verification",
      description: "Secure payment proof uploads and verification to reduce payment disputes.",
    },
  ]

  return (
    <section id="features" className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Features</p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to eliminate no-shows
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A complete suite of tools designed specifically for medical practices.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/20 hover:shadow-lg"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
