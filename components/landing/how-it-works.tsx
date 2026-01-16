import { ArrowRight } from "lucide-react"

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Connect Your Calendar",
      description:
        "Integrate with your existing practice management system in minutes. We support all major platforms.",
    },
    {
      step: "02",
      title: "Set Up Automations",
      description: "Configure WhatsApp reminders, confirmations, and recall campaigns with our visual rule builder.",
    },
    {
      step: "03",
      title: "Watch Revenue Grow",
      description: "See immediate results as no-shows decrease and patient engagement increases automatically.",
    },
  ]

  return (
    <section id="how-it-works" className="border-y border-border bg-muted/30 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">How it Works</p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Get started in three simple steps
          </h2>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {steps.map((item, index) => (
            <div key={item.step} className="relative">
              <div className="flex flex-col items-start">
                <span className="text-5xl font-bold text-muted-foreground/20">{item.step}</span>
                <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="absolute right-0 top-8 hidden h-6 w-6 text-muted-foreground/30 lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
