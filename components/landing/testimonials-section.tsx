import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function TestimonialsSection() {
  const testimonials = [
    {
      quote: "NexCare reduced our no-show rate from 28% to just 7%. The ROI was immediate and substantial.",
      author: "Dr. Maria Santos",
      role: "Director, MediCare Clinic",
      avatar: "/professional-woman-doctor.png",
    },
    {
      quote: "The WhatsApp automation is a game-changer. Patients actually respond and confirm their appointments.",
      author: "Dr. Carlos Mendez",
      role: "Owner, Dental Plus",
      avatar: "/professional-man-dentist.jpg",
    },
    {
      quote: "We recovered over $30,000 in just the first quarter. The recall campaigns practically run themselves.",
      author: "Dra. Ana Rodriguez",
      role: "Manager, HealthFirst",
      avatar: "/professional-woman-healthcare.png",
    },
  ]

  return (
    <section id="testimonials" className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Testimonials</p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by clinics everywhere
          </h2>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.author} className="flex flex-col rounded-xl border border-border bg-card p-6">
              <blockquote className="flex-1 text-foreground leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.author} />
                  <AvatarFallback>{testimonial.author[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{testimonial.author}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
