export function SocialProof() {
  const stats = [
    { value: "73%", label: "reduction in no-shows", company: "MediCare Clinic" },
    { value: "$24K", label: "recovered monthly", company: "Dental Plus" },
    { value: "98%", label: "confirmation rate", company: "HealthFirst" },
    { value: "4.2x", label: "ROI in 90 days", company: "City Medical" },
  ]

  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center lg:text-left">
              <div className="text-3xl font-bold tracking-tight sm:text-4xl">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              <div className="mt-2 text-xs font-medium text-foreground">{stat.company}</div>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          <p className="text-sm text-muted-foreground">Trusted by 500+ clinics across Latin America</p>
          <div className="flex items-center gap-8">
            {["HIPAA", "SOC2", "ISO 27001"].map((cert) => (
              <span key={cert} className="text-xs font-medium text-muted-foreground">
                {cert}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
